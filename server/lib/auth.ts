import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    adminEmail?: string;
    adminRole?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// Simple session-based admin auth
export async function adminLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'Utilisateur introuvable' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: 'Mot de passe incorrect' };
  }

  return {
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  req.adminUser = {
    id: req.session.adminId as number,
    email: req.session.adminEmail as string,
    role: req.session.adminRole as string,
  };
  next();
}
