import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, get, run } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'food_forecast_sustain_x_jwt_secret_2026';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  hostel?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, hostel: user.hostel },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
    return;
  }
}

export function requireRole(...allowedRoles: Array<'STUDENT' | 'STAFF' | 'ADMIN'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Requires role [${allowedRoles.join(', ')}]. Current role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
}
