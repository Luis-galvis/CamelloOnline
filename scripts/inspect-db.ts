import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

import fs from 'fs';
import path from 'path';

import { detectJobCategory } from '../src/lib/services/scrapers/category-detector';

async function inspectDb() {
  const { data: jobs, error, count } = await supabase
    .from('job_posts')
    .select('id, title, description, max_years_experience_required, is_zero_experience, work_modality, source_ats', { count: 'exact' });

  console.log('Total job_posts in Supabase:', count);
  
  if (jobs && jobs.length > 0) {
    const cats: Record<string, number> = {};
    const techSet = new Set(['data_ai', 'software_dev', 'qa_testing', 'it_support', 'ui_ux_product']);
    let techCount = 0;
    let nonTechCount = 0;

    for (const j of jobs) {
      const res = detectJobCategory(j.title, j.description || '');
      cats[res.category] = (cats[res.category] || 0) + 1;
      if (techSet.has(res.category)) techCount++;
      else nonTechCount++;
    }

    console.log('Categories Breakdown:', cats);
    console.log(`🚀 Total Tech: ${techCount} | Non-Tech: ${nonTechCount}`);

    const generalRemoteSample = jobs
      .filter(j => detectJobCategory(j.title, j.description || '').category === 'general_remote')
      .slice(0, 20)
      .map(j => j.title);
    console.log('Sample general_remote titles:', generalRemoteSample);
  }
}

inspectDb();
