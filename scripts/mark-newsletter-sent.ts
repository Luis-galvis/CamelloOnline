// Marca como "ya enviado" (last_newsletter_sent_at = now) a los suscriptores que SÍ
// recibieron el newsletter, usando la lista de los que fallaron (429) como referencia.
// Uso: npx tsx scripts/mark-newsletter-sent.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY');

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Emails que fallaron con 429 en la corrida anterior (no se marcan como enviados).
const FAILED = new Set([
  'alejag991@gmail.com', 'buriticaflorezjuansebastian@gmail.com', 'yulietholivar123@gmail.com',
  'estivencarvajalrojas@gmail.com', 'avilestatis012022@gmail.com', 'cfierro2706@gmail.com',
  'kalilinux.9808@gmail.com', 'alejobettin@gmail.com', 'zsamuel1020@gmail.com',
  'ingleso.com@gmail.com', 'hader123bravo@gmail.com', 'andresospinaclavijo@gmail.com',
  'sebaxdenc@gmail.com', 'danyelaaristizabal51@gmail.com', 'angelo.rincon@cun.edu.co',
  'camilacasallas32@gmail.com', 'sharolljohannasanchezardila@gmail.com', 'dotacionesdinicsas@gmail.com',
  'franco1997004@gmail.com', 'gabrielquinteromz@gmail.com', 'netstore110@gmail.com',
  'juanrehu1605@gmail.com', 'sharitnilavi02@gmail.com', 'santiagoari14@gmail.com',
  'vayutetu@gmail.com', 'fanisal28@gmail.com', 'cristianj.roay@ecci.edu.co', 'jcpc811@gmail.com',
].map(e => e.toLowerCase()));

async function main() {
  const { data: subs } = await supabase.from('newsletter_subscribers').select('id, email, last_newsletter_sent_at');
  const toMark = (subs || []).filter((s: any) => !FAILED.has((s.email || '').toLowerCase()) && !s.last_newsletter_sent_at);
  console.log(`Marcando ${toMark.length} suscriptores como ya enviados (los que SÍ recibieron).`);
  for (let i = 0; i < toMark.length; i += 100) {
    await supabase.from('newsletter_subscribers')
      .update({ last_newsletter_sent_at: new Date().toISOString() })
      .in('id', toMark.slice(i, i + 100).map((s: any) => s.id));
  }
  console.log('✅ Listo. Los 28 que fallaron quedan pendientes para el reenvío.');
}

main();
