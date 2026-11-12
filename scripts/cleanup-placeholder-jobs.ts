// Marca como "expired" las vacantes basura (placeholder) que generaban scrapers viejos:
// descripciones "Convocatoria laboral para ..." con "Empresa Verificada" y modalidad inventada.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY');

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: jobs } = await supabase
    .from('job_posts')
    .select('id')
    .like('description', 'Convocatoria laboral para%');

  const ids = (jobs || []).map((j: any) => j.id);
  console.log(`Encontradas ${ids.length} vacantes placeholder.`);

  if (ids.length > 0) {
    for (let i = 0; i < ids.length; i += 100) {
      await supabase.from('job_posts').update({ status: 'expired' }).in('id', ids.slice(i, i + 100));
    }
    console.log(`✅ Marcadas como expiradas: ${ids.length}`);
  }
}

main();
