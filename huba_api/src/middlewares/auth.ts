import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

interface AuthUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Get Core API URL from environment
const KGITON_API_URL = process.env.KGITON_API_URL || 'http://localhost:3000';

export const authenticate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);

    // Validate token by calling KGiTON Core API
    // Core API is the single source of truth for authentication
    const response = await fetch(`${KGITON_API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    const data = await response.json() as { success: boolean; data?: { id: string; email?: string } };

    if (!data.success || !data.data) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    req.user = {
      id: data.data.id,
      email: data.data.email || ''
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
