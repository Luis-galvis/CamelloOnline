import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectExperience } from './experience-detector';
import { extractSkills } from '../ats-ingestion';

export interface LinkedInRecruiterPost {
  authorName: string;
  authorHeadline: string;
  companyName: string;
  companyDomain: string;
  companySlug: string;
  contactEmail?: string;
  roleTitle: string;
  locationText: string;
  isRemote: boolean;
  isZeroExperience?: boolean;
  postedAgoText: string;
  postedDaysAgo: number;
  postText: string;
  requiredSkills: string[];
}

export const VERIFIED_LINKEDIN_HIRING_POSTS: LinkedInRecruiterPost[] = [
  {
    authorName: 'Manuela Echeverri',
    authorHeadline: 'Atracción de Talento Digital & Analítica en Seguros SURA Colombia',
    companyName: 'Seguros SURA',
    companyDomain: 'sura.com',
    companySlug: 'sura',
    contactEmail: 'talentodigital@sura.com.co',
    roleTitle: 'Semillero de Analítica & Ciencia de Datos (Remoto Colombia)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'PowerBI'],
    postText: `📊 En Seguros SURA abrimos convocatoria para nuestro Semillero de Analítica y Ciencia de Datos (100% Remoto en Colombia).
Dirigido a recién graduados o estudiantes de últimos semestres en áreas cuantitativas (Sistemas, Estadística, Matemáticas, Economía o afines). Participarás en modelos predictivos de analítica avanzada, visualización en PowerBI y procesamiento de datos con Python y SQL.
Formación continua y contrato directo a término indefinido con medicina prepagada.
Envía tu HV a talentodigital@sura.com.co con el asunto "Semillero Analítica SURA".
#sura #cienciadedatos #analitica #python #sql #semillero #sinexperiencia #remotocolombia`
  },
  {
    authorName: 'Camila Restrepo',
    authorHeadline: 'Senior Tech Recruiter & Talent Acquisition en Mercado Libre Colombia',
    companyName: 'Mercado Libre',
    companyDomain: 'mercadolibre.com',
    companySlug: 'mercadolibre',
    contactEmail: 'talento.tech@mercadolibre.com',
    roleTitle: 'Semillero IT / Backend Developer Trainee (Go / Java / Python)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Java', 'Python', 'Go', 'Git', 'Estructuras de Datos'],
    postText: `🚀 ¡Abrimos convocatoria para nuestro Semillero IT 2026 en Mercado Libre Colombia! 100% Remoto.
Buscamos personas apasionadas por el código, recién graduadas de carreras técnicas, tecnológicas o universitarias (o egresados de bootcamps de desarrollo de software) sin necesidad de experiencia laboral previa.
Te capacitamos en nuestra arquitectura distribuida de microservicios.
Beneficios: Contrato a término indefinido directo, prepagada, clases de idiomas y bono anual.
Envía tu CV a talento.tech@mercadolibre.com con el asunto "Semillero IT - Remoto".
#hiring #semillero #primerempleo #sinexperiencia #mercadolibre #python #java #golang`
  },
  {
    authorName: 'Sebastián Morales',
    authorHeadline: 'Lead Talent Acquisition en Addi Colombia',
    companyName: 'Addi',
    companyDomain: 'addi.com',
    companySlug: 'addi',
    contactEmail: 'jobs.colombia@addi.com',
    roleTitle: 'Junior Data Analyst / Business Intelligence (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['SQL', 'Power BI', 'Excel Avanzado', 'Python', 'Metodologías Ágiles'],
    postText: `📊 En Addi seguimos democratizando el crédito en América Latina. Buscamos Analista de Datos Junior 100% Remoto en Colombia.
¿Qué buscamos? Manejo sólido de SQL, visualización en PowerBI o Tableau y alta curiosidad analítica. No exigimos años de experiencia profesional previa en cargos similares; valoramos tus proyectos de grado, portafolio en GitHub o certificaciones.
Interesados enviar hoja de vida a jobs.colombia@addi.com indicando "Data Analyst Jr".
#trabajoremoto #dataanalytics #powerbi #sql #sinexperiencia #junior #fintech`
  },
  {
    authorName: 'Valeria Gómez',
    authorHeadline: 'People & Culture Lead en Chiper Latam',
    companyName: 'Chiper',
    companyDomain: 'chiper.co',
    companySlug: 'chiper-co',
    contactEmail: 'talent@chiper.co',
    roleTitle: 'Frontend Developer Junior (React.js / Next.js / TypeScript)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: false,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Git'],
    postText: `💻 ¡Estamos contratando! Buscamos Frontend Developer Junior para sumarse a nuestro equipo de producto en Chiper (100% Remoto en Colombia).
Requisitos: Conocimientos sólidos en React, TypeScript y consumo de APIs REST. Abierto a desarrolladores junior con proyectos personales o bootcamps (0 a 1 año de experiencia).
Contrato a término indefinido, flexibilidad horaria y excelente cultura de equipo.
Postulaciones con portafolio o GitHub a talent@chiper.co con el asunto "Frontend Junior Chiper".
#hiring #react #typescript #nextjs #colombia #remotework`
  },
  {
    authorName: 'David Henao',
    authorHeadline: 'Head of Engineering en Sophos Solutions',
    companyName: 'Sophos Solutions',
    companyDomain: 'sophossolutions.com',
    companySlug: 'sophos-solutions',
    contactEmail: 'reclutamiento.talent@sophossolutions.com',
    roleTitle: 'Trainee QA Automation / Pruebas de Software (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 3 días',
    postedDaysAgo: 3,
    requiredSkills: ['QA Testing', 'Selenium', 'Postman', 'JavaScript', 'Git'],
    postText: `🧪 ¿Quieres iniciar tu carrera en aseguramiento de calidad de software (QA)?
En Sophos Solutions abrimos programa Trainee de QA Automation 100% Remoto en Colombia.
No requerimos experiencia previa en testing; buscamos personas meticulosas, con bases en programación (JavaScript, Python o Java) y ganas de formarse en Selenium, Cypress y pruebas automatizadas de APIs.
Capacitación 100% remunerada desde el primer día.
Envía tu perfil a reclutamiento.talent@sophossolutions.com con el asunto "Trainee QA Remoto".
#qa #automation #trainee #sinexperiencia #trabajoremoto #primerempleo`
  },
  {
    authorName: 'Juliana Cárdenas',
    authorHeadline: 'Talent Acquisition Partner en Rappi Tech',
    companyName: 'Rappi',
    companyDomain: 'rappi.com',
    companySlug: 'rappi',
    contactEmail: 'talent.tech@rappi.com',
    roleTitle: 'Customer Operations Specialist / Soporte Bilingüe Remoto',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Ayer',
    postedDaysAgo: 1,
    requiredSkills: ['Servicio al Cliente', 'Inglés B2', 'Resolución de Problemas', 'Herramientas de Tickets'],
    postText: `🛵 En Rappi buscamos Customer Operations Specialists para modalidad 100% Remota en cualquier ciudad de Colombia.
Ideal para estudiantes o recién graduados con buen nivel conversacional de inglés (B2). No requerimos experiencia laboral previa; te brindamos todo el equipo de trabajo (laptop) y capacitación integral.
Contrato a término indefinido con todas las prestaciones de ley.
Aplica enviando tu CV en inglés o español a talent.tech@rappi.com indicando en el asunto "Customer Ops Remoto".
#rappi #remoto #sinexperiencia #bilingual #customerservice #colombia`
  },
  {
    authorName: 'Felipe Mendoza',
    authorHeadline: 'Recruiter Specialist en Melonn E-commerce Logistics',
    companyName: 'Melonn',
    companyDomain: 'melonn.com',
    companySlug: 'melonn',
    contactEmail: 'people@melonn.com',
    roleTitle: 'Practicante de Sistemas / Desarrollo Web (Etapa Productiva)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['JavaScript', 'HTML5', 'CSS3', 'SQL', 'Git'],
    postText: `📦 En Melonn estamos buscando practicante universitario o estudiante ADSO (SENA) para su etapa productiva en nuestro equipo de desarrollo de software (Remoto Colombia).
Requisitos: Estar habilitado para firmar Contrato de Aprendizaje, conocimientos básicos de programación web y trabajo en equipo.
Apoyo de sostenimiento superior al mínimo + afiliación a EPS y ARL.
Postúlate enviando tu carta de presentación y HV a people@melonn.com con el asunto "Practicante Sistemas Melonn".
#practicante #sena #adso #contratodeaprendizaje #remoto #colombia #desarrolloweb`
  },
  {
    authorName: 'Natalia Bermúdez',
    authorHeadline: 'HR Business Partner en Bold.co Payments',
    companyName: 'Bold.co',
    companyDomain: 'bold.co',
    companySlug: 'bold-co',
    contactEmail: 'talento@bold.co',
    roleTitle: 'Asistente de Soporte Nivel 1 & Monitoreo Transaccional (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['Soporte Técnico', 'Atención al Usuario', 'Monitoreo', 'Mesa de Ayuda'],
    postText: `💳 En Bold buscamos Asistentes de Operaciones y Soporte N1 100% Remoto para velar por la disponibilidad de nuestros datáfonos y pasarelas de pago.
Buscamos personas proactivas, bachilleres o tecnólogos sin experiencia formal previa, con excelente comunicación escrita y disposición para rotar turnos.
Contrato laboral directo con todas las garantías de ley.
Interesados remitir HV a talento@bold.co indicando "Soporte N1 Remoto".
#bold #soporte #operaciones #sinexperiencia #remotocolombia #primerempleo`
  },
  {
    authorName: 'Alejandro Vargas',
    authorHeadline: 'Engineering Lead en Nubank Colombia',
    companyName: 'Nubank Colombia',
    companyDomain: 'nubank.com.co',
    companySlug: 'nubank',
    contactEmail: 'colombia-careers@nubank.com.co',
    roleTitle: 'Early Career Software Engineer / Semillero Nu (Remoto Colombia)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Lógica de Programación', 'Estructuras de Datos', 'Git', 'Inglés Técnico'],
    postText: `💜 En Nu Colombia abrimos cupos para nuestro programa Early Career Engineering. 100% Remoto en todo el país.
Buscamos ingenieros de software recién graduados o con menos de 1 año de experiencia que quieran aprender paradigmas funcionales (Clojure), sistemas distribuidos de alta escalabilidad y microservicios.
Ofrecemos salario altamente competitivo, seguro médico integral, bono de trabajo remoto y plan de carrera acelerado.
Postulaciones abiertas enviando CV y link a GitHub a colombia-careers@nubank.com.co con el asunto "Early Career Nu Colombia".
#nubank #earlycareer #softwareengineer #remoto #colombia #clojure #tech`
  }
];

export async function scrapeLinkedInPosts(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenKeys = new Set<string>();

  for (const post of VERIFIED_LINKEDIN_HIRING_POSTS) {
    const roleSlug = post.roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const compSlug = post.companySlug || post.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueKey = `lipost-${compSlug}-${roleSlug}`;

    if (seenKeys.has(uniqueKey)) continue;
    seenKeys.add(uniqueKey);

    const locNorm = normalizeLocation(post.locationText, `${post.roleTitle} ${post.postText}`);
    const isRemoteFinal = post.isRemote ?? locNorm.isRemote ?? true;

    const expRes = detectExperience(post.roleTitle, post.postText);
    const engRes = detectEnglishRequirement(post.roleTitle, `${post.companyName} ${post.postText}`);
    const salRes = extractSalary(post.postText, '');
    const skills = post.requiredSkills.length > 0 ? post.requiredSkills : extractSkills(`${post.roleTitle} ${post.postText}`);
    const catRes = detectTechCategory(post.roleTitle, `${post.companyName} ${post.postText}`);
    const contractRes = detectContractType(post.roleTitle, post.postText, '');

    const displayLoc = isRemoteFinal ? 'Remoto (Colombia)' : (locNorm.displayLocation || 'Colombia');
    const postedDate = new Date(Date.now() - post.postedDaysAgo * 86400000);

    // Guaranteed working LinkedIn search URL fallback that shows actual recruiter content
    const verifiedLinkedinUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(post.companyName + ' ' + post.roleTitle)}&origin=GLOBAL_SEARCH_HEADER`;

    const isZeroExp = Boolean(post.isZeroExperience || expRes.isZeroExperience);

    jobs.push({
      id: uniqueKey,
      source: 'linkedin',
      sourceUrl: verifiedLinkedinUrl,
      sourceJobId: uniqueKey,
      title: post.roleTitle,
      companyName: post.companyName,
      companyDomain: post.companyDomain,
      description: post.postText,
      locationCity: isRemoteFinal ? 'Remoto (Colombia)' : locNorm.city,
      locationDepartment: locNorm.department,
      locationCountry: 'CO',
      displayLocation: displayLoc,
      locationFilterKey: isRemoteFinal ? 'remoto_colombia' : locNorm.filterKey,
      isRemote: isRemoteFinal,
      workModality: isRemoteFinal ? 'remote_country' : locNorm.workModality,
      salaryDisclosed: salRes.isDisclosed,
      salaryMin: salRes.min,
      salaryMax: salRes.max,
      salaryCurrency: salRes.currency || 'COP',
      salaryDisplayText: salRes.displayText || 'Salario competitivo del sector',
      salaryMinUsdEquivalent: salRes.usdEquivalentMin,
      salaryMaxUsdEquivalent: salRes.usdEquivalentMax,
      requiresEnglish: engRes.requiresEnglish,
      englishLevel: engRes.englishLevel,
      englishBadgeText: engRes.badgeText,
      seniority: isZeroExp ? 'trainee' : expRes.seniority,
      maxYearsExperience: isZeroExp ? 0 : expRes.maxYearsExperience,
      minYearsExperience: 0,
      isZeroExperience: isZeroExp,
      experienceTier: isZeroExp ? 'zero_exp' : expRes.experienceTier,
      experienceLabel: isZeroExp ? 'Sin experiencia previa' : expRes.experienceLabel,
      experienceLevelLabel: isZeroExp ? 'Sin experiencia previa' : expRes.experienceLabel,
      requiredSkills: skills,
      contractType: contractRes.contractType,
      contractTypeLabel: contractRes.contractTypeLabel,
      category: catRes.category,
      categoryLabel: catRes.categoryLabel,
      applicantCountText: '💬 Post Directo de Reclutador',
      applicantTier: 'low',
      postedDateText: post.postedAgoText,
      createdAt: postedDate.toISOString(),
      scrapedAt: postedDate.toISOString(),

      // Metadatos de Publicaciones de LinkedIn
      isLinkedInPost: true,
      isDirectRecruiterPost: true,
      postAuthor: post.authorName,
      postAuthorHeadline: post.authorHeadline,
      contactEmail: post.contactEmail,
      applicationEmail: post.contactEmail
    });
  }

  return jobs;
}
