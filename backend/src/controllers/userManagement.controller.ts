import { Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

/**
 * Get all users in the firm with their approval status
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER, PARTNER
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('[GET ALL USERS] Fetching users for firm:', req.user.firmId);

    const users = await prisma.user.findMany({
      where: {
        firmId: req.user.firmId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isApproved: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { isApproved: 'asc' }, // Pending approvals first
        { createdAt: 'desc' },
      ],
    });

    console.log('[GET ALL USERS] Found users:', users.length);
    console.log('[GET ALL USERS] Users:', users.map(u => ({ email: u.email, isApproved: u.isApproved })));

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Approve a pending user
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER, PARTNER
 */
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;
    const { branchId } = req.body;

    // Get user to verify they're in the same firm
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToApprove) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToApprove.firmId !== req.user.firmId) {
      return res.status(403).json({ error: 'Cannot approve users from other firms' });
    }

    if (userToApprove.isApproved) {
      return res.status(400).json({ error: 'User is already approved' });
    }

    // For non-admin roles, require branch assignment
    const requiresBranch = !['SUPER_ADMIN', 'SENIOR_PARTNER'].includes(userToApprove.role);
    if (requiresBranch && !branchId) {
      return res.status(400).json({ error: 'Branch assignment is required for non-admin users' });
    }

    // Verify branch exists and belongs to the same firm
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });
      
      if (!branch || branch.firmId !== req.user.firmId) {
        return res.status(400).json({ error: 'Invalid branch' });
      }
    }

    // Approve the user and assign branch
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        branchId: branchId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    // Create audit log
    await createAuditLog(
      'UPDATE',
      'User',
      userId,
      req.user.userId,
      `User approved by ${req.user.email}`,
      undefined,
      req
    );

    res.json({ user: updatedUser, message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

/**
 * Reject/Delete a pending user
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER, PARTNER
 */
export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;

    // Get user to verify they're in the same firm
    const userToReject = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToReject) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToReject.firmId !== req.user.firmId) {
      return res.status(403).json({ error: 'Cannot reject users from other firms' });
    }

    if (userToReject.isApproved) {
      return res.status(400).json({ error: 'Cannot reject approved user. Use deactivate instead.' });
    }

    if (userToReject.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot reject super admin' });
    }

    // Delete the pending user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await createAuditLog(
      'DELETE',
      'User',
      userId,
      req.user.userId,
      `Pending user rejected by ${req.user.email}`,
      undefined,
      req
    );

    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
};

/**
 * Deactivate a user (soft delete - prevents login)
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER
 */
export const deactivateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;

    // Get user to verify they're in the same firm
    const userToDeactivate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDeactivate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToDeactivate.firmId !== req.user.firmId) {
      return res.status(403).json({ error: 'Cannot deactivate users from other firms' });
    }

    if (userToDeactivate.id === req.user.userId) {
      return res.status(403).json({ error: 'Cannot deactivate yourself' });
    }

    if (userToDeactivate.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot deactivate super admin' });
    }

    if (!userToDeactivate.isActive) {
      return res.status(400).json({ error: 'User is already deactivated' });
    }

    // Deactivate the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    // Create audit log
    await createAuditLog(
      'UPDATE',
      'User',
      userId,
      req.user.userId,
      `User deactivated by ${req.user.email}`,
      undefined,
      req
    );

    res.json({ user: updatedUser, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

/**
 * Reactivate a user
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER
 */
export const reactivateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;

    // Get user to verify they're in the same firm
    const userToReactivate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToReactivate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToReactivate.firmId !== req.user.firmId) {
      return res.status(403).json({ error: 'Cannot reactivate users from other firms' });
    }

    if (userToReactivate.isActive) {
      return res.status(400).json({ error: 'User is already active' });
    }

    // Reactivate the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    // Create audit log
    await createAuditLog(
      'UPDATE',
      'User',
      userId,
      req.user.userId,
      `User reactivated by ${req.user.email}`,
      undefined,
      req
    );

    res.json({ user: updatedUser, message: 'User reactivated successfully' });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
};

/**
 * Update user role
 * Only accessible by SUPER_ADMIN, SENIOR_PARTNER
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get user to verify they're in the same firm
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToUpdate.firmId !== req.user.firmId) {
      return res.status(403).json({ error: 'Cannot update users from other firms' });
    }

    if (userToUpdate.id === req.user.userId) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    if (userToUpdate.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot change super admin role' });
    }

    // Prevent creating multiple super admins
    if (role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Cannot assign SUPER_ADMIN role. Only one super admin per firm.' });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    // Create audit log
    await createAuditLog(
      'UPDATE',
      'User',
      userId,
      req.user.userId,
      `User role changed from ${userToUpdate.role} to ${role} by ${req.user.email}`,
      undefined,
      req
    );

    res.json({ user: updatedUser, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};
