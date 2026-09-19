import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TABLES = [
  'users',
  'candidate_profiles',
  'skills',
  'candidate_skills',
  'candidate_projects',
  'companies',
  'company_members',
  'job_posts',
  'job_post_skills',
  'job_applications',
  'inbound_requests',
  'conversations',
  'messages',
  'company_response_metrics'
];

async function verifyTables() {
  console.log('=== VERIFYING SUPABASE DATABASE TABLES ===\n');

  for (const table of TABLES) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table [${table}]: ERROR - ${error.message}`);
      } else {
        console.log(`✅ Table [${table}]: OK (count: ${count ?? 0})`);
      }
    } catch (e: any) {
      console.log(`❌ Table [${table}]: EXCEPTION - ${e.message}`);
    }
  }

  // Specifically check job_posts columns structure
  console.log('\n=== TESTING JOB_POSTS INSERT WITH 0 YOE & EXPERIMENTAL FIELDS ===');
  
  // Let's create a test company first to see if companies & job_posts work end to end
  const testCompanySlug = `test-co-${Date.now()}`;
  const { data: comp, error: compErr } = await supabase.from('companies').insert({
    name: 'Supabase Verified Test Co',
    slug: testCompanySlug,
    domain_email: 'test.supabase.io',
    website: 'https://supabase.io',
    industry: 'Cloud & DB',
    is_verified: true
  }).select().single();

  if (compErr) {
    console.error('Error creating test company:', compErr);
  } else {
    console.log('Created test company:', comp.id, comp.name);

    // Test inserting job post with max_years_experience_required and is_zero_experience
    const testJobSlug = `test-junior-role-${Date.now()}`;
    const { data: job, error: jobErr } = await supabase.from('job_posts').insert({
      company_id: comp.id,
      title: 'Junior Cloud Developer (0 YoE / Primer Empleo)',
      slug: testJobSlug,
      description: 'Vacante 100% Junior para talentos sin experiencia previa o con formación bootcamp.',
      work_modality: 'remote_worldwide',
      salary_min_usd: 1500,
      salary_max_usd: 2300,
      currency: 'USD',
      seniority_required: 'junior',
      english_required: 'b2_upper_intermediate',
      max_years_experience_required: 0.0,
      is_zero_experience: true,
      status: 'active'
    }).select().single();

    if (jobErr) {
      console.error('Error inserting test job post:', jobErr);
    } else {
      console.log('✅ Job post inserted successfully with new fields:', {
        id: job.id,
        title: job.title,
        max_years_experience_required: job.max_years_experience_required,
        is_zero_experience: job.is_zero_experience,
        status: job.status
      });

      // Clean up test data
      await supabase.from('job_posts').delete().eq('id', job.id);
      await supabase.from('companies').delete().eq('id', comp.id);
      console.log('Cleaned up test records.');
    }
  }
}

verifyTables();
