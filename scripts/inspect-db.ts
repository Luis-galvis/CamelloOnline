import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectDb() {
  const { data: jobs, error } = await supabase.from('job_posts').select('*').limit(5);
  console.log('Jobs error:', error);
  console.log('Sample jobs count:', jobs?.length);
  if (jobs && jobs.length > 0) {
    console.log('Sample job keys:', Object.keys(jobs[0]));
    console.log('First job:', jobs[0]);
  }
}

inspectDb();
