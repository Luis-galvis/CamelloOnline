// Importa los emails de los usuarios existentes (public.users) al newsletter.
// Uso: npm run tsx scripts/import-newsletter-users.ts  (o npx tsx ...)
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY');

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: users, error } = await supabase.from('users').select('email');
  if (error) { console.error('Error:', error.message); return; }

  let added = 0, skipped = 0;
  for (const u of users || []) {
    const email = (u.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    const { error: insErr } = await supabase.from('newsletter_subscribers').insert({ email });
    if (!insErr) added++;
    else if (/duplicate/i.test(insErr.message)) skipped++;
    else console.warn(`${email}: ${insErr.message}`);
  }
  console.log(`✅ Importados al newsletter: ${added} nuevos · ${skipped} ya existían`);
}

main();
