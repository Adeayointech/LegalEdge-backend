import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';
import { AuditAction } from '@prisma/client';

export const createAuditLog = async (
  action: AuditAction,
  entityType: string,
  entityId: string,
  userId?: string,
  description?: string,
  metadata?: any,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipAddress: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.headers['user-agent'],
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const auditMiddleware = (action: AuditAction, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      // Log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = body?.id || req.params?.id || 'unknown';
        createAuditLog(
          action,
          entityType,
          entityId,
          req.user?.userId,
          `${action} ${entityType}`,
          { body: req.body, params: req.params },
          req
        );
      }
      
      return originalJson(body);
    };
    
    next();
  };
};
