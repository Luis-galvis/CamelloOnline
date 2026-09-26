import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

import fs from 'fs';
import path from 'path';

async function inspectDb() {
  const { data: jobs, error, count } = await supabase
    .from('job_posts')
    .select('id, title, max_years_experience_required, is_zero_experience, work_modality, source_ats', { count: 'exact' })
    .limit(10);

  console.log('Total job_posts in Supabase:', count);
  console.log('Error:', error);
  if (jobs && jobs.length > 0) {
    console.log('Sample 5 jobs:', jobs.slice(0, 5));
  }
}

inspectDb();
