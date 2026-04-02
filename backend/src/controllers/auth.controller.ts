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
    if (!email || !password || !firstName || !lastName || !phone) {
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

      // Auto-create the headquarters branch for the new firm
      await prisma.branch.create({
        data: {
          firmId: newFirm.id,
          name: 'Headquarters',
          code: 'HQ',
          isHeadquarters: true,
          isActive: true,
        },
      });
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

    // Create user (email verification disabled until domain is verified)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone,
        role: userRole,
        firmId: finalFirmId,
        isApproved,
        emailVerified: true,
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (createdFirmCode) {
      // New firm founder — send full onboarding email with invite code + setup steps
      await sendEmail({
        to: user.email,
        subject: '🎉 Welcome to Lawravel — Your Firm is Ready',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:36px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px;">Welcome to Lawravel</h1>
              <p style="color:#93c5fd;margin:8px 0 0;">Your legal practice management platform is ready</p>
            </div>
            <div style="padding:32px;">
              <p style="margin-top:0;">Hi <strong>${user.firstName}</strong>,</p>
              <p>Congratulations — <strong>${firmName}</strong> is now set up on Lawravel. Here's everything you need to get started:</p>

              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 6px;font-size:13px;color:#0369a1;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;">Your Firm Invite Code</p>
                <p style="font-size:28px;font-weight:bold;color:#1e3a5f;margin:0;letter-spacing:4px;">${createdFirmCode}</p>
                <p style="font-size:12px;color:#64748b;margin:8px 0 0;">Share this code with your colleagues so they can join your firm when they register.</p>
              </div>

              <h3 style="color:#1e3a5f;margin-bottom:12px;">Quick Setup Guide</h3>
              <ol style="padding-left:20px;color:#374151;line-height:2;">
                <li>Log in at <a href="${frontendUrl}/login" style="color:#2563eb;">${frontendUrl}/login</a></li>
                <li>Go to <strong>Branches</strong> and create your office locations</li>
                <li>Share your invite code with team members</li>
                <li>Approve their registrations under <strong>User Management</strong></li>
                <li>Add your first client and open a case</li>
              </ol>

              <div style="text-align:center;margin:32px 0;">
                <a href="${frontendUrl}/login" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Go to Dashboard</a>
              </div>

              <p style="color:#6b7280;font-size:13px;">Need help? Reply to this email or open a support ticket from within the platform.</p>
            </div>
            <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
            </div>
          </div>
        `,
        text: `Welcome to Lawravel!\n\nHi ${user.firstName},\n\nYour firm "${firmName}" is now set up.\n\nYour invite code: ${createdFirmCode}\n\nShare this with your colleagues so they can join your firm.\n\nLogin at: ${frontendUrl}/login`,
      }).catch(err => console.error('Failed to send onboarding email:', err));
    } else {
      // Joining existing firm — simple welcome email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Lawravel',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#1e3a5f;">Welcome, ${user.firstName}!</h2>
            <p>Your registration is ${isApproved ? 'confirmed' : 'submitted and pending approval by your firm administrator'}.</p>
            ${isApproved ? `<p style="text-align:center;margin:24px 0;"><a href="${frontendUrl}/login" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Dashboard</a></p>` : ''}
            <p style="color:#6b7280;font-size:13px;">© ${new Date().getFullYear()} Lawravel</p>
          </div>
        `,
        text: `Welcome to Lawravel, ${user.firstName}! ${isApproved ? `Login at: ${frontendUrl}/login` : 'Your account is pending approval by your firm administrator.'}`,
      }).catch(err => console.error('Failed to send welcome email:', err));
    }

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

    // Email verification disabled until domain is verified
    // if (user.role !== 'PLATFORM_ADMIN' && !user.emailVerified) {
    //   return res.status(403).json({
    //     error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
    //     requiresEmailVerification: true,
    //   });
    // }

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

// ── Verify Email ───────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token: string };
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link. Please request a new one.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// ── Resend Verification Email ──────────────────────────────────────────────
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent enumeration
    if (!user || user.emailVerified) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your Lawravel email address',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#1e3a5f;">Verify your email</h2>
          <p>Hi ${user.firstName}, click below to verify your email address. This link expires in 24 hours.</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${verifyLink}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Verify Email Address</a>
          </p>
          <p style="color:#9ca3af;font-size:12px;">If you didn't create a Lawravel account, you can ignore this email.</p>
        </div>
      `,
      text: `Verify your Lawravel email: ${verifyLink}`,
    });

    res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
};
