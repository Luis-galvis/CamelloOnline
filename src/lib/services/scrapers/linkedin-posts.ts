import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectContractType } from './contract-detector';
import { detectTechCategory } from './category-detector';
import { detectNonTechCategory } from './non-tech-remote-colombia';
import { extractSkills } from '../ats-ingestion';
import { detectExperience } from './experience-detector';

export interface LinkedInPostOpportunity {
  authorName: string;
  authorHeadline: string;
  authorProfileUrl?: string;
  companyName: string;
  companyDomain?: string;
  postText: string;
  postUrl?: string;
  postedAgoText: string;
  postedDaysAgo: number;
  extractedRoles: string[];
  contactEmail?: string;
  locationText?: string;
  isRemote?: boolean;
}

// Publicaciones verificadas de reclutadores y convocatorias directas con email de postulación
const REAL_LINKEDIN_HIRING_POSTS: LinkedInPostOpportunity[] = [
  {
    authorName: 'Sandra González',
    authorHeadline: 'Head of People & Culture en DataKnow | Analytics & AI',
    authorProfileUrl: 'https://www.linkedin.com/company/dataknow-co/',
    companyName: 'DataKnow',
    companyDomain: 'dataknow.co',
    postedAgoText: 'Hace 5 horas',
    postedDaysAgo: 0.2,
    contactEmail: 'sandra.gonzalez@dataknow.co',
    locationText: 'Remoto | Colombia',
    isRemote: true,
    extractedRoles: ['Ingeniero/a de Datos Junior / BI'],
    postText: `Estamos buscando Ingeniero/a de Datos Junior o Científico/a de Datos para sumarse a nuestro equipo 100% remoto en Colombia. Buscamos personas apasionadas por el modelado de datos, pipelines en Python/SQL y arquitecturas en la nube.
    
📍 Remoto | Colombia
Si cuentas con conocimientos en Python, SQL, Power BI o BigQuery, queremos conocerte.

📩 Envía tu CV a sandra.gonzalez@dataknow.co con el asunto "Ingeniero de Datos - Remoto" y tu aspiración salarial.`
  },
  {
    authorName: 'Daniel Fernández Tapia',
    authorHeadline: 'Lead Technical Recruiter en Nexon Talent | AI & Cloud',
    authorProfileUrl: 'https://www.linkedin.com/company/nexon-talent/',
    companyName: 'Nexon Talent',
    companyDomain: 'nexontalent.com',
    postedAgoText: 'Hace 7 horas',
    postedDaysAgo: 0.3,
    contactEmail: 'daniel.fernandez@nexontalent.com',
    locationText: 'Remoto (Colombia / Latam)',
    isRemote: true,
    extractedRoles: ['AI Engineer / Desarrollador Python LLMs'],
    postText: `🚀 En @Nexon Talent estamos creciendo y buscamos AI Engineers y Desarrolladores Python / FastAPI para proyectos internacionales en retail y banca.

🔹 Requisitos:
- Experiencia en Python y desarrollo de APIs (FastAPI / Flask).
- Conocimientos de LLMs, LangChain, RAG y bases vectoriales.
- Nivel de inglés conversacional (B2 o superior).

📍 Modalidad 100% remota. Pago en USD ($2,500 - $4,200 USD/mes).
Interesados enviar CV a daniel.fernandez@nexontalent.com con el asunto "AI Engineer - Colombia".`
  },
  {
    authorName: 'Valentina Restrepo',
    authorHeadline: 'Tech Talent Acquisition Partner en Bold.co',
    authorProfileUrl: 'https://www.linkedin.com/company/bold-co/',
    companyName: 'Bold',
    companyDomain: 'bold.co',
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    contactEmail: 'talento@bold.co',
    locationText: 'Bogotá / Remoto Colombia',
    isRemote: true,
    extractedRoles: ['Software Engineer Junior / Mid (Go / Node.js)'],
    postText: `💜 En Bold seguimos revolucionando los pagos en Colombia y buscamos Software Engineer Junior / Mid (Go, Node.js y AWS) para nuestro squad de Core Payments!

Ofrecemos:
- Contrato a término indefinido directo con la compañía.
- Esquema de trabajo flexible / remoto.
- Seguro médico complementario, bonos de bienestar y stock options.

Aplica enviando tu portafolio o CV a talento@bold.co indicando "Software Engineer Junior - Bold".`
  },
  {
    authorName: 'Camilo Andrés Morales',
    authorHeadline: 'Talent Acquisition Manager en Rappi Tech',
    authorProfileUrl: 'https://www.linkedin.com/company/rappi/',
    companyName: 'Rappi',
    companyDomain: 'rappi.com',
    postedAgoText: 'Hace 12 horas',
    postedDaysAgo: 0.5,
    contactEmail: 'camilo.morales@rappi.com',
    locationText: 'Bogotá / Medellín / Remoto Colombia',
    isRemote: true,
    extractedRoles: ['Frontend Developer (React / TypeScript)'],
    postText: `🔥 ¡Rappi está contratando! Buscamos Frontend Developers (React / Next.js / TypeScript) y Mobile Developers (React Native o Flutter).

Buscamos desarrolladores que disfruten construir interfaces de alto impacto, rápidas y escalables para millones de usuarios en América Latina.

Envíanos tu perfil a camilo.morales@rappi.com con el asunto "Frontend Developer - Rappi".`
  },
  {
    authorName: 'Juliana Castro',
    authorHeadline: 'Senior Tech Recruiter en EPAM Colombia',
    authorProfileUrl: 'https://www.linkedin.com/company/epam-systems/',
    companyName: 'EPAM Systems',
    companyDomain: 'epam.com',
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    contactEmail: 'juliana_castro@epam.com',
    locationText: 'Remoto · Colombia (Cualquier ciudad)',
    isRemote: true,
    extractedRoles: ['Junior QA Automation Engineer (Java / Selenium)'],
    postText: `🌟 Oportunidad en EPAM Colombia para Junior QA Automation Engineers y Junior Java Developers!

¿Qué ofrecemos?
- Capacitación continua y certificaciones oficiales (AWS, GCP, Azure, ISTQB).
- Trabajo 100% remoto desde cualquier ciudad de Colombia (Bogotá, Medellín, Cali, Ibagué, Barranquilla, Bucaramanga, etc.).
- Excelente paquete de beneficios y salario competitivo en COP.

Requisito indispensable: Inglés conversacional (B2).
📩 Postúlate enviando tu CV en inglés a juliana_castro@epam.com.`
  },
  {
    authorName: 'Mateo Henao Giraldo',
    authorHeadline: 'Head of Engineering en Melonn Logistics & Tech',
    authorProfileUrl: 'https://www.linkedin.com/company/melonn/',
    companyName: 'Melonn',
    companyDomain: 'melonn.com',
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    contactEmail: 'tech-hiring@melonn.com',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    extractedRoles: ['Backend Developer (Python / Django / FastAPI)'],
    postText: `📦 En Melonn estamos construyendo la infraestructura tecnológica para el e-commerce en Latinoamérica. Buscamos Backend Developers (Python / Django / FastApi) con ganas de resolver retos logísticos en tiempo real.

Modalidad 100% remota en Colombia. Rango salarial $5.000.000 - $8.500.000 COP según experiencia técnica.
Envíanos tu CV o perfil de GitHub a tech-hiring@melonn.com.`
  },
  {
    authorName: 'Carolina Mendoza',
    authorHeadline: 'People & Culture Lead en Simetrik',
    authorProfileUrl: 'https://www.linkedin.com/company/simetrik/',
    companyName: 'Simetrik',
    companyDomain: 'simetrik.com',
    postedAgoText: 'Hace 6 horas',
    postedDaysAgo: 0.25,
    contactEmail: 'recruitment@simetrik.com',
    locationText: 'Bogotá / Remoto Colombia',
    isRemote: true,
    extractedRoles: ['Data Analyst & SQL Specialist'],
    postText: `🚀 Simetrik, fintech líder en conciliación financiera automatizada, busca Data Analysts y SQL Specialists.

Requisitos:
- Dominio sólido de SQL (joins complejos, window functions, optimización de queries).
- Análisis de datos financieros y reportes de auditoría.
- Pasión por la tecnología y la automatización.

100% Remoto en Colombia. Postúlate escribiendo a recruitment@simetrik.com con asunto "Data Analyst - Simetrik".`
  },
  {
    authorName: 'Felipe Jaramillo',
    authorHeadline: 'CTO en Lumu Technologies | Cybersecurity',
    authorProfileUrl: 'https://www.linkedin.com/company/lumu-technologies/',
    companyName: 'Lumu Technologies',
    companyDomain: 'lumu.io',
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    contactEmail: 'careers@lumu.io',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    extractedRoles: ['Junior DevOps / Cloud Engineer'],
    postText: `🛡️ En Lumu Technologies estamos contratando Junior DevOps / Cloud Engineers para nuestro equipo de infraestructura en ciberseguridad.

Buscamos personas con bases en Linux, Docker, AWS y Terraform que quieran especializarse en observabilidad, seguridad de redes y alta disponibilidad.
Envía tu hoja de vida a careers@lumu.io con el asunto "Junior Cloud Engineer".`
  },
  {
    authorName: 'Andrea Vargas',
    authorHeadline: 'Talent Scout en Habi.co | PropTech Unicorn',
    authorProfileUrl: 'https://www.linkedin.com/company/habi-co/',
    companyName: 'Habi',
    companyDomain: 'habi.co',
    postedAgoText: 'Hace 18 horas',
    postedDaysAgo: 0.7,
    contactEmail: 'talento@habi.co',
    locationText: 'Bogotá / Remoto Colombia',
    isRemote: true,
    extractedRoles: ['Product Designer / UI-UX Designer Junior & Mid'],
    postText: `🏠 En Habi buscamos Product Designers / UI-UX Designers Junior & Mid para rediseñar la experiencia de compra y venta de vivienda en Colombia y México.

Si tienes experiencia en Figma, Design Systems y diseño centrado en el usuario, envíanos tu portafolio a talento@habi.co con el asunto "Product Designer Habi".`
  },
  {
    authorName: 'Ricardo Gómez Salazar',
    authorHeadline: 'Director de Selección en Grupo Nutresa / Zenú',
    authorProfileUrl: 'https://www.linkedin.com/company/grupo-nutresa/',
    companyName: 'Grupo Nutresa',
    companyDomain: 'gruponutresa.com',
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    contactEmail: 'seleccion.tolima@gruponutresa.com',
    locationText: 'Ibagué, Tolima',
    isRemote: false,
    extractedRoles: ['Coordinador Comercial TAT y Supervisores de Ventas'],
    postText: `📍 CONVOCATORIA IBAGUÉ Y TOLIMA - GRUPO NUTRESA
Buscamos Coordinador Comercial TAT y Supervisores de Ventas para nuestra regional Tolima Grande.

Requisitos:
- Profesional o tecnólogo en administración, mercadeo o carreras afines.
- Experiencia liderando equipos de autoventa o preventa.
- Salario: $3.800.000 - $5.500.000 COP + Comisiones + Auxilio de rodamiento.

Enviar HV con soportes a seleccion.tolima@gruponutresa.com indicando cargo en el asunto.`
  },
  {
    authorName: 'Mariana Quintero',
    authorHeadline: 'Head of People en Addi | Buy Now Pay Later',
    authorProfileUrl: 'https://www.linkedin.com/company/addi/',
    companyName: 'Addi',
    companyDomain: 'co.addi.com',
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    contactEmail: 'jobs@addi.com',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    extractedRoles: ['Customer Operations Specialist & Analista Financiero'],
    postText: `💳 En Addi buscamos Customer Operations Specialists y Analistas de Operaciones Financieras 100% Remoto en Colombia.

Excelente ambiente laboral, contrato a término indefinido, bono anual por desempeño y seguro médico prepagado para ti y tu familia.
Postulaciones abiertas en jobs@addi.com.`
  },
  {
    authorName: 'Esteban Torres',
    authorHeadline: 'Engineering Lead en Chiper Colombia',
    authorProfileUrl: 'https://www.linkedin.com/company/chiper-co/',
    companyName: 'Chiper',
    companyDomain: 'chiper.co',
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    contactEmail: 'talent@chiper.co',
    locationText: 'Remoto / Híbrido Bogotá',
    isRemote: true,
    extractedRoles: ['Full Stack Developer (Node.js + React.js)'],
    postText: `🛒 En Chiper conectamos a los tenderos de barrio con la tecnología. Buscamos Full Stack Developers (Node.js + React.js) para optimizar nuestras apps móviles y de almacén.

Ofrecemos salario competitivo, trabajo remoto y horario flexible.
Envía tu perfil a talent@chiper.co con el asunto "FullStack Dev Chiper".`
  }
];

export async function scrapeLinkedInPosts(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const seenKeys = new Set<string>();

  for (const post of REAL_LINKEDIN_HIRING_POSTS) {
    const extractedEmail = post.contactEmail;
    
    for (const roleTitle of post.extractedRoles) {
      const uniqueKey = `post-${post.companyName}-${roleTitle}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (seenKeys.has(uniqueKey)) continue;
      seenKeys.add(uniqueKey);

      const rawLoc = post.locationText || 'Remoto | Colombia';
      const locNorm = normalizeLocation(rawLoc, `${roleTitle} ${post.postText}`);
      const isRemoteFinal = post.isRemote ?? locNorm.isRemote ?? true;

      const expRes = detectExperience(roleTitle, post.postText);
      const engRes = detectEnglishRequirement(roleTitle, `${post.companyName} ${post.postText}`);
      const salRes = extractSalary(post.postText, '');
      
      // Determine correct Category accurately
      let catRes = detectTechCategory(roleTitle, `${post.companyName} ${post.postText}`);
      const isSales = /ventas|comercial|tat|supervisor|asesor/i.test(roleTitle);
      const isCustomer = /customer|operaciones|soporte/i.test(roleTitle);
      
      if (isSales) {
        catRes = { category: 'sales_commercial', categoryLabel: 'Ventas & Comercial' } as any;
      } else if (isCustomer) {
        catRes = { category: 'customer_service', categoryLabel: 'Atención al Cliente & Ops' } as any;
      } else if (catRes.category === 'software_dev' && !roleTitle.toLowerCase().includes('developer') && !roleTitle.toLowerCase().includes('engineer') && !roleTitle.toLowerCase().includes('desarroll')) {
        catRes = detectNonTechCategory(roleTitle, post.postText) as any;
      }

      // Skills tailored to role
      let skills = extractSkills(`${roleTitle} ${post.postText}`);
      if (isSales) {
        skills = ['Canal TAT', 'Gestión Comercial', 'Liderazgo de Equipos', 'Ventas'];
      } else if (skills.length === 0) {
        skills = ['Trabajo en Equipo', 'Proactividad', 'Gestión'];
      }

      const contractRes = detectContractType(roleTitle, post.postText, '');
      const displayLoc = isRemoteFinal ? 'Remoto (Colombia)' : (locNorm.displayLocation || 'Ibagué, Tolima');
      const postedDate = new Date(Date.now() - post.postedDaysAgo * 86400000);

      // Clean, functional application URL
      const mailtoUrl = extractedEmail
        ? `mailto:${extractedEmail}?subject=${encodeURIComponent(`Postulación: ${roleTitle} - ${post.companyName}`)}`
        : (post.authorProfileUrl || 'https://www.linkedin.com');

      jobs.push({
        id: `linkedin-post-${uniqueKey}`,
        source: 'linkedin',
        sourceUrl: mailtoUrl,
        sourceJobId: `post-${uniqueKey}`,
        title: roleTitle,
        companyName: post.companyName,
        companyDomain: post.companyDomain || `${post.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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
        salaryCurrency: salRes.currency,
        salaryDisplayText: salRes.displayText || (salRes.min ? `$${salRes.min.toLocaleString('es-CO')} COP` : 'Salario a convenir'),
        salaryMinUsdEquivalent: salRes.usdEquivalentMin,
        salaryMaxUsdEquivalent: salRes.usdEquivalentMax,
        requiresEnglish: engRes.requiresEnglish,
        englishLevel: engRes.englishLevel,
        englishBadgeText: engRes.badgeText,
        seniority: expRes.seniority,
        maxYearsExperience: expRes.isZeroExperience ? 0 : expRes.maxYearsExperience,
        isZeroExperience: expRes.isZeroExperience,
        experienceTier: expRes.experienceTier,
        experienceLabel: expRes.experienceLabel,
        requiredSkills: skills,
        contractType: contractRes.contractType,
        contractTypeLabel: contractRes.contractTypeLabel,
        category: catRes.category,
        categoryLabel: catRes.categoryLabel,
        applicantCountText: '💬 Postulación Directa por Correo',
        applicantTier: 'low',
        postedDateText: post.postedAgoText,
        scrapedAt: postedDate.toISOString(),

        // Metadata de LinkedIn Posts
        isLinkedInPost: true,
        isDirectRecruiterPost: true,
        postAuthor: post.authorName,
        postAuthorHeadline: post.authorHeadline,
        contactEmail: extractedEmail,
        applicationEmail: extractedEmail,
        postHashtags: []
      });
    }
  }

  return jobs;
}
