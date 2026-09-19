export type UserRole = 'candidate' | 'recruiter' | 'admin';

export type JuniorSeniorityLevel = 
  | 'trainee'       // Bootcamps / Autodidactas / Universitarios
  | 'intern'        // Pasantías / Prácticas profesionales
  | 'junior'        // 0 - 1 año de experiencia
  | 'entry_level'   // 1 - 2 años de experiencia
  | 'early_mid';    // Hasta 2 años de experiencia sólida

export type EnglishLevel = 
  | 'no_english'
  | 'a1_beginner'
  | 'a2_elementary'
  | 'b1_intermediate'
  | 'b2_upper_intermediate'
  | 'c1_advanced'
  | 'c2_proficient_native';

export type WorkModality = 
  | 'remote_worldwide'
  | 'remote_country'
  | 'hybrid'
  | 'on_site';

export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired';

export type ApplicationStatus = 
  | 'received'
  | 'viewed'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'hired'
  | 'withdrawn';

export type InboundRequestStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired';

export type AtsSource = 'manual' | 'greenhouse' | 'lever' | 'ashby' | 'workable';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface CandidateSkill {
  id: string;
  name: string;
  yearsOfExperience?: number;
  isPrimary?: boolean;
}

export interface CandidateProject {
  id: string;
  title: string;
  description: string;
  liveDemoUrl?: string;
  githubUrl?: string;
  technologiesUsed: string[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline: string;
  bio?: string;
  seniority: JuniorSeniorityLevel;
  englishLevel: EnglishLevel;
  yearsOfExperience: number;
  preferredModality: WorkModality;
  minimumExpectedSalaryUsd: number;
  currency: string;
  isAnonymous: boolean;
  isOpenToWork: boolean;
  countryCode: string;
  city?: string;
  cvUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  skills: CandidateSkill[];
  projects: CandidateProject[];
  profileViewsCount: number;
  inboundsReceivedCount: number;
  inboundsAcceptedCount: number;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domainEmail: string;
  website: string;
  industry: string;
  companySize: string;
  logoUrl?: string;
  description?: string;
  countryCode: string;
  city?: string;
  isVerified: boolean;
  verifiedAt?: string;
  isAutoIngested: boolean;
  atsSource: AtsSource;
}

export interface JobPost {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  companyWebsite: string;
  isCompanyVerified: boolean;
  title: string;
  slug: string;
  description: string;
  workModality: WorkModality;
  locationCountry?: string;
  locationCity?: string;
  salaryMinUsd: number;
  salaryMaxUsd: number;
  currency: string;
  seniorityRequired: JuniorSeniorityLevel;
  englishRequired: EnglishLevel;
  maxYearsExperienceRequired: number;
  isZeroExperience: boolean;
  status: JobStatus;
  expiresAt: string;
  isAutoIngested: boolean;
  sourceAts: AtsSource;
  sourceUrl?: string;
  isClaimed: boolean;
  claimToken?: string;
  viewsCount: number;
  applicationsCount: number;
  requiredSkills: string[];
  salaryDisclosed?: boolean;
  salaryDisplayText?: string;
  requiresEnglish?: boolean;
  englishBadgeText?: string;
  displayLocation?: string;
  locationFilterKey?: string;
  isRemote?: boolean;
  contractType?: 'indefinido' | 'fijo' | 'aprendizaje' | 'prestacion_servicios' | 'obra_labor' | 'no_especificado';
  contractTypeLabel?: string;
  category?: 'software_dev' | 'data_ai' | 'qa_testing' | 'it_support' | 'ui_ux_product' | 'customer_service' | 'sales_commercial' | 'marketing_digital' | 'virtual_assistant_ops' | 'hr_recruiting' | 'finance_accounting' | 'writing_content' | 'general_remote';
  categoryLabel?: string;
  experienceTier?: 'zero_exp' | 'six_months' | 'one_year' | 'two_to_three' | 'three_to_four' | 'more_than_five';
  experienceLabel?: string;
  applicantCountText?: string;
  applicantTier?: 'low' | 'medium' | 'high';
  sourceName?: string;
  postedDateText?: string;
  isLinkedInPost?: boolean;
  postAuthor?: string;
  postAuthorHeadline?: string;
  contactEmail?: string;
  applicationEmail?: string;
  postHashtags?: string[];
  isDirectRecruiterPost?: boolean;
  createdAt: string;
}

export interface InboundRequest {
  id: string;
  candidateId: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  companyDomain: string;
  isCompanyVerified: boolean;
  recruiterId: string;
  recruiterName: string;
  jobTitleOffered: string;
  jobDescription: string;
  stackOffered: string[];
  offeredSalaryUsd: number;
  currency: string;
  workModality: WorkModality;
  initialPitchMessage: string;
  status: InboundRequestStatus;
  expiresAt: string;
  feedbackDeclinedReason?: string;
  unlockedAt?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  candidateId: string;
  candidateName: string;
  companyId: string;
  companyName: string;
  origin: 'job_application' | 'inbound_request';
  inboundRequestId?: string;
  jobTitle: string;
  salaryUsd: number;
  isActive: boolean;
  lastMessageAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  isRead: boolean;
  createdAt: string;
}
