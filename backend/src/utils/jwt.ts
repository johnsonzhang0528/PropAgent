import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  company_id?: string;
}

export const generateTokens = (user: any) => {
  const payload: JWTPayload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'access-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id || user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret') as JWTPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as { id: string };
};

export const generateResetToken = (userId: string): string => {
  return jwt.sign(
    { userId, purpose: 'password-reset' },
    process.env.JWT_ACCESS_SECRET || 'access-secret',
    { expiresIn: '1h' }
  );
};

export const verifyResetToken = (token: string): { userId: string; purpose: string } => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret') as { userId: string; purpose: string };
};