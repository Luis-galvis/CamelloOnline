/**
 * Interfaces para Vacantes Scrapeadas en Colombia
 */

export interface ColombiaScrapedJob {
  id: string;
  source: 'linkedin' | 'computrabajo' | 'elempleo' | 'getonbrd' | 'greenhouse' | 'lever' | 'ashby' | 'workable' | 'weremoto' | 'torre' | 'remotive' | 'jooble' | 'local_boards' | 'sales_commercial' | string;
  sourceUrl: string;
  sourceJobId: string;
  title: string;
  companyName: string;
  companyDomain?: string;
  companyLogo?: string;
  description: string;
  locationCity: string;
  locationDepartment?: string;
  locationCountry: string;
  displayLocation: string;
  locationFilterKey: string;
  isRemote: boolean;
  workModality: 'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site';
  
  // Salario
  salaryDisclosed: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryMinUsd?: number;
  salaryMaxUsd?: number;
  salaryCurrency?: 'COP' | 'USD';
  salaryDisplayText: string;
  salaryPeriod?: 'monthly' | 'yearly' | 'hourly';
  salaryMinUsdEquivalent?: number;
  salaryMaxUsdEquivalent?: number;

  // Inglés
  requiresEnglish: boolean;
  englishLevel: 'no_english' | 'no_english_required' | 'b1_intermediate' | 'b2_upper_intermediate' | 'c1_advanced' | 'bilingual_required';
  englishLevelLabel?: string;
  englishBadgeText?: string;

  // Clasificación de Experiencia
  seniority: 'trainee' | 'intern' | 'junior' | 'entry_level' | 'early_mid' | 'senior';
  maxYearsExperience: number;
  minYearsExperience?: number;
  isZeroExperience: boolean;
  experienceTier?: 'zero_exp' | 'six_months' | 'one_year' | 'two_to_three' | 'three_to_four' | 'more_than_five';
  experienceLabel?: string;
  experienceLevelLabel?: string;
  requiredSkills: string[];
  
  // Contrato
  contractType?: 'indefinido' | 'fijo' | 'aprendizaje' | 'prestacion_servicios' | 'obra_labor' | 'no_especificado';
  contractTypeLabel?: string;

  // Categoría Tech / General
  category?: 'software_dev' | 'data_ai' | 'qa_testing' | 'it_support' | 'ui_ux_product' | 'customer_service' | 'sales_commercial' | 'marketing_digital' | 'community_manager' | 'video_editor' | 'virtual_assistant_ops' | 'hr_recruiting' | 'finance_accounting' | 'writing_content' | 'logistics_operations' | 'health_nursing' | 'general_remote';
  categoryLabel?: string;

  // Postulaciones / Demanda
  applicantCountText?: string;
  applicantTier?: 'low' | 'medium' | 'high';
  applicantCount?: number;

  postedDateText?: string;
  createdAt?: string | Date;
  scrapedAt?: string;

  // Campos específicos de LinkedIn Posts / Publicaciones de Reclutadores
  isLinkedInPost?: boolean;
  isDirectRecruiterPost?: boolean;
  postAuthor?: string;
  postAuthorHeadline?: string;
  contactEmail?: string;
  applicationEmail?: string;
  applicationUrl?: string;
  postHashtags?: string[];
}
