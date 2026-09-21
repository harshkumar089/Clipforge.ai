import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

export interface JwtPayload {
  userId: string;
  email?: string;
}

/**
 * Extracts authentication token from either HTTP-only cookie or Bearer header
 */
export const extractToken = (req: Request): string | null => {
  // 1. Prefer HTTP-only secure cookie
  if (req.cookies && req.cookies[config.cookieName]) {
    return req.cookies[config.cookieName];
  }

  // 2. Fall back to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }

  return null;
};

/**
 * Strict authentication middleware: rejects unauthenticated requests with 401
 */
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in with Google.',
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (jwtErr: any) {
      res.status(401).json({
        success: false,
        message: 'Session expired or invalid token. Please sign in again.',
      });
      return;
    }

    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid session payload.',
      });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication verification error.',
    });
  }
};

/**
 * Alias for backward compatibility
 */
export const authenticate = requireAuth;
