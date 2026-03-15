import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { createAuditLog } from '../middleware/auditLog';

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      name,
      code,
      address,
      city,
      state,
      phone,
      email,
      isHeadquarters,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if code already exists for this firm
    const existingBranch = await prisma.branch.findUnique({
      where: {
        firmId_code: {
          firmId: req.user.firmId!,
          code: code.toUpperCase(),
        },
      },
    });

    if (existingBranch) {
      return res.status(400).json({ error: 'Branch code already exists for this firm' });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        city,
        state,
        phone,
        email,
        isHeadquarters: isHeadquarters || false,
        firmId: req.user.firmId!,
      },
    });

    await createAuditLog(
      'CREATE',
      'Branch',
      branch.id,
      req.user.userId,
      `Created branch: ${name}`,
      undefined,
      req
    );

    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
};

export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { isActive } = req.query;

    const where: any = {
      firmId: req.user.firmId!,
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
          },
        },
      },
      orderBy: [
        { isHeadquarters: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

export const getBranchById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const branch = await prisma.branch.findFirst({
      where: {
        id,
        firmId: req.user.firmId!,
      },
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const {
      name,
      code,
      address,
      city,
      state,
      phone,
      email,
      isHeadquarters,
      isActive,
    } = req.body;

    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
        firmId: req.user.firmId!,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // If code is changing, check for uniqueness
    if (code && code.toUpperCase() !== existingBranch.code) {
      const codeExists = await prisma.branch.findUnique({
        where: {
          firmId_code: {
            firmId: req.user.firmId!,
            code: code.toUpperCase(),
          },
        },
      });

      if (codeExists) {
        return res.status(400).json({ error: 'Branch code already exists for this firm' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (isHeadquarters !== undefined) updateData.isHeadquarters = isHeadquarters;
    if (isActive !== undefined) updateData.isActive = isActive;

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Branch',
      branch.id,
      req.user.userId,
      `Updated branch: ${branch.name}`,
      { changes: updateData },
      req
    );

    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const branch = await prisma.branch.findFirst({
      where: {
        id,
        firmId: req.user.firmId!,
      },
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
          },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Prevent deletion if branch has users or cases
    if (branch._count.users > 0) {
      return res.status(400).json({ 
        error: `Cannot delete branch with ${branch._count.users} assigned user(s). Please reassign users first.` 
      });
    }

    if (branch._count.cases > 0) {
      return res.status(400).json({ 
        error: `Cannot delete branch with ${branch._count.cases} assigned case(s). Please reassign cases first.` 
      });
    }

    await prisma.branch.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Branch',
      id,
      req.user.userId,
      `Deleted branch: ${branch.name}`,
      undefined,
      req
    );

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};
