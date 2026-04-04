import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const MONTHLY_AMOUNT_KOBO = 3000000; // ₦30,000 in kobo (Paystack uses kobo)

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
  frontendUrl: string
) => {
  const response = await paystackApi.post('/transaction/initialize', {
    email,
    amount: MONTHLY_AMOUNT_KOBO,
    metadata: { firmId, firmName },
    callback_url: `${frontendUrl}/billing?ref={PAYSTACK_REFERENCE}`,
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
    metadata: { firmId?: string; firmName?: string };
    customer: { email: string; customer_code: string };
  };
};
