import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Get user details from users table - use supabaseAdmin to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      res.status(401).json({
        success: false,
        error: 'User not found in database',
      });
      return;
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      error: 'Super admin access required',
    });
    return;
  }

  next();
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Missing API key',
      });
      return;
    }

    // Verify API key - use supabaseAdmin to bypass RLS
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('api_key', apiKey)
      .single();

    if (error || !userData) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
      return;
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error during API key authentication',
    });
  }
};

// Middleware for web pages that redirects to login page
export const authenticateWeb = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookie
      const cookies = req.headers.cookie?.split('; ') || [];
      const authCookie = cookies.find(c => c.startsWith('auth_token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }

    if (!token) {
      // Redirect to login page for web browsers
      res.redirect('/login');
      return;
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.redirect('/login');
      return;
    }

    // Get user details from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      res.redirect('/login');
      return;
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
    };

    next();
  } catch (error) {
    res.redirect('/login');
  }
};
