'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CandidateProfile, 
  JobPost, 
  InboundRequest, 
  Conversation, 
  UserRole,
  Company 
} from '@/types';
import { 
  INITIAL_CANDIDATES, 
  INITIAL_JOB_POSTS, 
  INITIAL_INBOUND_REQUESTS, 
  INITIAL_CONVERSATIONS,
  INITIAL_COMPANIES 
} from './mock-data';
import { supabase } from './supabase';
import { detectEnglishRequirement } from './services/scrapers/english-detector';
import { extractSalary } from './services/scrapers/salary-extractor';
import { normalizeLocation } from './services/scrapers/location-normalizer';
import { detectContractType } from './services/scrapers/contract-detector';
import { detectTechCategory } from './services/scrapers/category-detector';
import { detectExperience } from './services/scrapers/experience-detector';
import { extractSkills } from './services/ats-ingestion';

const STORAGE_KEYS = {
  CANDIDATES: 'realjobs_colombia_cand_v9',
  JOBS: 'realjobs_colombia_jobs_v9',
  INBOUNDS: 'realjobs_colombia_inb_v9',
  CONVERSATIONS: 'realjobs_colombia_conv_v9',
  COMPANIES: 'realjobs_colombia_comp_v9',
  ACTIVE_ROLE: 'realjobs_colombia_role_v9',
  ACTIVE_CANDIDATE_ID: 'realjobs_colombia_active_cand_v9',
  APPLIED_JOB_IDS: 'realjobs_colombia_applied_v9',
};

export function useAppStore() {
  const [activeRole, setActiveRoleState] = useState<UserRole>('candidate');
  const [activeCandidateId, setActiveCandidateIdState] = useState<string>(INITIAL_CANDIDATES[0].id);
  const [candidates, setCandidates] = useState<CandidateProfile[]>(INITIAL_CANDIDATES);
  const [jobs, setJobs] = useState<JobPost[]>(INITIAL_JOB_POSTS);
  const [inbounds, setInbounds] = useState<InboundRequest[]>(INITIAL_INBOUND_REQUESTS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

  // 1. Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as UserRole | null;
      if (savedRole) setActiveRoleState(savedRole);

      const savedCandId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID);
      if (savedCandId) setActiveCandidateIdState(savedCandId);

      const savedCandidates = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (savedCandidates) setCandidates(JSON.parse(savedCandidates));

      // Stable scraped jobs feed baseline

      const savedInbounds = localStorage.getItem(STORAGE_KEYS.INBOUNDS);
      if (savedInbounds) setInbounds(JSON.parse(savedInbounds));

      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (savedConversations) setConversations(JSON.parse(savedConversations));

      const savedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (savedCompanies) setCompanies(JSON.parse(savedCompanies));

      const savedApplied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOB_IDS);
      if (savedApplied) setAppliedJobIds(JSON.parse(savedApplied));
    } catch (e) {
      console.warn('LocalStorage error:', e);
      setJobs(INITIAL_JOB_POSTS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Fetch live scraped jobs from Supabase
  const refreshJobsFromSupabase = useCallback(async () => {
    try {
      setIsLoadingSupabase(true);
      const { data: dbJobs, error } = await supabase
        .from('job_posts')
        .select(`
          id,
          company_id,
          title,
          slug,
          description,
          work_modality,
          location_country,
          location_city,
          salary_min_usd,
          salary_max_usd,
          currency,
          seniority_required,
          english_required,
          max_years_experience_required,
          is_zero_experience,
          status,
          expires_at,
          is_auto_ingested,
          source_ats,
          source_url,
          source_job_id,
          is_claimed,
          claim_token,
          views_count,
          applications_count,
          created_at,
          companies (
            id,
            name,
            slug,
            logo_url,
            website,
            is_verified
          )
        `)
        .eq('status', 'active')
        .order('is_zero_experience', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, fallback to local jobs:', error.message);
        return;
      }

      if (dbJobs && dbJobs.length > 0) {
        const mappedJobs: JobPost[] = dbJobs.map((j: any) => {
          const comp = Array.isArray(j.companies) ? j.companies[0] : j.companies;
          const compName = comp?.name || 'Empresa Verificada';
          
          const engResult = detectEnglishRequirement(j.title, j.description || '');
          const salResult = extractSalary(j.description || '', '');
          const locResult = normalizeLocation(j.location_city || 'Colombia', `${j.title} ${j.description || ''}`);
          const skills = extractSkills(`${j.title} ${j.description || ''}`);
          const contractRes = detectContractType(j.title, j.description || '', '');
          const expRes = detectExperience(j.title, j.description || '');

          const cleanDisplayLoc = (locResult.displayLocation || j.location_city || 'Colombia')
            .replace(/^📍\s*/, '')
            .replace(/^🏠\s*/, '');

          const isLiPost = Boolean(
            j.source_ats === 'linkedin_post' ||
            (j.source_job_id && String(j.source_job_id).startsWith('lipost-')) ||
            (j.source_url && (
              j.source_url.includes('/posts/') || 
              j.source_url.includes('/feed/update/') ||
              j.source_url.includes('linkedin.com/search/results/content')
            )) ||
            (j.description || '').includes('Envía tu HV a') ||
            (j.description || '').includes('Envía tu CV a') ||
            (j.description || '').includes('Interesados remitir HV a') ||
            (j.description || '').includes('Postulaciones abiertas enviando CV') ||
            (j.description || '').includes('📩') ||
            (j.description || '').includes('#hiring') ||
            (j.description || '').includes('#semillero') ||
            (j.description || '').includes('#primerempleo')
          );

          const emailMatch = (j.description || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          const detectedEmail = emailMatch ? emailMatch[0] : undefined;

          const isZeroExp = Boolean(j.is_zero_experience || expRes.isZeroExperience || expRes.maxYearsExperience === 0);
          const expYears = isZeroExp ? 0 : (Number(j.max_years_experience_required) || expRes.maxYearsExperience || 1);

          return {
            id: j.id,
            companyId: j.company_id,
            companyName: compName,
            companyLogo: comp?.logo_url || undefined,
            companyWebsite: comp?.website || 'https://camelloonline.com',
            isCompanyVerified: comp?.is_verified ?? true,
            title: j.title,
            slug: j.slug,
            description: j.description,
            isRemote: locResult.isRemote || (j.work_modality && j.work_modality.includes('remote')) || false,
            workModality: j.work_modality,
            locationCountry: j.location_country || 'CO',
            locationCity: j.location_city || 'Colombia',
            salaryMinUsd: Number(j.salary_min_usd) || 700,
            salaryMaxUsd: Number(j.salary_max_usd) || 1500,
            currency: j.currency || 'COP',
            seniorityRequired: isZeroExp ? (j.seniority_required === 'intern' ? 'intern' : 'trainee') : (j.seniority_required || expRes.seniority || 'junior'),
            englishRequired: j.english_required || 'no_english',
            maxYearsExperienceRequired: expYears,
            isZeroExperience: isZeroExp,
            status: j.status || 'active',
            expiresAt: j.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
            isAutoIngested: Boolean(j.is_auto_ingested),
            sourceAts: isLiPost ? 'linkedin_post' : (j.source_ats || 'manual'),
            sourceUrl: j.source_url,
            isClaimed: Boolean(j.is_claimed),
            claimToken: j.claim_token,
            viewsCount: j.views_count || 0,
            applicationsCount: j.applications_count || 0,
            requiredSkills: skills.length > 0 ? skills : ['Desarrollo', 'Git', 'SQL'],
            
            // Rich Colombia metadata
            salaryDisclosed: salResult.isDisclosed,
            salaryDisplayText: salResult.displayText,
            requiresEnglish: engResult.requiresEnglish,
            englishBadgeText: engResult.badgeText,
            displayLocation: cleanDisplayLoc,
            locationFilterKey: locResult.filterKey,
            contractType: contractRes.contractType,
            contractTypeLabel: contractRes.contractTypeLabel,
            category: detectTechCategory(j.title, `${j.description || ''} ${cleanDisplayLoc}`).category,
            categoryLabel: detectTechCategory(j.title, `${j.description || ''} ${cleanDisplayLoc}`).categoryLabel,
            experienceTier: isZeroExp ? 'zero_exp' : expRes.experienceTier,
            experienceLabel: isZeroExp ? 'Sin experiencia previa' : expRes.experienceLabel,
            sourceName: isLiPost ? 'LinkedIn Post Directo' : (j.source_ats || 'Portal Verificado'),
            isLinkedInPost: isLiPost,
            postAuthor: isLiPost ? compName : undefined,
            contactEmail: detectedEmail,
            applicationEmail: detectedEmail,
            isDirectRecruiterPost: isLiPost,
            applicantCountText: isLiPost ? '💬 Post Directo de Reclutador' : (isZeroExp ? '🌱 Sin Experiencia / Trainee' : 'Menos de 20 postulantes'),
            applicantTier: 'low',
            createdAt: j.created_at
          };
        });

        setJobs(mappedJobs);
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(mappedJobs));
      }
    } catch (err) {
      console.warn('Error refreshing jobs from Supabase:', err);
    } finally {
      setIsLoadingSupabase(false);
    }
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
  };

  const setActiveCandidateId = (id: string) => {
    setActiveCandidateIdState(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID, id);
  };

  const applyToJob = async (jobId: string, coverNote?: string) => {
    const updatedApplied = [...appliedJobIds, jobId];
    setAppliedJobIds(updatedApplied);
    localStorage.setItem(STORAGE_KEYS.APPLIED_JOB_IDS, JSON.stringify(updatedApplied));

    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    // Increment applications count
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, applicationsCount: (j.applicationsCount || 0) + 1 };
      }
      return j;
    });
    setJobs(updatedJobs);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updatedJobs));

    // Async record in Supabase
    try {
      await supabase.from('job_applications').insert({
        job_post_id: jobId,
        candidate_id: activeCandidateId,
        cover_note: coverNote || null,
        status: 'received'
      });
    } catch (e) {
      // Offline fallback
    }
  };

  const resetToSeed = () => {
    localStorage.clear();
    setCandidates(INITIAL_CANDIDATES);
    setJobs(INITIAL_JOB_POSTS);
    setInbounds(INITIAL_INBOUND_REQUESTS);
    setConversations(INITIAL_CONVERSATIONS);
    setCompanies(INITIAL_COMPANIES);
    setAppliedJobIds([]);
    setActiveRole('candidate');
    setActiveCandidateId(INITIAL_CANDIDATES[0].id);
    refreshJobsFromSupabase();
  };

  const createInboundRequest = (data: any) => {
    const newReq = { id: `inb-${Date.now()}`, ...data, status: 'pending', createdAt: new Date().toISOString() };
    setInbounds(prev => [newReq, ...prev]);
  };

  const acceptInboundRequest = (inboundId: string) => {
    setInbounds(prev => prev.map(i => i.id === inboundId ? { ...i, status: 'accepted' } : i));
  };

  const declineInboundRequest = (inboundId: string, reason?: string) => {
    setInbounds(prev => prev.map(i => i.id === inboundId ? { ...i, status: 'declined', feedbackDeclinedReason: reason } : i));
  };

  const updateCandidateProfile = (candidateId: string, updates: Partial<CandidateProfile>) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...updates } : c));
  };

  const claimJobPost = (claimToken: string, companyName: string, recruiterEmail: string) => {
    const job = jobs.find(j => j.claimToken === claimToken);
    return job || null;
  };

  const sendMessage = (conversationId: string, content: string, senderRole: UserRole, senderName: string) => {
    // stub
  };

  const currentCandidate = candidates.find(c => c.id === activeCandidateId) || candidates[0];

  return {
    isLoaded,
    isLoadingSupabase,
    activeRole,
    setActiveRole,
    activeCandidateId,
    setActiveCandidateId,
    currentCandidate,
    candidates,
    jobs,
    inbounds,
    conversations,
    companies,
    appliedJobIds,
    applyToJob,
    createInboundRequest,
    acceptInboundRequest,
    declineInboundRequest,
    updateCandidateProfile,
    claimJobPost,
    sendMessage,
    resetToSeed,
    refreshJobsFromSupabase
  };
}

