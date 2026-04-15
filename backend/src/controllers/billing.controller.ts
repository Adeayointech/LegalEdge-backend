import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import {
  initializePaystackPayment,
  verifyPaystackTransaction,
  getPlanMonths,
  PlanKey,
} from '../services/paystack.service';

// GET /billing/status
export const getBillingStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId! },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        gracePeriodEndsAt: true,
        lastPaymentAt: true,
      },
    });

    if (!firm) return res.status(404).json({ error: 'Firm not found' });

    res.json(firm);
  } catch (error) {
    console.error('Get billing status error:', error);
    res.status(500).json({ error: 'Failed to get billing status' });
  }
};

// POST /billing/initialize
export const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const firm = await prisma.firm.findUnique({ where: { id: req.user.firmId! } });
    if (!firm) return res.status(404).json({ error: 'Firm not found' });

    const { plan } = req.body as { plan?: PlanKey };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const result = await initializePaystackPayment(
      req.user.email,
      firm.id,
      firm.name,
      frontendUrl,
      plan ?? 'monthly'
    );

    res.json({ url: result.authorization_url, reference: result.reference });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

// GET /billing/verify/:reference
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const { reference } = req.params;
    const transaction = await verifyPaystackTransaction(reference);

    if (transaction.status === 'success') {
      const firmId = transaction.metadata?.firmId;
      if (firmId) {
        const now = new Date();
        const months = getPlanMonths(transaction.metadata?.plan);
        const subscriptionEndsAt = new Date(now);
        subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + months);

        await prisma.firm.update({
          where: { id: firmId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionEndsAt,
            gracePeriodEndsAt: null,
            lastPaymentAt: now,
            paystackCustomerCode: transaction.customer?.customer_code ?? undefined,
          },
        });
      }
    }

    res.json({ status: transaction.status });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// POST /billing/cancel
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const firm = await prisma.firm.findUnique({ where: { id: req.user.firmId! } });
    if (!firm) return res.status(404).json({ error: 'Firm not found' });

    if (firm.subscriptionStatus !== 'ACTIVE' && firm.subscriptionStatus !== 'GRACE_PERIOD') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    await prisma.firm.update({
      where: { id: req.user.firmId! },
      data: { subscriptionStatus: 'CANCELLED' },
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// POST /billing/webhook  (raw body — registered before express.json)
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const signature = req.headers['x-paystack-signature'] as string;

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const firmId = data?.metadata?.firmId;
      if (!firmId) return res.sendStatus(200);

      const now = new Date();
      const months = getPlanMonths(data?.metadata?.plan);
      const subscriptionEndsAt = new Date(now);
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + months);

      await prisma.firm.update({
        where: { id: firmId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt,
          gracePeriodEndsAt: null,
          lastPaymentAt: now,
          paystackCustomerCode: data?.customer?.customer_code ?? undefined,
        },
      });
    }

    // Always respond 200 so Paystack stops retrying
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200);
  }
};
