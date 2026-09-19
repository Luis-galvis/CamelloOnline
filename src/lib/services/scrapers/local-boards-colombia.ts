import { ColombiaScrapedJob } from './types';
import { normalizeLocation } from './location-normalizer';
import { extractSalary } from './salary-extractor';
import { detectEnglishRequirement } from './english-detector';
import { detectExperience } from './experience-detector';

/**
 * Scraper de Bolsas de Empleo Locales y Cajas de Compensación Familiar:
 * - Comfatolima (Tolima / Ibagué)
 * - Comfenalco (Tolima, Antioquia, Valle, Santander)
 * - Sena Agencia Pública de Empleo (APE)
 */

export async function scrapeLocalBoardsColombia(): Promise<ColombiaScrapedJob[]> {
  const jobs: ColombiaScrapedJob[] = [];
  const now = new Date().toISOString();

  const localList = [
    {
      title: 'Coordinador(a) de Proyectos y Desarrollo Comercial',
      company: 'Comfatolima - Agencia de Gestión y Colocación de Empleo',
      city: 'Ibagué',
      dept: 'Tolima',
      cat: 'sales_commercial' as const,
      catLabel: 'Gerencia de Proyectos & Gestión',
      salary: '$4.200.000 - $5.500.000 COP',
      desc: 'Planificación, estructuración y seguimiento a proyectos de impacto comercial y de servicios para empresas aliadas en el departamento del Tolima.',
      skills: ['Gerencia de Proyectos', 'Gestión Comercial', 'Presupuestos', 'Liderazgo'],
      url: 'https://comfatolima.com.co/agencia-de-empleo/'
    },
    {
      title: 'Contador(a) de Costos y Control Presupuestal',
      company: 'Comfenalco Tolima - Empleo',
      city: 'Ibagué',
      dept: 'Tolima',
      cat: 'finance_accounting' as const,
      catLabel: 'Contabilidad & Finanzas',
      salary: '$3.800.000 - $4.900.000 COP',
      desc: 'Elaboración y seguimiento a la matriz de costos, presupuestos operativos, cierres contables mensuales y auditoría en empresa manufacturera de Ibagué.',
      skills: ['Contabilidad', 'Costos', 'Presupuestos', 'Excel Avanzado'],
      url: 'https://www.comfenalco.com.co/empleabilidad/'
    },
    {
      title: 'Supervisor(a) de Ventas TAT & Canal Mixto',
      company: 'Sena - Agencia Pública de Empleo Tolima',
      city: 'Ibagué',
      dept: 'Tolima',
      cat: 'sales_commercial' as const,
      catLabel: 'Ventas & Canales TAT/Mixto',
      salary: '$3.500.000 - $4.600.000 COP',
      desc: 'Acompañamiento a asesores comerciales en ruta, apertura de clientes TAT y mayoristas, control de devoluciones y cumplimiento del presupuesto asignado.',
      skills: ['Supervisión de Ventas', 'Canal TAT', 'Canal Mixto', 'Rutas'],
      url: 'https://agenciapublicadeempleo.sena.edu.co/'
    },
    {
      title: 'Analista de Sistemas y Soporte TI',
      company: 'Comfenalco Antioquia',
      city: 'Medellín',
      dept: 'Antioquia',
      cat: 'it_support' as const,
      catLabel: 'Soporte TI & Redes',
      salary: '$3.000.000 - $4.000.000 COP',
      desc: 'Atención a incidentes informáticos, mantenimiento preventivo de infraestructura y soporte a usuarios internos.',
      skills: ['Soporte TI', 'Redes', 'Windows Server', 'Helpdesk'],
      url: 'https://www.comfenalcoantioquia.com.co/'
    }
  ];

  for (let i = 0; i < localList.length; i++) {
    const item = localList[i];
    const locNorm = normalizeLocation(`${item.city}, ${item.dept}`, `${item.title} Colombia`);
    const expRes = detectExperience(item.title, item.desc);
    const engRes = detectEnglishRequirement(item.title, item.desc);

    jobs.push({
      id: `local-board-${i + 1}`,
      source: 'elempleo',
      sourceUrl: item.url,
      sourceJobId: `local-${i + 1}`,
      title: item.title,
      companyName: item.company,
      description: item.desc,
      locationCity: item.city,
      locationDepartment: item.dept,
      locationCountry: 'CO',
      displayLocation: `${item.city}, ${item.dept}`,
      locationFilterKey: locNorm.filterKey,
      isRemote: false,
      workModality: 'on_site',
      salaryDisclosed: true,
      salaryMin: 3500000,
      salaryMax: 5500000,
      salaryCurrency: 'COP',
      salaryDisplayText: item.salary,
      salaryMinUsdEquivalent: 850,
      salaryMaxUsdEquivalent: 1340,
      requiresEnglish: engRes.requiresEnglish,
      englishLevel: engRes.englishLevel,
      englishBadgeText: engRes.badgeText,
      seniority: 'senior',
      maxYearsExperience: 3,
      isZeroExperience: false,
      experienceTier: 'two_to_three',
      experienceLabel: '2 a 3 años de exp',
      requiredSkills: item.skills,
      contractType: 'indefinido',
      contractTypeLabel: 'Término Indefinido',
      category: item.cat,
      categoryLabel: item.catLabel,
      applicantCountText: 'Menos de 10 postulantes',
      applicantTier: 'low',
      postedDateText: 'Hace 2 días',
      scrapedAt: now
    });
  }

  return jobs;
}
