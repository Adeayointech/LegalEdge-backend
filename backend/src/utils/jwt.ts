import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET env var must be set and at least 32 characters long');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  id?: string;
  email: string;
  role: string;
  firmId?: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
