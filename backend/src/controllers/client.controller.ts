import { Response } from 'express';
import { ClientType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/auditLog';

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.firmId) {
      return res.status(400).json({ error: 'You must set up your law firm first. Please contact admin or set up firm in settings.' });
    }

    const {
      firstName,
      lastName,
      companyName,
      clientType,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        companyName,
        clientType: clientType || ClientType.INDIVIDUAL,
        email,
        phone,
        alternatePhone,
        address,
        city,
        state,
        firmId: req.user.firmId,
      },
    });

    await createAuditLog('CREATE', 'Client', client.id, req.user.userId, 'Created client', undefined, req);

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
};

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { search, clientType, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      firmId: req.user.firmId,
    };

    if (clientType) {
      where.clientType = clientType;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              cases: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        firmId: req.user.firmId,
      },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const client = await prisma.client.updateMany({
      where: {
        id,
        firmId: req.user.firmId,
      },
      data: updateData,
    });

    if (client.count === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await createAuditLog('UPDATE', 'Client', id, req.user.userId, 'Updated client', { changes: updateData }, req);

    const updatedClient = await prisma.client.findUnique({ where: { id } });
    res.json(updatedClient);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Check if client has cases
    const casesCount = await prisma.case.count({
      where: { clientId: id },
    });

    if (casesCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with existing cases',
        casesCount,
      });
    }

    const result = await prisma.client.deleteMany({
      where: {
        id,
        firmId: req.user.firmId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await createAuditLog('DELETE', 'Client', id, req.user.userId, 'Deleted client', undefined, req);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
