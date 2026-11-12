// Marca como "ya enviados" a los candidatos con perfil y a los usuarios sin perfil,
// para que la próxima corrida NO les duplique el email (los que fallaron por 429 quedan cubiertos).
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY');

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const now = new Date().toISOString();

  const { data: profiles } = await supabase.from('candidate_profiles').select('user_id');
  const profileIds = (profiles || []).map((p: any) => p.user_id);
  for (let i = 0; i < profileIds.length; i += 100) {
    await supabase.from('candidate_profiles')
      .update({ last_jobs_email_sent_at: now })
      .in('user_id', profileIds.slice(i, i + 100));
  }

  const { data: users } = await supabase.from('users').select('id');
  const nonProfiled = (users || [])
    .map((u: any) => u.id)
    .filter((id: string) => !profileIds.includes(id));
  for (let i = 0; i < nonProfiled.length; i += 100) {
    await supabase.from('users')
      .update({ last_invite_sent_at: now })
      .in('id', nonProfiled.slice(i, i + 100));
  }

  console.log(`✅ Marcados ${profileIds.length} perfiles (match) + ${nonProfiled.length} invitaciones.`);
}

main();
