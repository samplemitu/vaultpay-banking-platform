import jwt, { JwtPayload } from 'jsonwebtoken';
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL!);

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AccessTokenPayload extends JwtPayload {
  id: string;
  role: string;
  jti: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: string;
  jti: string;
}

// 🔐 Access Token + jti
export function generateAccessToken(payload: { id: string; role: string }) {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, ACCESS_SECRET, { expiresIn: '15m' });
}

// 🔐 Refresh Token + jti (stateful)
export async function generateRefreshToken(userId: string) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti }, REFRESH_SECRET, {
    expiresIn: '7d',
  });

  await redis.set(`refresh:${userId}`, token, 'EX', 7 * 24 * 3600);
  return token;
}

// 🔍 Verify access token + blacklist check
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  const blacklisted = await redis.get(`bl:${decoded.jti}`);
  if (blacklisted) throw new Error('Token revoked');
  return decoded;
}

// 🔍 Verify refresh token supports rotation
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  const active = await redis.get(`refresh:${decoded.id}`);
  if (!active || active !== token) throw new Error('Invalid or rotated token');
  return decoded;
}

// 🔁 Rotation — overwrite redis token
export async function rotateRefreshToken(oldToken: string) {
  const decoded = jwt.verify(oldToken, REFRESH_SECRET) as RefreshTokenPayload;
  return generateRefreshToken(decoded.id);
}

export async function revokeRefreshToken(userId: string) {
  await redis.del(`refresh:${userId}`);
}
