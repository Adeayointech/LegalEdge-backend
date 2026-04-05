import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export type PlanKey = 'monthly' | 'quarterly' | 'biannual' | 'annual';

const PLAN_AMOUNTS: Record<PlanKey, number> = {
  monthly:   3000000,  // ₦30,000
  quarterly: 8000000,  // ₦80,000
  biannual:  15000000, // ₦150,000
  annual:    27000000, // ₦270,000
};

export const getPlanMonths = (plan?: string): number => {
  const months: Record<string, number> = {
    monthly: 1, quarterly: 3, biannual: 6, annual: 12,
  };
  return months[plan ?? ''] ?? 1;
};

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
  },
});

export const initializePaystackPayment = async (
  email: string,
  firmId: string,
  firmName: string,
  frontendUrl: string,
  plan: PlanKey = 'monthly'
) => {
  const response = await paystackApi.post('/transaction/initialize', {
    email,
    amount: PLAN_AMOUNTS[plan],
    metadata: { firmId, firmName, plan },
    callback_url: `${frontendUrl}/billing`,
    channels: ['card', 'bank', 'ussd', 'bank_transfer'],
  });
  return response.data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export const verifyPaystackTransaction = async (reference: string) => {
  const response = await paystackApi.get(`/transaction/verify/${reference}`);
  return response.data.data as {
    status: string;
    amount: number;
    metadata: { firmId?: string; firmName?: string; plan?: string };
    customer: { email: string; customer_code: string };
  };
};
