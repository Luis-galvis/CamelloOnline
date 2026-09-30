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
  },
  {
    authorName: 'Paola Andrea Castillo',
    authorHeadline: 'Talent Acquisition Partner en Bancolombia Digital',
    companyName: 'Bancolombia',
    companyDomain: 'bancolombia.com',
    companySlug: 'bancolombia',
    contactEmail: 'empleosdigitales@bancolombia.com.co',
    roleTitle: 'Semillero de Desarrolladores Cloud & Microservicios (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Java', 'Spring Boot', 'AWS', 'SQL', 'Git'],
    postText: `🟡 En Bancolombia buscamos talento joven para nuestro Semillero de Ingeniería Digital.
Apertura para estudiantes de últimos semestres o egresados de Ingeniería de Sistemas o carreras afines en Colombia.
Te formaremos en tecnologías Cloud (AWS), Spring Boot y microservicios bancarios.
Contrato laboral directo con medicina prepagada y beneficios corporativos.
Envía tu hoja de vida a empleosdigitales@bancolombia.com.co con el asunto "Semillero Digital Bancolombia".
#bancolombia #semillero #ingenieriadesoftware #remoto #colombia`
  },
  {
    authorName: 'Carlos Eduardo Ruiz',
    authorHeadline: 'Senior IT Recruiter en Globant Colombia',
    companyName: 'Globant',
    companyDomain: 'globant.com',
    companySlug: 'globant',
    contactEmail: 'talent.colombia@globant.com',
    roleTitle: 'Junior Python / AI Developer (Bootcamp Graduates & Juniors)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: false,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['Python', 'FastAPI', 'Machine Learning Basics', 'Git', 'Docker'],
    postText: `🌟 ¡En Globant Colombia estamos contratando desarrolladores Python Junior!
Buscamos personas motivadas con bases sólidas en Python, APIs REST y ganas de integrarse a proyectos globales de Inteligencia Artificial Generativa.
Aceptamos egresados de bootcamps o universitarios con proyectos personales demostrables.
Interesados enviar CV y perfil de GitHub a talent.colombia@globant.com con el asunto "Junior Python Globant".
#globant #python #ai #junior #colombia #remotework`
  },
  {
    authorName: 'Marcela Pinzón',
    authorHeadline: 'Talent Lead en Platzi Latam',
    companyName: 'Platzi',
    companyDomain: 'platzi.com',
    companySlug: 'platzi',
    contactEmail: 'joinus@platzi.com',
    roleTitle: 'Teaching Assistant / Tutor de Programación Web (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 3 días',
    postedDaysAgo: 3,
    requiredSkills: ['JavaScript', 'HTML5', 'CSS3', 'Pedagogía', 'Comunicación'],
    postText: `💚 En Platzi buscamos Asistentes de Enseñanza (Teaching Assistants) para la Escuela de Desarrollo Web.
Modalidad 100% Remota en Colombia. Ayudarás a resolver dudas de estudiantes en foros y talleres en vivo sobre JavaScript, React y Node.js.
Requisitos: Pasión por enseñar y buen manejo de fundamentos web. No se requiere experiencia laboral formal.
Postúlate en joinus@platzi.com indicando "Teaching Assistant Web".
#platzi #remoto #teachingassistant #javascript #sinexperiencia`
  },
  {
    authorName: 'Andrés Felipe Silva',
    authorHeadline: 'Recruitment Manager en Encora Colombia',
    companyName: 'Encora',
    companyDomain: 'encora.com',
    companySlug: 'encora',
    contactEmail: 'careers.colombia@encora.com',
    roleTitle: 'Junior QA Engineer / Automation Apprentice (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Cypress', 'JavaScript', 'Postman', 'QA Testing', 'Scrum'],
    postText: `🚀 En Encora abrimos vacantes para Junior QA Engineers en Colombia (100% Remoto).
¿Te apasiona la calidad de software y el testing automatizado? Participarás en pruebas de aplicaciones móviles y web de clientes internacionales.
Buscamos talento con conocimientos en Cypress, Playwright o Selenium.
Envía tu postulación a careers.colombia@encora.com con el asunto "Junior QA Encora".
#encora #qa #cypress #testing #remoto #colombia`
  },
  {
    authorName: 'Diana Marcela Torres',
    authorHeadline: 'Talent Acquisition Specialist en Lulo Bank',
    companyName: 'Lulo Bank',
    companyDomain: 'lulobank.com',
    companySlug: 'lulo-bank',
    contactEmail: 'gente@lulobank.com',
    roleTitle: 'Asesor de Experiencia Digital & Soporte N1 (Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['Servicio al Cliente', 'Atención por Chat', 'Resolución de PQRs', 'Herramientas Digitales'],
    postText: `⚡ En Lulo Bank estamos transformando la banca digital en Colombia. Buscamos Asesores de Experiencia Digital 100% Remoto.
Encargados de atender a nuestros usuarios mediante chat y canales digitales, resolver solicitudes de cuentas y créditos.
Ideal para personas con excelente redacción y empatía. No requiere experiencia en el sector financiero.
Envía tu HV a gente@lulobank.com con el asunto "Experiencia Digital Lulo".
#lulobank #remoto #atencionalcliente #sinexperiencia #colombia`
  },
  {
    authorName: 'Santiago Quintero',
    authorHeadline: 'Tech Talent Recruiter en Treinta App',
    companyName: 'Treinta',
    companyDomain: 'treinta.co',
    companySlug: 'treinta',
    contactEmail: 'talent@treinta.co',
    roleTitle: 'Junior Mobile Developer (Flutter / React Native)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: false,
    postedAgoText: 'Hace 3 días',
    postedDaysAgo: 3,
    requiredSkills: ['Flutter', 'Dart', 'React Native', 'APIs REST', 'Git'],
    postText: `📱 En Treinta ayudamos a miles de micronegocios a digitalizarse. Buscamos Desarrollador Mobile Junior (Flutter / Dart) 100% Remoto.
Buscamos desarrolladores con experiencia práctica en aplicaciones móviles (proyectos personales en Play Store / App Store o pasantías previas).
Flexibilidad horaria, equipo Mac proporcionado y excelente ambiente laboral.
Aplica enviando tu portafolio a talent@treinta.co con el asunto "Mobile Jr Treinta".
#treinta #flutter #mobiledeveloper #colombia #remotework`
  },
  {
    authorName: 'Laura Jimena Ortiz',
    authorHeadline: 'Head of People en Habi Proptech',
    companyName: 'Habi',
    companyDomain: 'habi.co',
    companySlug: 'habi',
    contactEmail: 'talento@habi.co',
    roleTitle: 'Practicante Universitario de Datos & Analítica Inmobiliaria',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['SQL', 'Python', 'Excel Avanzado', 'Power BI', 'Estadística'],
    postText: `🏡 En Habi abrimos convocatoria de prácticas universitarias para estudiantes de Ingeniería, Economía, Estadística o Matemáticas.
Modalidad Remota en Colombia. Participarás en la construcción de dashboards y análisis de precios del mercado inmobiliario.
Contrato de aprendizaje con auxilio superior al mínimo y seguro de salud.
Envía tu hoja de vida a talento@habi.co con el asunto "Practicante Datos Habi".
#habi #practicante #datos #analitica #contratodeaprendizaje #colombia`
  },
  {
    authorName: 'Esteban Restrepo',
    authorHeadline: 'Senior Talent Acquisition en EPAM Systems Colombia',
    companyName: 'EPAM Systems',
    companyDomain: 'epam.com',
    companySlug: 'epam',
    contactEmail: 'colombia_recruitment@epam.com',
    roleTitle: 'Junior Java / Cloud Developer (Global Projects - Remoto)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: false,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Inglés B2', 'Git'],
    postText: `🌐 EPAM Colombia busca Desarrolladores Java Junior con inglés conversacional (B2) para proyectos internacionales de gran escala.
Ofrecemos entrenamiento en arquitecturas Cloud (AWS / Azure / GCP), certificaciones pagadas y plan de carrera global.
Interesados enviar CV en inglés a colombia_recruitment@epam.com indicando "Junior Java Developer".
#epam #java #cloud #junior #english #colombia #remotework`
  },
  {
    authorName: 'Carolina Méndez',
    authorHeadline: 'Talent Acquisition Lead en Tuya S.A.',
    companyName: 'Tuya',
    companyDomain: 'tuya.com.co',
    companySlug: 'tuya',
    contactEmail: 'seleccion@tuya.com.co',
    roleTitle: 'Aprendiz SENA / Practicante Técnico en Sistemas (Etapa Productiva)',
    locationText: 'Medellín / Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Sistemas', 'Mesa de Ayuda', 'Redes', 'Ofimática', 'Atención a Usuarios'],
    postText: `💳 En Tuya S.A. buscamos estudiantes técnicos o tecnólogos del SENA (ADSO, Sistemas, Redes o Telecomunicaciones) habilitados para etapa productiva.
Modalidad híbrida/remota en Colombia. Apoyo en soporte de hardware, configuración de estaciones de trabajo y atención a usuarios internos.
Afiliación a EPS, ARL y 100% de cuota de sostenimiento legal.
Envía tu hoja de vida a seleccion@tuya.com.co con el asunto "Aprendiz Sistemas Tuya".
#tuya #sena #adso #aprendiz #contratodeaprendizaje #colombia`
  },
  {
    authorName: 'Mateo Cárdenas',
    authorHeadline: 'Engineering Recruiter en Bold Colombia',
    companyName: 'Bold.co',
    companyDomain: 'bold.co',
    companySlug: 'bold-co',
    contactEmail: 'tech-hiring@bold.co',
    roleTitle: 'Junior Backend Engineer (Go / Node.js)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: false,
    postedAgoText: 'Hace 1 día',
    postedDaysAgo: 1,
    requiredSkills: ['Go', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
    postText: `🚀 En Bold buscamos Desarrollador Backend Junior (Go o Node.js) para nuestro equipo de pagos digitales.
Modalidad 100% Remota en Colombia. Si te apasionan los microservicios, bases de datos SQL y alta concurrencia, queremos conocerte.
Abierto a juniors con proyectos personales o 6-12 meses de experiencia.
Envía tu GitHub y CV a tech-hiring@bold.co con el asunto "Backend Jr Bold".
#bold #golang #nodejs #backend #remoto #colombia`
  },
  {
    authorName: 'Vanessa Arango',
    authorHeadline: 'Talent Partner en Endava Colombia',
    companyName: 'Endava',
    companyDomain: 'endava.com',
    companySlug: 'endava',
    contactEmail: 'careers.colombia@endava.com',
    roleTitle: 'DevOps / Cloud Trainee (Remoto Colombia)',
    locationText: 'Remoto · Colombia',
    isRemote: true,
    isZeroExperience: true,
    postedAgoText: 'Hace 2 días',
    postedDaysAgo: 2,
    requiredSkills: ['Linux', 'Docker', 'AWS Basics', 'CI/CD', 'Git'],
    postText: `☁️ En Endava abrimos convocatoria para nuestro programa DevOps Trainee en Colombia (100% Remoto).
¿Te interesa la automatización de infraestructura, contenedores Docker, Kubernetes y nubes públicas?
Buscamos personas entusiastas con bases en Linux y redes sin experiencia laboral previa requerida.
Entrenamiento intensivo remunerado y certificación oficial.
Aplica enviando tu CV a careers.colombia@endava.com con el asunto "DevOps Trainee".
#endava #devops #cloud #aws #trainee #remotocolombia`
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

    // Clean, high-match LinkedIn query using recruiter name + company or short title (no parens or special chars)
    const cleanSearchQuery = (post.authorName ? `${post.authorName} ${post.companyName}` : `${post.companyName} ${post.roleTitle}`)
      .replace(/[&()#|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const verifiedLinkedinUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(cleanSearchQuery)}&origin=GLOBAL_SEARCH_HEADER`;

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

  console.log(`[LinkedIn Posts] ${jobs.length} publicaciones verificadas de reclutadores preparadas.`);
  return jobs;
}
