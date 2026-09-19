import { z } from 'zod';

export const CandidateProfileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  headline: z.string().min(5, 'El titular debe tener al menos 5 caracteres').max(150),
  bio: z.string().max(1000).optional(),
  seniority: z.enum(['trainee', 'intern', 'junior', 'entry_level', 'early_mid']),
  englishLevel: z.enum([
    'no_english',
    'a1_beginner',
    'a2_elementary',
    'b1_intermediate',
    'b2_upper_intermediate',
    'c1_advanced',
    'c2_proficient_native'
  ]),
  yearsOfExperience: z.number().min(0).max(2.5, 'El nicho es exclusivo para 0 a 2.5 años de experiencia'),
  preferredModality: z.enum(['remote_worldwide', 'remote_country', 'hybrid', 'on_site']),
  minimumExpectedSalaryUsd: z.number().min(300, 'El salario mínimo no puede ser inferior a $300 USD'),
  countryCode: z.string().length(2, 'Código de país ISO 2 caracteres'),
  city: z.string().optional(),
  isAnonymous: z.boolean().default(true),
  isOpenToWork: z.boolean().default(true),
  githubUrl: z.string().url('Debe ser una URL válida de GitHub').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Debe ser una URL válida de LinkedIn').optional().or(z.literal('')),
});

export const InboundRequestSchema = z.object({
  candidateId: z.string().uuid(),
  candidateMinSalary: z.number(),
  jobTitleOffered: z.string().min(4, 'El título del puesto es obligatorio').max(150),
  jobDescription: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  stackOffered: z.array(z.string()).min(1, 'Selecciona al menos una tecnología del stack'),
  offeredSalaryUsd: z.number().min(300, 'El salario debe ser de al menos $300 USD'),
  workModality: z.enum(['remote_worldwide', 'remote_country', 'hybrid', 'on_site']),
  initialPitchMessage: z.string().min(15, 'El mensaje personalizado de pitch es obligatorio para contactar'),
}).refine(data => data.offeredSalaryUsd >= data.candidateMinSalary, {
  message: 'El salario ofertado no puede ser inferior a la pretensión mínima del candidato',
  path: ['offeredSalaryUsd']
});

export const JobPostSchema = z.object({
  title: z.string().min(5, 'Título de al menos 5 caracteres').max(150),
  description: z.string().min(30, 'Descripción detallada obligatoria'),
  workModality: z.enum(['remote_worldwide', 'remote_country', 'hybrid', 'on_site']),
  locationCountry: z.string().length(2).optional(),
  locationCity: z.string().optional(),
  salaryMinUsd: z.number().min(300, 'El salario mínimo debe ser mayor a $300 USD'),
  salaryMaxUsd: z.number().min(300, 'El salario máximo debe ser mayor a $300 USD'),
  seniorityRequired: z.enum(['trainee', 'intern', 'junior', 'entry_level', 'early_mid']),
  englishRequired: z.enum([
    'no_english',
    'a1_beginner',
    'a2_elementary',
    'b1_intermediate',
    'b2_upper_intermediate',
    'c1_advanced',
    'c2_proficient_native'
  ]),
  requiredSkills: z.array(z.string()).min(1, 'Indica al menos una habilidad requerida'),
}).refine(data => data.salaryMinUsd <= data.salaryMaxUsd, {
  message: 'El salario mínimo no puede exceder el salario máximo',
  path: ['salaryMaxUsd']
});
