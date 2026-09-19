import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTA4NTEsImV4cCI6MjEwNDAyNjg1MX0.VYawygLqHeedN48eObhphxvehVlqHNWfrFGbQTHl0tg';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

/**
 * Public client for client-side queries and anon operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service role admin client for backend operations, 
 * bypassing RLS and creating users without email confirmation (email_confirm: true)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
