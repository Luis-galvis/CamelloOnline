// Marca a TODOS los suscriptores activos como "ya enviados" (one-time, tras un envío).
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY');

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: subs } = await supabase.from('newsletter_subscribers').select('id');
  const ids = (subs || []).map((s: any) => s.id);
  for (let i = 0; i < ids.length; i += 100) {
    await supabase.from('newsletter_subscribers')
      .update({ last_newsletter_sent_at: new Date().toISOString() })
      .in('id', ids.slice(i, i + 100));
  }
  console.log(`✅ Marcados ${ids.length} suscriptores como enviados hoy.`);
}

main();
