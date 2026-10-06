import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey && process.env.NODE_ENV !== 'production') {
  console.warn('[SECURITY] SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno del servidor.');
}

/**
 * Cliente administrativo de Supabase con privilegios elevados (service_role).
 * AISLADO ESTRICTAMENTE AL ENTORNO DEL SERVIDOR (Node.js / Next Server Actions / Route Handlers).
 * El import 'server-only' bloquea en tiempo de compilación cualquier intento de incluir este archivo en bundles de cliente.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
