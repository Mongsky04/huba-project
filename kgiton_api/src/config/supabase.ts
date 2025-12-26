import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for general operations with RLS
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Admin client to bypass RLS for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
