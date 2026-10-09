import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { normalizeLocation } from '../src/lib/services/scrapers/location-normalizer';
import { detectExperience } from '../src/lib/services/scrapers/experience-detector';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function reclassifyAllJobs() {
  console.log('🔄 Iniciando reclasificación exhaustiva de todas las vacantes en Supabase...');

  let allJobs: any[] = [];
  let from = 0;
  const pageSize = 500;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('job_posts')
      .select('id, title, description, location_city, work_modality, is_zero_experience, max_years_experience_required, seniority_required, source_url')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching jobs:', error);
      break;
    }

    if (data && data.length > 0) {
      allJobs = allJobs.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`📦 Total vacantes cargadas para re-evaluar: ${allJobs.length}`);

  let updatedModalityCount = 0;
  let updatedExpCount = 0;
  let switchedToOnSite = 0;
  let switchedToRemote = 0;
  let zeroExpFixed = 0;

  const BATCH_SIZE = 50;
  for (let i = 0; i < allJobs.length; i += BATCH_SIZE) {
    const batch = allJobs.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (j) => {
        const fullText = `${j.title || ''} ${j.description || ''}`;
        const locResult = normalizeLocation(j.location_city || 'Colombia', fullText);
        const expResult = detectExperience(j.title || '', j.description || '');

        const newModality = locResult.workModality;
        const newCity = locResult.city;
        const newIsZeroExp = expResult.isZeroExperience;
        const rawMaxExp = newIsZeroExp ? 0 : (expResult.maxYearsExperience || 1);
        const newMaxExp = Math.min(2, Math.max(0, Math.floor(Number(rawMaxExp))));
        
        let newSeniority: 'trainee' | 'intern' | 'junior' | 'early_mid' = 'junior';
        if (newIsZeroExp) {
          newSeniority = j.seniority_required === 'intern' ? 'intern' : 'trainee';
        } else if (expResult.seniority === 'early_mid') {
          newSeniority = 'early_mid';
        } else {
          newSeniority = 'junior';
        }

        const newCountry = (locResult.country && locResult.country.length === 2) ? locResult.country : 'CO';

        const modalityChanged = j.work_modality !== newModality;
        const expChanged = j.is_zero_experience !== newIsZeroExp || Number(j.max_years_experience_required) !== newMaxExp;

        if (modalityChanged) {
          updatedModalityCount++;
          if (newModality === 'on_site' && j.work_modality && j.work_modality.includes('remote')) {
            switchedToOnSite++;
          } else if (newModality.includes('remote') && j.work_modality === 'on_site') {
            switchedToRemote++;
          }
        }

        if (expChanged) {
          updatedExpCount++;
          if (j.is_zero_experience && !newIsZeroExp) {
            zeroExpFixed++;
          }
        }

        if (modalityChanged || expChanged || j.location_city !== newCity) {
          const { error: updateErr } = await supabase
            .from('job_posts')
            .update({
              work_modality: newModality,
              location_city: newCity,
              location_country: newCountry,
              is_zero_experience: newIsZeroExp,
              max_years_experience_required: newMaxExp,
              seniority_required: newSeniority,
              updated_at: new Date().toISOString()
            })
            .eq('id', j.id);

          if (updateErr) {
            console.error(`Error updating job ${j.id}:`, updateErr.message);
          }
        }
      })
    );
  }

  console.log('✅ Reclasificación de Base de Datos Completada:');
  console.log(`- Modalidades corregidas: ${updatedModalityCount} (de remoto falso a presencial: ${switchedToOnSite})`);
  console.log(`- Experiencia corregida: ${updatedExpCount} (falsos sin-experiencia ajustados a sus años reales: ${zeroExpFixed})`);
}

reclassifyAllJobs().catch(console.error);
