import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedDatabase() {
  console.log('🚀 Starting Supabase Database Seed...\n');

  // 1. Seed Skills if not present
  console.log('1. Checking and Seeding Skills...');
  const skillList = [
    { name: 'TypeScript', slug: 'typescript', category: 'Languages' },
    { name: 'JavaScript', slug: 'javascript', category: 'Languages' },
    { name: 'Python', slug: 'python', category: 'Languages' },
    { name: 'Go', slug: 'golang', category: 'Languages' },
    { name: 'React', slug: 'react', category: 'Frameworks & Libraries' },
    { name: 'Next.js', slug: 'nextjs', category: 'Frameworks & Libraries' },
    { name: 'Node.js', slug: 'nodejs', category: 'Backend & Runtime' },
    { name: 'PostgreSQL', slug: 'postgresql', category: 'Databases' },
    { name: 'Docker', slug: 'docker', category: 'DevOps & Cloud' },
    { name: 'Tailwind CSS', slug: 'tailwindcss', category: 'UI & Styling' }
  ];

  for (const s of skillList) {
    await supabase.from('skills').upsert(s, { onConflict: 'slug' });
  }
  console.log('✅ Skills catalog verified.');

  // 2. Create Users in Auth with email_confirm: true (Sin requerir verificación de correo)
  console.log('2. Creating Users with email_confirm: true...');
  
  const demoUsers = [
    {
      email: 'mateo.gomez@realjobs.dev',
      password: 'Password123!',
      role: 'candidate' as const,
      firstName: 'Mateo',
      lastName: 'Gómez'
    },
    {
      email: 'santiago.herrera@realjobs.dev',
      password: 'Password123!',
      role: 'candidate' as const,
      firstName: 'Santiago',
      lastName: 'Herrera'
    },
    {
      email: 'recruiter.elena@vercel.com',
      password: 'Password123!',
      role: 'recruiter' as const,
      firstName: 'Elena',
      lastName: 'Rostova'
    }
  ];

  const createdUserIds: Record<string, string> = {};

  for (const u of demoUsers) {
    // Try to create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // 🚀 Auto-confirmación activada
      user_metadata: { first_name: u.firstName, last_name: u.lastName, role: u.role }
    });

    let uid = authData?.user?.id;
    if (authErr) {
      // If already exists, query from users table or listUsers
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const match = existingUsers?.users?.find(usr => usr.email === u.email);
      uid = match?.id;
    }

    if (uid) {
      createdUserIds[u.email] = uid;
      await supabase.from('users').upsert({
        id: uid,
        email: u.email,
        role: u.role,
        email_verified: true,
        is_active: true
      });
      console.log(`✅ User [${u.email}] active and confirmed (ID: ${uid})`);
    }
  }

  // 3. Create Candidate Profiles
  console.log('3. Seeding Candidate Profiles...');
  const mateoId = createdUserIds['mateo.gomez@realjobs.dev'];
  if (mateoId) {
    const { data: cand1 } = await supabase.from('candidate_profiles').upsert({
      user_id: mateoId,
      first_name: 'Mateo',
      last_name: 'Gómez',
      headline: 'Junior Frontend Developer | Next.js 15, TypeScript & Tailwind CSS',
      bio: 'Graduado de Bootcamp intensivo con 1 año construyendo aplicaciones web responsivas.',
      seniority: 'junior',
      english_level: 'b2_upper_intermediate',
      years_of_experience: 1.0,
      preferred_modality: 'remote_worldwide',
      minimum_expected_salary_usd: 1400.00,
      currency: 'USD',
      is_anonymous: true,
      is_open_to_work: true,
      country_code: 'CO',
      city: 'Medellín',
      github_url: 'https://github.com/mateogomez-dev'
    }, { onConflict: 'user_id' }).select().single();

    if (cand1) {
      console.log(`✅ Candidate Profile created for Mateo Gómez (ID: ${cand1.id})`);
    }
  }

  const santiagoId = createdUserIds['santiago.herrera@realjobs.dev'];
  if (santiagoId) {
    const { data: cand2 } = await supabase.from('candidate_profiles').upsert({
      user_id: santiagoId,
      first_name: 'Santiago',
      last_name: 'Herrera',
      headline: 'Trainee Fullstack Developer | Node.js, Express & React (0 YoE)',
      bio: 'Recién graduado universitario con bases sólidas en algoritmos y bases de datos relacionales.',
      seniority: 'trainee',
      english_level: 'b1_intermediate',
      years_of_experience: 0.0,
      preferred_modality: 'remote_worldwide',
      minimum_expected_salary_usd: 800.00,
      currency: 'USD',
      is_anonymous: false,
      is_open_to_work: true,
      country_code: 'MX',
      city: 'Guadalajara',
      github_url: 'https://github.com/santiago-herrera-code'
    }, { onConflict: 'user_id' }).select().single();

    if (cand2) {
      console.log(`✅ Candidate Profile created for Santiago Herrera (ID: ${cand2.id})`);
    }
  }

  // 4. Seed Companies
  console.log('4. Seeding Verified Tech Companies...');
  const companiesData: any[] = [
    {
      name: 'Vercel Labs',
      slug: 'vercel',
      domain_email: 'vercel.com',
      website: 'https://vercel.com',
      industry: 'Cloud Infrastructure & Developer Tools',
      company_size: '201_500',
      country_code: 'US',
      city: 'San Francisco',
      is_verified: true,
      is_auto_ingested: false,
      ats_source: 'manual'
    },
    {
      name: 'Nubank Tech',
      slug: 'nubank',
      domain_email: 'nubank.com.br',
      website: 'https://nubank.com.br',
      industry: 'FinTech & Banking',
      company_size: '1000_plus',
      country_code: 'BR',
      city: 'São Paulo',
      is_verified: true,
      is_auto_ingested: false,
      ats_source: 'manual'
    },
    {
      name: 'Supabase Inc',
      slug: 'supabase',
      domain_email: 'supabase.com',
      website: 'https://supabase.com',
      industry: 'Developer Tools & Open Source',
      company_size: '51_200',
      country_code: 'SG',
      city: 'Singapore',
      is_verified: true,
      is_auto_ingested: false,
      ats_source: 'manual'
    },
    {
      name: 'Brex Engineering',
      slug: 'brex',
      domain_email: 'brex.com',
      website: 'https://brex.com',
      industry: 'Financial Services & SaaS',
      company_size: '501_1000',
      country_code: 'US',
      city: 'New York',
      is_verified: false,
      is_auto_ingested: true,
      ats_source: 'greenhouse'
    }
  ];

  const companyMap: Record<string, string> = {};

  for (const c of companiesData) {
    const { data: comp } = await supabase
      .from('companies')
      .upsert(c, { onConflict: 'slug' })
      .select()
      .single();
    if (comp) {
      companyMap[c.slug] = comp.id;
      console.log(`✅ Company [${c.name}] seeded (ID: ${comp.id})`);
    }
  }

  // 5. Seed Strict Junior Job Posts (con max_years_experience_required y is_zero_experience)
  console.log('5. Seeding Strict Junior Job Posts (0 - 2 YoE)...');
  const jobPostsData: any[] = [
    {
      company_id: companyMap['supabase'],
      title: 'Developer Advocate Intern (Primer Empleo / Sin Experiencia Requerida)',
      slug: 'developer-advocate-intern-supabase',
      description: 'Buscamos un practicante o talento sin experiencia previa apasionado por el código abierto, PostgreSQL y la creación de tutoriales técnicos. Abierto a recién graduados de bootcamp y autodidactas.',
      work_modality: 'remote_worldwide',
      salary_min_usd: 1400.00,
      salary_max_usd: 2000.00,
      currency: 'USD',
      seniority_required: 'intern',
      english_required: 'b2_upper_intermediate',
      max_years_experience_required: 0.0,
      is_zero_experience: true,
      status: 'active',
      is_auto_ingested: false,
      is_claimed: true
    },
    {
      company_id: companyMap['brex'],
      title: 'Associate Software Engineer (Early Career / Trainee)',
      slug: 'associate-software-engineer-brex',
      description: 'Programa oficial de formación para talentos graduados y autodidactas sin experiencia laboral previa obligatoria. Aprenderás desarrollo de sistemas financieros modernos, pipelines CI/CD y arquitecturas en la nube.',
      work_modality: 'remote_worldwide',
      salary_min_usd: 1500.00,
      salary_max_usd: 2200.00,
      currency: 'USD',
      seniority_required: 'trainee',
      english_required: 'b2_upper_intermediate',
      max_years_experience_required: 0.0,
      is_zero_experience: true,
      status: 'active',
      is_auto_ingested: true,
      source_ats: 'greenhouse',
      source_url: 'https://boards.greenhouse.io/brex/jobs/4829104',
      is_claimed: false
    },
    {
      company_id: companyMap['vercel'],
      title: 'Junior Frontend Engineer (React & Next.js)',
      slug: 'junior-frontend-engineer-vercel',
      description: 'Buscamos un desarrollador frontend junior apasionado por la UI, la performance web y los estándares modernos de JavaScript/TypeScript con 1 año de experiencia práctica.',
      work_modality: 'remote_worldwide',
      salary_min_usd: 1600.00,
      salary_max_usd: 2400.00,
      currency: 'USD',
      seniority_required: 'junior',
      english_required: 'b2_upper_intermediate',
      max_years_experience_required: 1.0,
      is_zero_experience: false,
      status: 'active',
      is_auto_ingested: false,
      is_claimed: true
    },
    {
      company_id: companyMap['nubank'],
      title: 'Junior Backend Developer (Go / Microservices)',
      slug: 'junior-backend-developer-nubank',
      description: 'Únete al equipo de ingeniería de pagos para construir servicios distribuidos de alta disponibilidad en Go y Kafka (1 - 2 años de experiencia requerida). Mentoría dedicada 1 a 1.',
      work_modality: 'remote_worldwide',
      salary_min_usd: 1900.00,
      salary_max_usd: 2800.00,
      currency: 'USD',
      seniority_required: 'entry_level',
      english_required: 'b2_upper_intermediate',
      max_years_experience_required: 2.0,
      is_zero_experience: false,
      status: 'active',
      is_auto_ingested: false,
      is_claimed: true
    }
  ];

  for (const job of jobPostsData) {
    if (job.company_id) {
      const { data: createdJob, error: jobErr } = await supabase
        .from('job_posts')
        .upsert(job, { onConflict: 'slug' })
        .select()
        .single();
      if (jobErr) {
        console.error(`Error creating job ${job.title}:`, jobErr);
      } else {
        console.log(`✅ Job Post [${job.title}] seeded (0-YoE Boost: ${job.is_zero_experience}, Max YoE: ${job.max_years_experience_required})`);
      }
    }
  }

  console.log('\n🎉 Supabase Database Seed Completed Successfully!');
}

seedDatabase();
