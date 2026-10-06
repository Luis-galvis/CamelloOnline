import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabase-server';
import { UserRole } from '@/types';

export interface RegisterUserParams {
  email: string;
  password?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

/**
 * Creates user in Supabase Auth and Database with email verification DISABLED (email_confirm: true).
 * No confirmation link or OTP email is sent; user is immediately active and verified.
 */
export async function createUserWithoutVerification(params: RegisterUserParams) {
  const { email, password = 'Password123!', role, firstName, lastName, companyName } = params;

  // 1. Create Supabase Auth user with email_confirm: true (bypasses verification email)
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 🚀 DESACTIVA EL ENVÍO DE CORREO DE VERIFICACIÓN
    user_metadata: {
      role,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName
    }
  });

  if (authError) {
    throw new Error(`Error creating auth user: ${authError.message}`);
  }

  const userId = authUser.user.id;

  // 2. Insert into public.users table with email_verified = true
  const { data: dbUser, error: dbUserError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: userId,
      email: email.toLowerCase(),
      role,
      email_verified: true, // Inmediatamente verificado
      is_active: true
    })
    .select()
    .single();

  if (dbUserError) {
    throw new Error(`Error persisting user profile: ${dbUserError.message}`);
  }

  return {
    user: dbUser,
    authUser: authUser.user
  };
}

/**
 * Direct sign in for pre-verified users
 */
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}
