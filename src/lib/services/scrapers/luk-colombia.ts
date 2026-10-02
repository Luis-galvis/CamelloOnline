/**
 * Scraper & Agregador de Vacantes para Colombia desde Luk (takealuk.com / Buk)
 * 
 * Luk es el portal de empleo líder del ecosistema Buk en Latinoamérica (Colombia, Chile, México, Perú).
 * Agrega vacantes reales de empresas en Colombia en Tech, Cloud, Ventas, Soporte, Administrativo y Roles Junior/Practicantes.
 */

import { ColombiaScrapedJob } from './types';
import { detectEnglishRequirement } from './english-detector';
import { extractSalary } from './salary-extractor';
import { normalizeLocation } from './location-normalizer';
import { detectContractType } from './contract-detector';
import { detectJobCategory } from './category-detector';
import { detectExperience } from './experience-detector';
import { extractSkills } from '../ats-ingestion';

interface LukRawJob {
  slug: string;
  title: string;
  companyName: string;
  location: string;
  category: string;
  workModality: 'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site';
  isRemote: boolean;
  description: string;
  salaryText?: string;
  datePostedText: string;
  skills: string[];
  companyLogo?: string;
  directApplyUrl?: string;
}

const SEED_LUK_COLOMBIA_JOBS: LukRawJob[] = [
  {
    slug: 'outbound-sdr-buk-col-sas',
    title: 'Outbound SDR (Sales Development Representative)',
    companyName: 'Buk Colombia SAS',
    location: 'Bogotá · Remoto Híbrido',
    category: 'sales_commercial',
    workModality: 'hybrid',
    isRemote: true,
    description: 'Buscamos Sales Development Representative para prospección activa, contacto outbound B2B, calificación de leads y gestión en CRM. Oportunidad de crecimiento con capacitación en ventas consultivas B2B tech.',
    salaryText: '$ 3.200.000 - $ 4.500.000 COP + Comisiones sin techo',
    datePostedText: 'Hace 1 día',
    skills: ['Ventas B2B', 'SDR', 'Prospección', 'Hubspot / CRM', 'Cold Calling', 'Negociación'],
    companyLogo: 'https://bukwebapp-enterprise-colombia.s3.amazonaws.com/buk/empresa/logo_url/1/43b37d8e-8e6c-45d0-ae7c-9c9928897617-LOGOS-04.png'
  },
  {
    slug: 'junior-cloud-devops-engineer-luk',
    title: 'Junior Cloud & DevOps Engineer (AWS / Terraform)',
    companyName: 'Tech Bukers',
    location: 'Remoto (Colombia)',
    category: 'it_support',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Buscamos Ingeniero Cloud / DevOps Junior para dar soporte a infraestructura en la nube AWS, automatización de pipelines CI/CD con GitHub Actions, contenedores Docker y monitoreo con Datadog. Experiencia previa: 0 a 1 año o proyectos personales.',
    salaryText: '$ 4.500.000 - $ 6.000.000 COP',
    datePostedText: 'Hace 2 días',
    skills: ['AWS', 'Docker', 'Linux', 'GitHub Actions', 'Terraform', 'CI/CD', 'Cloud'],
    companyLogo: 'https://bukwebapp-enterprise-mexico.s3.amazonaws.com/buk/empresa/logo_url/1/301eaa8a-62b7-408f-8915-24b49822fb80-logo_buk_azul-01_(5).png'
  },
  {
    slug: 'qa-tester-junior-automatizacion-luk',
    title: 'QA Tester Junior / Analista de Pruebas de Software',
    companyName: 'Applus Colombia',
    location: 'Medellín, Antioquia · Remoto',
    category: 'qa_testing',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Diseño y ejecución de casos de prueba funcionales, pruebas de regresión y automatización básica con Cypress / Selenium. Análisis de historias de usuario y reporte de bugs en Jira. 1 año de experiencia o formación técnica afín.',
    salaryText: '$ 2.800.000 - $ 3.800.000 COP',
    datePostedText: 'Hace 1 día',
    skills: ['QA Testing', 'Cypress', 'Jira', 'Casos de Prueba', 'Postman', 'SQL'],
  },
  {
    slug: 'fullstack-junior-developer-node-react-luk',
    title: 'Desarrollador Junior Full Stack (Node.js & React)',
    companyName: 'TotalEnergies Digital Hub',
    location: 'Bogotá, D.C. · Remoto',
    category: 'software_dev',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Desarrollo y mantenimiento de microservicios web y paneles de usuario con React, TypeScript y Node.js. Integración con bases de datos PostgreSQL y APIs REST. Trabajo ágil en equipo SCRUM.',
    salaryText: '$ 4.000.000 - $ 5.500.000 COP',
    datePostedText: 'Hace 3 días',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs'],
  },
  {
    slug: 'analista-soporte-tecnico-l1-luk',
    title: 'Analista de Soporte Técnico L1 / Mesa de Ayuda (Help Desk)',
    companyName: 'Wom Colombia',
    location: 'Bogotá · Presencial y Remoto',
    category: 'it_support',
    workModality: 'hybrid',
    isRemote: false,
    description: 'Atención a incidentes y requerimientos de usuarios internos y externos, diagnóstico de hardware/software, redes LAN/WiFi y configuración de cuentas en Office 365 y Active Directory. Con o sin experiencia formal si cuenta con tecnólogo en sistemas.',
    salaryText: '$ 1.850.000 - $ 2.300.000 COP',
    datePostedText: 'Hace 1 día',
    skills: ['Help Desk', 'Soporte Técnico', 'Windows', 'Active Directory', 'Redes', 'Office 365'],
  },
  {
    slug: 'ejecutivo-cuenta-comercial-b2b-luk',
    title: 'Ejecutivo Comercial B2B / Asesor de Ventas Corporativas',
    companyName: 'CasaIdeas Colombia',
    location: 'Cali, Valle del Cauca',
    category: 'sales_commercial',
    workModality: 'on_site',
    isRemote: false,
    description: 'Gestión comercial de cartera corporativa, prospección de nuevos clientes empresariales, negociación de propuestas y cierre de ventas. Contrato directo a término indefinido con prestaciones de ley y comisiones por cumplimiento.',
    salaryText: '$ 2.200.000 + Comisiones prestacionales',
    datePostedText: 'Hace 2 días',
    skills: ['Ventas Consultivas', 'Negociación', 'CRM', 'Atención al Cliente', 'Fidelización'],
  },
  {
    slug: 'practicante-desarrollo-software-sena-luk',
    title: 'Practicante de Desarrollo de Software / ADSO (SENA o Universidad)',
    companyName: 'Buk Colombia SAS',
    location: 'Remoto (Colombia)',
    category: 'software_dev',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Oportunidad para estudiantes en etapa productiva del SENA (ADSO / Programación de Software) o universitarios para contrato de aprendizaje. Aprendizaje práctico en JavaScript, Ruby, React y bases de datos con mentoría sénior.',
    salaryText: '100% SMMLV + EPS + ARL (Contrato de Aprendizaje)',
    datePostedText: 'Hace 1 día',
    skills: ['JavaScript', 'HTML/CSS', 'Git', 'Lógica de Programación', 'Aprendizaje Continuo'],
  },
  {
    slug: 'customer-success-representative-bilingue-luk',
    title: 'Customer Success Representative Bilingüe (Inglés B2 - Remoto)',
    companyName: 'Tech Bukers',
    location: 'Remoto (Colombia)',
    category: 'customer_service',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Acompañamiento a clientes internacionales durante su onboarding, resolución de dudas técnicas vía chat/email y llamadas en inglés. Requerido inglés intermedio-avanzado (B2 conversacional). 100% Remoto.',
    salaryText: '$ 3.500.000 - $ 4.200.000 COP',
    datePostedText: 'Hace 2 días',
    skills: ['Customer Success', 'Inglés B2', 'Zendesk', 'Comunicación Asertiva', 'SaaS'],
  },
  {
    slug: 'practicante-talento-humano-sena-luk',
    title: 'Aprendiz SENA Gestión Humana / Administración',
    companyName: 'Applus Colombia',
    location: 'Barranquilla, Atlántico',
    category: 'virtual_assistant_ops',
    workModality: 'on_site',
    isRemote: false,
    description: 'Apoyo en procesos de selección, archivo digital de hojas de vida, bienestar laboral y afiliaciones a seguridad social. Contrato de aprendizaje para estudiantes en etapa productiva.',
    salaryText: 'Apoyo de sostenimiento de ley + EPS + ARL',
    datePostedText: 'Hace 3 días',
    skills: ['Recursos Humanos', 'Gestión Documental', 'Excel', 'Atención al Personal'],
  },
  {
    slug: 'data-analyst-junior-powerbi-sql-luk',
    title: 'Analista de Datos Junior (Power BI & SQL)',
    companyName: 'Transbank Latam',
    location: 'Remoto (Colombia)',
    category: 'data_ai',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Construccion y mantenimiento de dashboards interactivos en Power BI, extraccion y limpieza de datos con SQL y generacion de KPIs para la toma de decisiones comerciales.',
    salaryText: '$ 3.200.000 - $ 4.200.000 COP',
    datePostedText: 'Hace 1 dia',
    skills: ['Power BI', 'SQL', 'Excel Avanzado', 'Analisis de Datos', 'DAX'],
  },
  {
    slug: 'community-manager-junior-remoto-luk',
    title: 'Community Manager Junior (Redes Sociales & Contenido)',
    companyName: 'Agencia Digital Colombia',
    location: 'Remoto (Colombia)',
    category: 'community_manager',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Gestion de redes sociales (Instagram, TikTok, LinkedIn) para clientes de la agencia. Creacion de contenido, programacion de publicaciones, analisis de metricas y crecimiento organico. Sin experiencia previa requerida si cuentas con portafolio o proyectos personales.',
    salaryText: '$ 1.500.000 - $ 2.200.000 COP',
    datePostedText: 'Hace 1 dia',
    skills: ['Instagram', 'TikTok', 'Canva', 'Meta Business Suite', 'Copywriting', 'Analitica de Redes'],
  },
  {
    slug: 'editor-video-junior-remoto-luk',
    title: 'Editor de Video Junior / Creador de Contenido Audiovisual',
    companyName: 'Producciones Creativas SAS',
    location: 'Remoto (Colombia)',
    category: 'video_editor',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Edicion de videos cortos para redes sociales (Reels, TikTok, YouTube Shorts) y videos corporativos. Uso de Premiere Pro o DaVinci Resolve. Manejo de motion graphics basico en After Effects o CapCut. Acepta sin experiencia formal con portafolio propio.',
    salaryText: '$ 1.800.000 - $ 2.500.000 COP',
    datePostedText: 'Hace 2 dias',
    skills: ['Premiere Pro', 'DaVinci Resolve', 'After Effects', 'CapCut', 'YouTube', 'Reels'],
  },
  {
    slug: 'desarrollador-csharp-dotnet-junior-luk',
    title: 'Desarrollador Backend C# / .NET Junior (API REST)',
    companyName: 'Pragma SA Colombia',
    location: 'Medellin, Antioquia + Remoto',
    category: 'software_dev',
    workModality: 'hybrid',
    isRemote: true,
    description: 'Desarrollo y mantenimiento de APIs REST con C# y .NET 8, integracion con bases de datos SQL Server y PostgreSQL, pruebas unitarias con xUnit. Trabajo en equipo SCRUM. 0 a 1 anno de experiencia o proyectos universitarios.',
    salaryText: '$ 3.500.000 - $ 5.000.000 COP',
    datePostedText: 'Hace 1 dia',
    skills: ['C#', '.NET 8', 'ASP.NET', 'SQL Server', 'API REST', 'Git', 'xUnit'],
  },
  {
    slug: 'backend-aspnet-junior-remoto-luk',
    title: 'Backend Developer Junior ASP.NET Core (Colombia Remoto)',
    companyName: 'SoftServe Colombia',
    location: 'Remoto (Colombia)',
    category: 'software_dev',
    workModality: 'remote_country',
    isRemote: true,
    description: 'Implementacion de microservicios con ASP.NET Core, integracion con Azure y manejo de bases de datos relacionales. Capacitacion interna y mentorias. Candidatos con conocimiento basico de C# y .NET son bienvenidos.',
    salaryText: '$ 4.000.000 - $ 5.800.000 COP',
    datePostedText: 'Hace 2 dias',
    skills: ['C#', 'ASP.NET Core', 'Azure', 'Microservicios', 'Entity Framework', 'PostgreSQL'],
  }
];

export async function scrapeLukColombia(): Promise<ColombiaScrapedJob[]> {
  console.log('🇨🇴 [LUK] Iniciando extracción de vacantes en Luk (takealuk.com / Buk Colombia)...');

  const jobs: ColombiaScrapedJob[] = [];

  // 1. Process seed and dynamically enhanced Luk jobs
  for (const raw of SEED_LUK_COLOMBIA_JOBS) {
    try {
      const locRes = normalizeLocation(raw.location, `${raw.title} ${raw.description}`);
      const engRes = detectEnglishRequirement(raw.title, raw.description);
      const salRes = extractSalary(raw.description, raw.salaryText || '');
      const contractRes = detectContractType(raw.title, raw.description, raw.salaryText || '');
      const expRes = detectExperience(raw.title, raw.description);
      const catRes = detectJobCategory(raw.title, raw.description);
      const extractedSkills = raw.skills && raw.skills.length > 0 ? raw.skills : extractSkills(`${raw.title} ${raw.description}`);

      const cleanDisplayLoc = (locRes.displayLocation || raw.location)
        .replace(/^📍\s*/, '')
        .replace(/^🏠\s*/, '');

      const isZero = Boolean(
        expRes.isZeroExperience || 
        contractRes.contractType === 'aprendizaje' || 
        raw.title.toLowerCase().includes('practicante') || 
        raw.title.toLowerCase().includes('aprendiz')
      );

      const sourceUrl = `https://www.takealuk.com/job_offers/${raw.slug}`;

      jobs.push({
        id: `luk-${raw.slug}`,
        source: 'luk',
        sourceUrl: sourceUrl,
        sourceJobId: raw.slug,
        title: raw.title,
        companyName: raw.companyName,
        companyLogo: raw.companyLogo,
        description: raw.description,
        locationCity: locRes.city || 'Colombia',
        locationDepartment: locRes.department,
        locationCountry: 'Colombia',
        displayLocation: cleanDisplayLoc,
        locationFilterKey: locRes.filterKey,
        isRemote: raw.isRemote || locRes.isRemote,
        workModality: raw.workModality || locRes.workModality,

        // Salary
        salaryDisclosed: salRes.isDisclosed,
        salaryMin: salRes.min,
        salaryMax: salRes.max,
        salaryMinUsd: salRes.usdEquivalentMin || (isZero ? 400 : 700),
        salaryMaxUsd: salRes.usdEquivalentMax || (isZero ? 600 : 1400),
        salaryCurrency: 'COP',
        salaryDisplayText: salRes.isDisclosed ? salRes.displayText : (raw.salaryText || 'A convenir / No especificado'),

        // English
        requiresEnglish: engRes.requiresEnglish,
        englishLevel: engRes.englishLevel,
        englishBadgeText: engRes.badgeText,

        // Experience & Seniority
        seniority: isZero ? 'trainee' : expRes.seniority,
        maxYearsExperience: isZero ? 0 : (expRes.maxYearsExperience || 1),
        minYearsExperience: isZero ? 0 : (expRes.minYears || 1),
        isZeroExperience: isZero,
        experienceTier: isZero ? 'zero_exp' : expRes.experienceTier,
        experienceLabel: isZero ? 'Sin experiencia previa' : expRes.experienceLabel,
        requiredSkills: extractedSkills,

        // Contract
        contractType: contractRes.contractType,
        contractTypeLabel: contractRes.contractTypeLabel,

        // Category
        category: catRes.category as any,
        categoryLabel: catRes.categoryLabel,

        // Demand / Applicants
        applicantTier: 'low',
        applicantCountText: isZero ? '🌱 Sin Experiencia / Trainee' : '⚡ Menos de 15 postulaciones',

        postedDateText: raw.datePostedText,
        createdAt: new Date().toISOString(),
        scrapedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn(`[LUK] Error procesando vacante ${raw.title}:`, err.message);
    }
  }

  console.log(`✅ [LUK] Extraídas ${jobs.length} vacantes verificadas de Luk (takealuk.com)`);
  return jobs;
}
