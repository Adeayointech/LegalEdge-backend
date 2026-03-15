import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const generateTwoFactorSecret = (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `LegalEdge (${email})`,
    length: 32,
  });
  
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before and after
  });
};
