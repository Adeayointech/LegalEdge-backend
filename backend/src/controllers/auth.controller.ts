import { Request, Response } from 'express';
import { UserRole, NotificationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { generateTwoFactorSecret, generateQRCode, verifyTwoFactorToken } from '../utils/twoFactor';
import { createAuditLog } from '../middleware/auditLog';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notification.service';
import { sendEmail } from '../utils/email';

const generateFirmCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.slice(0, 4) + '-' + code.slice(4); // Format: XXXX-XXXX
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, firmName, firmCode } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Must provide either firmName (create new) or firmCode (join existing)
    if (!firmName && !firmCode) {
      return res.status(400).json({ error: 'Please either create a new firm or provide a firm code to join an existing firm' });
    }

    if (firmName && firmCode) {
      return res.status(400).json({ error: 'Cannot create new firm and join existing firm at the same time' });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    let finalFirmId: string;
    let createdFirmCode: string | undefined;
    
    // Create new firm
    if (firmName) {
      let inviteCode = generateFirmCode();
      
      // Ensure code is unique
      let codeExists = await prisma.firm.findUnique({ where: { inviteCode } });
      while (codeExists) {
        inviteCode = generateFirmCode();
        codeExists = await prisma.firm.findUnique({ where: { inviteCode } });
      }
      
      const newFirm = await prisma.firm.create({
        data: {
          name: firmName,
          email: email,
          inviteCode,
        },
      });
      finalFirmId = newFirm.id;
      createdFirmCode = inviteCode;
    } 
    // Join existing firm with code
    else {
      const existingFirm = await prisma.firm.findUnique({
        where: { inviteCode: firmCode },
      });
      
      if (!existingFirm) {
        return res.status(404).json({ error: 'Invalid firm code. Please check and try again.' });
      }
      
      finalFirmId = existingFirm.id;
    }
    
    // Determine user role
    // If creating new firm, make them SUPER_ADMIN
    // If joining existing firm, make them ASSOCIATE (pending admin approval for role change)
    const userRole = firmName ? UserRole.SUPER_ADMIN : UserRole.ASSOCIATE;
    
    // Determine approval status
    // SUPER_ADMIN (firm creator) is auto-approved, others need admin approval
    const isApproved = firmName ? true : false;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: userRole,
        firmId: finalFirmId,
        isApproved,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        firmId: true,
        branchId: true,
        createdAt: true,
      },
    });
    
    // Create audit log
    await createAuditLog('CREATE', 'User', user.id, user.id, 'User registered', undefined, req);
    
    // If user needs approval, notify all approvers in the firm
    if (!isApproved) {
      const approvers = await prisma.user.findMany({
        where: {
          firmId: finalFirmId,
          role: { in: ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER'] },
          isActive: true,
        },
        select: { id: true, email: true, firstName: true },
      });

      for (const approver of approvers) {
        await createNotification({
          userId: approver.id,
          type: NotificationType.USER_APPROVAL,
          title: `New User Awaiting Approval`,
          message: `${user.firstName} ${user.lastName} (${user.email}) has registered and needs approval to access the system.`,
          entityType: 'User',
          entityId: user.id,
          sendEmail: true,
        });
      }
    }
    
    // Send welcome email to the user
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Lawravel Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to Lawravel!</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>Welcome to Lawravel - Your complete legal practice management solution.</p>
              ${isApproved ? 
                '<p>Your account is now active and you can start using the platform right away.</p>' : 
                '<p>Your account has been created successfully. An administrator will review and approve your account shortly.</p>'
              }
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>The Lawravel Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error('Failed to send welcome email:', err));

    // If user is approved (SUPER_ADMIN), generate token and log them in
    // Otherwise, return success message without token (requires approval)
    if (isApproved) {
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        firmId: user.firmId || undefined,
        branchId: user.branchId || undefined,
      });
      
      return res.status(201).json({ 
        user, 
        token,
        ...(createdFirmCode && { firmCode: createdFirmCode })
      });
    }
    
    // User needs approval - don't provide token
    res.status(201).json({ 
      message: 'Registration successful! Your account is pending admin approval. You will be able to log in once an administrator approves your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      requiresApproval: true
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);
    
    if (!email || !password) {
      console.log('[LOGIN FAILED] Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[LOGIN FAILED] User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log(`[LOGIN] User found: ${user.email}, Active: ${user.isActive}, Approved: ${user.isApproved}, Role: ${user.role}`);
    
    // Check if account is approved
    if (!user.isApproved) {
      console.log(`[LOGIN FAILED] Account pending approval: ${email}`);
      return res.status(403).json({ error: 'Your account is pending admin approval. Please contact your firm administrator.' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      console.log(`[LOGIN FAILED] Account deactivated: ${email}`);
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your firm administrator.' });
    }

    // Check if the firm is suspended (skip for PLATFORM_ADMIN — they have no firm)
    if (user.firmId && user.role !== 'PLATFORM_ADMIN') {
      const firm = await prisma.firm.findUnique({ where: { id: user.firmId }, select: { isActive: true } });
      if (firm && !firm.isActive) {
        console.log(`[LOGIN FAILED] Firm suspended for user: ${email}`);
        return res.status(403).json({ error: 'Access to this platform has been suspended for your organisation. Please contact Lawravel support.' });
      }
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    console.log(`[LOGIN] Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`[LOGIN FAILED] Invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ requiresTwoFactor: true });
      }
      
      if (!user.twoFactorSecret) {
        return res.status(500).json({ error: '2FA configuration error' });
      }
      
      const isTokenValid = verifyTwoFactorToken(twoFactorToken, user.twoFactorSecret);
      if (!isTokenValid) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.socket.remoteAddress,
      },
    });
    
    // Create audit log
    await createAuditLog('LOGIN', 'User', user.id, user.id, 'User logged in', undefined, req);
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId || undefined,
      branchId: user.branchId || undefined,
    });
    
    console.log(`[LOGIN SUCCESS] User: ${user.email}, Role: ${user.role}`);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firmId: user.firmId,
        branchId: user.branchId,
      },
      token,
    });
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isApproved: true,
        twoFactorEnabled: true,
        firmId: true,
        branchId: true,
        firm: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const setupTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate 2FA secret
    const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
    const qrCode = await generateQRCode(otpauthUrl!);
    
    // Save secret (but don't enable 2FA yet)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });
    
    res.json({
      secret,
      qrCode,
      message: 'Scan this QR code with your authenticator app',
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
};

export const enableTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up. Call /setup-2fa first' });
    }
    
    // Verify token
    const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
    
    await createAuditLog('UPDATE', 'User', user.id, user.id, '2FA enabled', undefined, req);
    
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

export const disableTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not enabled' });
    }
    
    // Verify token before disabling
    const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    
    await createAuditLog('UPDATE', 'User', user.id, user.id, '2FA disabled', undefined, req);
    
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// ── Forgot Password ────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate a cryptographically secure token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Lawravel Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="color:#1e3a5f;margin-top:0;">Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}" style="background:#1e3a5f;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a>
          </div>
          <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">Lawravel • Legal Practice Management</p>
        </div>
      `,
      text: `Reset your Lawravel password: ${resetLink}\n\nThis link expires in 1 hour.`,
    });

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// ── Reset Password ─────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    await createAuditLog('UPDATE', 'User', user.id, user.id, 'Password reset via email token', undefined, req as any);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
