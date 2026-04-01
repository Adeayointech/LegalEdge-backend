import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '../middleware/auditLog';

/**
 * Get current user's profile
 */
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
            inviteCode: true,
            address: true,
            city: true,
            state: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            email: true,
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

/**
 * Update user's own profile information
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { firstName, lastName, phone } = req.body;

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        firmId: true,
        branchId: true,
      },
    });

    await createAuditLog(
      'UPDATE',
      'User',
      updatedUser.id,
      req.user.userId,
      'Profile updated',
      { changes: updateData },
      req
    );

    res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await createAuditLog(
      'UPDATE',
      'User',
      user.id,
      req.user.userId,
      'Password changed',
      undefined,
      req
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
