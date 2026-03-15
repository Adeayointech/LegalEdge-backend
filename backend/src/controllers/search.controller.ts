import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('[SEARCH] Global search request:', req.query);

    const {
      query,
      searchType, // 'all', 'cases', 'documents', 'clients'
      status,
      caseType,
      documentType,
      branchId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const searchQuery = (query as string || '').toLowerCase();

    // Build base firm filter
    const baseFirmFilter = { firmId: req.user.firmId! };

    const results: any = {
      cases: [],
      documents: [],
      clients: [],
      totalResults: 0,
    };

    // Search Cases
    if (!searchType || searchType === 'all' || searchType === 'cases') {
      const caseWhere: any = {
        ...baseFirmFilter,
        OR: searchQuery ? [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { suitNumber: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { courtName: { contains: searchQuery, mode: 'insensitive' } },
        ] : undefined,
      };

      if (status) caseWhere.status = status;
      if (caseType) caseWhere.caseType = caseType;
      if (branchId) caseWhere.branchId = branchId;
      if (startDate) caseWhere.createdAt = { gte: new Date(startDate as string) };
      if (endDate) {
        if (caseWhere.createdAt) {
          caseWhere.createdAt.lte = new Date(endDate as string);
        } else {
          caseWhere.createdAt = { lte: new Date(endDate as string) };
        }
      }

      const [cases, casesCount] = await Promise.all([
        prisma.case.findMany({
          where: caseWhere,
          select: {
            id: true,
            title: true,
            suitNumber: true,
            status: true,
            caseType: true,
            description: true,
            courtName: true,
            filingDate: true,
            createdAt: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: searchType === 'cases' ? limitNum : 5,
          skip: searchType === 'cases' ? skip : 0,
        }),
        prisma.case.count({ where: caseWhere }),
      ]);

      results.cases = cases;
      results.casesCount = casesCount;
    }

    // Search Documents
    if (!searchType || searchType === 'all' || searchType === 'documents') {
      const documentWhere: any = {
        case: baseFirmFilter,
        OR: searchQuery ? [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { fileName: { contains: searchQuery, mode: 'insensitive' } },
        ] : undefined,
      };

      if (documentType) documentWhere.documentType = documentType;
      if (status) documentWhere.status = status;
      if (startDate) documentWhere.createdAt = { gte: new Date(startDate as string) };
      if (endDate) {
        if (documentWhere.createdAt) {
          documentWhere.createdAt.lte = new Date(endDate as string);
        } else {
          documentWhere.createdAt = { lte: new Date(endDate as string) };
        }
      }

      const [documents, documentsCount] = await Promise.all([
        prisma.document.findMany({
          where: documentWhere,
          select: {
            id: true,
            title: true,
            fileName: true,
            documentType: true,
            status: true,
            createdAt: true,
            case: {
              select: {
                id: true,
                title: true,
                suitNumber: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: searchType === 'documents' ? limitNum : 5,
          skip: searchType === 'documents' ? skip : 0,
        }),
        prisma.document.count({ where: documentWhere }),
      ]);

      results.documents = documents;
      results.documentsCount = documentsCount;
    }

    // Search Clients
    if (!searchType || searchType === 'all' || searchType === 'clients') {
      const clientWhere: any = {
        ...baseFirmFilter,
        OR: searchQuery ? [
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { companyName: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery, mode: 'insensitive' } },
        ] : undefined,
      };

      if (startDate) clientWhere.createdAt = { gte: new Date(startDate as string) };
      if (endDate) {
        if (clientWhere.createdAt) {
          clientWhere.createdAt.lte = new Date(endDate as string);
        } else {
          clientWhere.createdAt = { lte: new Date(endDate as string) };
        }
      }

      const [clients, clientsCount] = await Promise.all([
        prisma.client.findMany({
          where: clientWhere,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            clientType: true,
            createdAt: true,
            _count: {
              select: {
                cases: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: searchType === 'clients' ? limitNum : 5,
          skip: searchType === 'clients' ? skip : 0,
        }),
        prisma.client.count({ where: clientWhere }),
      ]);

      results.clients = clients;
      results.clientsCount = clientsCount;
    }

    results.totalResults = 
      (results.casesCount || 0) + 
      (results.documentsCount || 0) + 
      (results.clientsCount || 0);

    results.page = pageNum;
    results.limit = limitNum;

    console.log('[SEARCH] Search completed successfully:', {
      totalResults: results.totalResults,
      casesCount: results.casesCount,
      documentsCount: results.documentsCount,
      clientsCount: results.clientsCount,
    });

    res.json(results);
  } catch (error: any) {
    console.error('[SEARCH ERROR] Full error:', error);
    console.error('[SEARCH ERROR] Error message:', error.message);
    console.error('[SEARCH ERROR] Error stack:', error.stack);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
};
