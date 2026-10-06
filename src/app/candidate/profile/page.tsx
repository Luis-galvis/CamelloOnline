'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  ShieldCheck, 
  DollarSign, 
  Github, 
  Globe, 
  CheckCircle2, 
  Save, 
  Briefcase, 
  FileText, 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Sparkles, 
  Linkedin, 
  Phone, 
  Mail, 
  MapPin, 
  Camera, 
  Home, 
  Loader2, 
  ExternalLink, 
  GraduationCap, 
  Award, 
  Languages, 
  TrendingUp, 
  Calendar, 
  Check, 
  Printer, 
  Eye, 
  Building2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLOMBIA_DEPARTMENTS_AND_CITIES } from '@/lib/data/colombia-locations';
import { JuniorSeniorityLevel, EnglishLevel, WorkModality } from '@/types';

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isCurrent: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  status: 'graduated' | 'in_progress';
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  credentialUrl?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Rango completo de años: desde 1970 hasta el año actual (2026) y futuros hasta 2035
const YEARS = Array.from({ length: 57 }, (_, i) => String(2026 - i));
const FUTURE_YEARS = Array.from({ length: 10 }, (_, i) => String(2035 - i));

const POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'SQL',
  'Git', 'Tailwind CSS', 'Docker', 'PostgreSQL', 'Atención al Cliente',
  'Ventas / Comercial', 'Marketing Digital', 'Excel Avanzado', 'Inglés B2', 'Canva'
];

const NORMALIZED_LANGUAGES = [
  'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 
  'Italiano', 'Chino Mandarín', 'Japonés', 'Ruso', 'Árabe'
];

const LANGUAGE_LEVELS = [
  'Nativo / Lengua Materna',
  'C2 - Maestría / Bilingüe',
  'C1 - Avanzado Profesional',
  'B2 - Intermedio Alto',
  'B1 - Intermedio',
  'A2 - Básico / Elemental',
  'A1 - Principiante'
];

export default function CandidateProfilePage() {
  const { currentCandidate, updateCandidateProfile } = useAppStore();
  const { user, openAuthModal, signInWithGoogle } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  // Avatar & Personal Info
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [firstName, setFirstName] = useState(currentCandidate?.firstName || '');
  const [lastName, setLastName] = useState(currentCandidate?.lastName || '');
  const [headline, setHeadline] = useState(currentCandidate?.headline || '');
  const [bio, setBio] = useState(currentCandidate?.bio || '');
  const [phone, setPhone] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Bogotá D.C.');
  const [selectedCity, setSelectedCity] = useState('Bogotá D.C.');
  const [address, setAddress] = useState('');

  // Professional Preferences
  const [seniority, setSeniority] = useState<JuniorSeniorityLevel>(currentCandidate?.seniority || 'junior');
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>(currentCandidate?.englishLevel || 'b1_intermediate');
  const [preferredModality, setPreferredModality] = useState<WorkModality>(currentCandidate?.preferredModality || 'remote_worldwide');
  const [minimumSalary, setMinimumSalary] = useState<number>(currentCandidate?.minimumExpectedSalaryUsd || 1200);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(currentCandidate?.isAnonymous ?? false);
  const [isOpenToWork, setIsOpenToWork] = useState<boolean>(currentCandidate?.isOpenToWork ?? true);

  // Social & Portfolios
  const [githubUrl, setGithubUrl] = useState(currentCandidate?.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentCandidate?.portfolioUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Skills Manager
  const [skills, setSkills] = useState<string[]>([
    'JavaScript', 'React', 'Git', 'SQL', 'Trabajo en Equipo'
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Resume / CV Management
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeFileSize, setResumeFileSize] = useState<string | null>(null);
  const [resumeUploadDate, setResumeUploadDate] = useState<string | null>(null);
  const [resumePublicUrl, setResumePublicUrl] = useState<string | null>(null);
  const [resumeDriveLink, setResumeDriveLink] = useState('');

  // Extended Sections: Experience, Education, Certifications, Languages
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    {
      id: 'exp-1',
      role: 'Desarrollador Web / Prácticas',
      company: 'Proyecto Independiente / TechLab',
      startMonth: 'Ene',
      startYear: '2025',
      endMonth: '',
      endYear: '',
      isCurrent: true,
      description: 'Construcción y despliegue de plataformas web responsivas con Next.js, TypeScript y Tailwind CSS.'
    }
  ]);
  const [showAddExp, setShowAddExp] = useState(false);
  const [newExp, setNewExp] = useState<Omit<WorkExperience, 'id'>>({
    role: '',
    company: '',
    startMonth: 'Ene',
    startYear: '2025',
    endMonth: 'Dic',
    endYear: '2025',
    isCurrent: true,
    description: ''
  });

  const [educations, setEducations] = useState<Education[]>([
    {
      id: 'edu-1',
      degree: 'Tecnología en Desarrollo de Software',
      institution: 'SENA / Universidad',
      startYear: '2023',
      endYear: '2025',
      status: 'graduated'
    }
  ]);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEdu, setNewEdu] = useState<Omit<Education, 'id'>>({
    degree: '',
    institution: '',
    startYear: '2023',
    endYear: '2025',
    status: 'graduated'
  });

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: 'cert-1',
      title: 'Frontend Developer Especialista',
      issuer: 'Platzi / Udemy',
      year: '2025',
      credentialUrl: ''
    }
  ]);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState<Omit<Certification, 'id'>>({
    title: '',
    issuer: '',
    year: '2025',
    credentialUrl: ''
  });

  const [languagesList, setLanguagesList] = useState<LanguageItem[]>([
    { id: 'lang-1', language: 'Español', level: 'Nativo / Lengua Materna' },
    { id: 'lang-2', language: 'Inglés', level: 'B1 - Intermedio' }
  ]);
  const [newLangName, setNewLangName] = useState('Inglés');
  const [newLangLevel, setNewLangLevel] = useState('B2 - Intermedio Alto');

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHarvardPreview, setShowHarvardPreview] = useState(false);

  // Available cities for selected department
  const availableCities = useMemo(() => {
    const deptObj = COLOMBIA_DEPARTMENTS_AND_CITIES.find(d => d.department === selectedDepartment);
    return deptObj ? deptObj.cities : ['Bogotá D.C.'];
  }, [selectedDepartment]);

  // Profile Completeness Score
  const completeness = useMemo(() => {
    let score = 0;
    if (avatarUrl) score += 10;
    if (firstName && lastName) score += 15;
    if (headline) score += 10;
    if (bio && bio.length > 15) score += 10;
    if (phone) score += 10;
    if (resumeFileName || resumePublicUrl || resumeDriveLink) score += 15;
    if (skills.length >= 3) score += 10;
    if (experiences.length > 0) score += 10;
    if (educations.length > 0) score += 5;
    if (languagesList.length > 0) score += 5;
    return Math.min(100, score);
  }, [avatarUrl, firstName, lastName, headline, bio, phone, resumeFileName, resumePublicUrl, resumeDriveLink, skills, experiences, educations, languagesList]);

  // Load from Supabase and Google OAuth
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setIsLoadingProfile(true);

      if (user.user_metadata?.avatar_url && !avatarUrl) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
      if (user.user_metadata?.full_name) {
        const parts = user.user_metadata.full_name.split(' ');
        if (!firstName) setFirstName(parts[0] || '');
        if (!lastName) setLastName(parts.slice(1).join(' ') || '');
      }

      try {
        const { data, error } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.headline) setHeadline(data.headline);
          if (data.bio) setBio(data.bio);
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.seniority) setSeniority(data.seniority);
          if (data.english_level) setEnglishLevel(data.english_level);
          if (data.preferred_modality) setPreferredModality(data.preferred_modality);
          if (data.minimum_expected_salary_usd) setMinimumSalary(Number(data.minimum_expected_salary_usd));
          if (data.github_url) setGithubUrl(data.github_url);
          if (data.portfolio_url) setPortfolioUrl(data.portfolio_url);
          if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);

          if (data.department) {
            setSelectedDepartment(data.department);
          }
          if (data.city) {
            setSelectedCity(data.city);
          }

          if (data.cv_url) {
            let directUrl = data.cv_url;
            try {
              if (data.cv_url.includes('resumes/')) {
                const storagePath = data.cv_url.split('resumes/').pop()?.split('?')[0];
                if (storagePath) {
                  const { data: signed } = await supabase.storage.from('resumes').createSignedUrl(storagePath, 60 * 60 * 24);
                  if (signed?.signedUrl) directUrl = signed.signedUrl;
                }
              } else if (data.cv_url.startsWith(`${user.id}/`)) {
                const { data: signed } = await supabase.storage.from('resumes').createSignedUrl(data.cv_url, 60 * 60 * 24);
                if (signed?.signedUrl) directUrl = signed.signedUrl;
              }
            } catch {
              // fallback to directUrl
            }
            setResumePublicUrl(directUrl);
            if (data.cv_url.startsWith('http')) {
              setResumeFileName(data.cv_url.split('/').pop()?.split('?')[0] || 'Hoja_De_Vida.pdf');
              setResumeFileSize('Guardado seguro en nube');
            } else {
              setResumeFileName(data.cv_url.replace('CV_', ''));
            }
          }

          if (Array.isArray(data.experiences) && data.experiences.length > 0) {
            setExperiences(data.experiences);
          }
          if (Array.isArray(data.educations) && data.educations.length > 0) {
            setEducations(data.educations);
          }
          if (Array.isArray(data.certifications) && data.certifications.length > 0) {
            setCertifications(data.certifications);
          }
          if (Array.isArray(data.languages) && data.languages.length > 0) {
            setLanguagesList(data.languages);
          }
          if (Array.isArray(data.skills) && data.skills.length > 0) {
            setSkills(data.skills);
          }
        }
      } catch (err) {
        console.warn('Fallback loading profile local:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();

    try {
      const savedSkills = localStorage.getItem('realjobs_cand_skills');
      if (savedSkills) setSkills(JSON.parse(savedSkills));

      const savedResume = localStorage.getItem('realjobs_cand_resume');
      if (savedResume) {
        const resData = JSON.parse(savedResume);
        setResumeFileName(resData.name);
        setResumeFileSize(resData.size);
        setResumeUploadDate(resData.date);
        if (resData.publicUrl) setResumePublicUrl(resData.publicUrl);
        if (resData.driveLink) setResumeDriveLink(resData.driveLink);
      }

      const savedAvatar = localStorage.getItem('realjobs_cand_avatar');
      if (savedAvatar && !avatarUrl) setAvatarUrl(savedAvatar);

      const savedExp = localStorage.getItem('realjobs_cand_exp');
      if (savedExp) setExperiences(JSON.parse(savedExp));

      const savedEdu = localStorage.getItem('realjobs_cand_edu');
      if (savedEdu) setEducations(JSON.parse(savedEdu));

      const savedCert = localStorage.getItem('realjobs_cand_cert');
      if (savedCert) setCertifications(JSON.parse(savedCert));

      const savedLang = localStorage.getItem('realjobs_cand_lang');
      if (savedLang) setLanguagesList(JSON.parse(savedLang));
    } catch (e) {
      // ignore
    }
  }, [user]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    const deptObj = COLOMBIA_DEPARTMENTS_AND_CITIES.find(d => d.department === dept);
    if (deptObj && deptObj.cities.length > 0) {
      setSelectedCity(deptObj.cities[0]);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        localStorage.setItem('realjobs_cand_avatar', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkillInput('');
    localStorage.setItem('realjobs_cand_skills', JSON.stringify(updated));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    localStorage.setItem('realjobs_cand_skills', JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const dateStr = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
      setResumeFileName(file.name);
      setResumeFileSize(sizeMb);
      setResumeUploadDate(dateStr);

      const localUrl = URL.createObjectURL(file);
      setResumePublicUrl(localUrl);

      const resumeMeta = { name: file.name, size: sizeMb, date: dateStr, publicUrl: localUrl, driveLink: resumeDriveLink };
      localStorage.setItem('realjobs_cand_resume', JSON.stringify(resumeMeta));
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeFileName(null);
    setResumeFileSize(null);
    setResumeUploadDate(null);
    setResumePublicUrl(null);
    localStorage.removeItem('realjobs_cand_resume');
  };

  const handleAddExperience = () => {
    if (!newExp.role || !newExp.company) return;
    const item: WorkExperience = { ...newExp, id: `exp-${Date.now()}` };
    const updated = [item, ...experiences];
    setExperiences(updated);
    setNewExp({
      role: '',
      company: '',
      startMonth: 'Ene',
      startYear: '2025',
      endMonth: 'Dic',
      endYear: '2025',
      isCurrent: true,
      description: ''
    });
    setShowAddExp(false);
    localStorage.setItem('realjobs_cand_exp', JSON.stringify(updated));
  };

  const handleRemoveExperience = (id: string) => {
    const updated = experiences.filter(e => e.id !== id);
    setExperiences(updated);
    localStorage.setItem('realjobs_cand_exp', JSON.stringify(updated));
  };

  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.institution) return;
    const item: Education = { ...newEdu, id: `edu-${Date.now()}` };
    const updated = [item, ...educations];
    setEducations(updated);
    setNewEdu({ degree: '', institution: '', startYear: '2023', endYear: '2025', status: 'graduated' });
    setShowAddEdu(false);
    localStorage.setItem('realjobs_cand_edu', JSON.stringify(updated));
  };

  const handleRemoveEducation = (id: string) => {
    const updated = educations.filter(e => e.id !== id);
    setEducations(updated);
    localStorage.setItem('realjobs_cand_edu', JSON.stringify(updated));
  };

  const handleAddCertification = () => {
    if (!newCert.title || !newCert.issuer) return;
    const item: Certification = { ...newCert, id: `cert-${Date.now()}` };
    const updated = [item, ...certifications];
    setCertifications(updated);
    setNewCert({ title: '', issuer: '', year: '2025', credentialUrl: '' });
    setShowAddCert(false);
    localStorage.setItem('realjobs_cand_cert', JSON.stringify(updated));
  };

  const handleRemoveCertification = (id: string) => {
    const updated = certifications.filter(c => c.id !== id);
    setCertifications(updated);
    localStorage.setItem('realjobs_cand_cert', JSON.stringify(updated));
  };

  const handleAddLanguage = () => {
    if (!newLangName.trim() || languagesList.some(l => l.language.toLowerCase() === newLangName.toLowerCase())) return;
    const item: LanguageItem = { id: `lang-${Date.now()}`, language: newLangName, level: newLangLevel };
    const updated = [...languagesList, item];
    setLanguagesList(updated);
    localStorage.setItem('realjobs_cand_lang', JSON.stringify(updated));
  };

  const handleRemoveLanguage = (id: string) => {
    const updated = languagesList.filter(l => l.id !== id);
    setLanguagesList(updated);
    localStorage.setItem('realjobs_cand_lang', JSON.stringify(updated));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let finalCvUrl = resumePublicUrl || resumeDriveLink || null;

    if (user && resumeFile) {
      try {
        const fileExt = resumeFile.name.split('.').pop() || 'pdf';
        const cleanFileName = `${user.id}/${Date.now()}_cv.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(cleanFileName, resumeFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError && uploadData) {
          // Generar signed URL seguro con expiración de 24h para el candidato autenticado
          const { data: signedUrlData } = await supabase.storage
            .from('resumes')
            .createSignedUrl(cleanFileName, 60 * 60 * 24);

          finalCvUrl = cleanFileName;
          if (signedUrlData?.signedUrl) {
            setResumePublicUrl(signedUrlData.signedUrl);
          } else {
            setResumePublicUrl(cleanFileName);
          }
        }
      } catch (storageErr) {
        console.warn('Storage upload notice:', storageErr);
      }
    }

    if (user) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          role: 'candidate',
          avatar_url: avatarUrl || undefined,
          email_verified: true,
          updated_at: new Date().toISOString()
        });

        await supabase.from('candidate_profiles').upsert({
          user_id: user.id,
          first_name: firstName || 'Candidato',
          last_name: lastName || '',
          headline: headline || 'Candidato Verificado',
          bio: bio || '',
          seniority: seniority,
          english_level: englishLevel,
          preferred_modality: preferredModality,
          minimum_expected_salary_usd: Number(minimumSalary),
          currency: 'USD',
          country_code: 'CO',
          department: selectedDepartment,
          city: selectedCity,
          address: address || null,
          phone: phone || null,
          cv_url: finalCvUrl || (resumeFileName ? `CV_${resumeFileName}` : null),
          github_url: githubUrl || null,
          portfolio_url: portfolioUrl || null,
          linkedin_url: linkedinUrl || null,
          is_anonymous: isAnonymous,
          is_open_to_work: isOpenToWork,
          experiences: experiences,
          educations: educations,
          certifications: certifications,
          languages: languagesList,
          skills: skills,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      } catch (err: any) {
        console.warn('Nota de guardado Supabase:', err.message);
      }
    }

    localStorage.setItem('realjobs_cand_skills', JSON.stringify(skills));
    localStorage.setItem('realjobs_cand_exp', JSON.stringify(experiences));
    localStorage.setItem('realjobs_cand_edu', JSON.stringify(educations));
    localStorage.setItem('realjobs_cand_cert', JSON.stringify(certifications));
    localStorage.setItem('realjobs_cand_lang', JSON.stringify(languagesList));
    localStorage.setItem('realjobs_cand_resume', JSON.stringify({
      name: resumeFileName,
      size: resumeFileSize,
      date: resumeUploadDate,
      publicUrl: finalCvUrl,
      driveLink: resumeDriveLink
    }));
    if (avatarUrl) {
      localStorage.setItem('realjobs_cand_avatar', avatarUrl);
    }

    setIsSaving(false);
    setShowSuccessModal(true);
  };

  const handlePrintCV = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 min-h-screen">
      
      {/* 🎓 MODAL DE VISTA PREVIA & GENERADOR CV ESTILO HARVARD */}
      {showHarvardPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Plantilla Harvard ATS-Optimized
                  </h3>
                  <p className="text-[11px] text-slate-500">Formato estándar de oro internacional libre de sesgos</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHarvardPreview(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* HARVARD RESUME TEMPLATE SHEET (PRINT READY) */}
            <div 
              ref={printRef}
              id="harvard-resume-sheet"
              className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300 rounded-xl shadow-xs font-serif leading-relaxed text-xs sm:text-sm space-y-5"
            >
              {/* Header */}
              <div className="text-center border-b border-slate-900 pb-4 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-wider uppercase font-sans text-slate-900">
                  {firstName || 'Nombre'} {lastName || 'Apellido'}
                </h1>
                <p className="text-xs font-sans text-slate-600 font-semibold">
                  {headline || 'Profesional'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-sans text-slate-600 pt-1">
                  <span>{selectedCity}, {selectedDepartment}, Colombia</span>
                  {phone && <span>· {phone}</span>}
                  <span>· {user?.email || 'correo@ejemplo.com'}</span>
                  {linkedinUrl && <span>· {linkedinUrl.replace('https://', '')}</span>}
                  {githubUrl && <span>· {githubUrl.replace('https://', '')}</span>}
                </div>
              </div>

              {/* Summary */}
              {bio && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest font-sans border-b border-slate-300 pb-0.5 text-slate-900">
                    Resumen Profesional
                  </h2>
                  <p className="text-xs text-slate-700 leading-normal font-sans pt-1">
                    {bio}
                  </p>
                </div>
              )}

              {/* Experience */}
              {experiences.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest font-sans border-b border-slate-300 pb-0.5 text-slate-900">
                    Experiencia Laboral & Proyectos
                  </h2>
                  <div className="space-y-3 pt-1">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="space-y-0.5 font-sans">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                          <span>{exp.role}</span>
                          <span className="text-[11px] font-normal text-slate-600">
                            {exp.startMonth} {exp.startYear} - {exp.isCurrent ? 'Presente' : `${exp.endMonth || ''} ${exp.endYear || ''}`}
                          </span>
                        </div>
                        <div className="text-xs italic text-slate-700 font-medium">
                          {exp.company} · Colombia
                        </div>
                        {exp.description && (
                          <p className="text-[11px] text-slate-600 pt-0.5 leading-snug">
                            • {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {educations.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest font-sans border-b border-slate-300 pb-0.5 text-slate-900">
                    Educación & Formación
                  </h2>
                  <div className="space-y-2 pt-1 font-sans">
                    {educations.map((edu) => (
                      <div key={edu.id} className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{edu.degree}</div>
                          <div className="text-slate-600 italic text-[11px]">{edu.institution}</div>
                        </div>
                        <div className="text-[11px] text-slate-600 text-right">
                          <span>{edu.startYear} - {edu.endYear}</span>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            {edu.status === 'graduated' ? 'Graduado' : 'En curso'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills & Tools */}
              {skills.length > 0 && (
                <div className="space-y-1 font-sans">
                  <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-300 pb-0.5 text-slate-900">
                    Habilidades Técnicas & Competencias
                  </h2>
                  <p className="text-xs text-slate-700 pt-1">
                    <strong className="text-slate-900">Competencias Clave: </strong>
                    {skills.join(', ')}
                  </p>
                </div>
              )}

              {/* Certifications & Languages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-sans">
                {certifications.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-300 pb-0.5 text-slate-900">
                      Certificaciones
                    </h2>
                    <ul className="text-xs text-slate-700 space-y-1 pt-1.5">
                      {certifications.map((c) => (
                        <li key={c.id} className="text-[11px]">
                          • <strong>{c.title}</strong> ({c.issuer}, {c.year})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {languagesList.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-300 pb-0.5 text-slate-900">
                      Idiomas
                    </h2>
                    <ul className="text-xs text-slate-700 space-y-1 pt-1.5">
                      {languagesList.map((l) => (
                        <li key={l.id} className="text-[11px]">
                          • <strong>{l.language}:</strong> {l.level}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 🚀 MODAL GIGANTE DE CONFIRMACIÓN AL GUARDAR */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-emerald-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Perfil {completeness}% Optimizado
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ¡Todo Guardado en Base de Datos!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tus datos, hoja de vida, experiencias, estudios, habilidades y ubicación quedaron sincronizados de forma segura.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowHarvardPreview(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Mi CV Generado (Formato Harvard)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Volver al Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Title & Completeness Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 space-y-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" />
              <span>Perfil Profesional & Hoja de Vida</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tu Perfil en CamelloOnline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Personaliza tu hoja de vida, experiencia y habilidades para postularte con 1 clic.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowHarvardPreview(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer border border-slate-200"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>CV Harvard</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 📊 BARRA DINÁMICA DE COMPLETITUD DE PERFIL */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Nivel de Visibilidad ante Reclutadores:
              </span>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {completeness}%
              </span>
            </div>
            <span className="text-[11px] text-slate-300 hidden md:inline">
              {completeness === 100 ? '🔥 ¡Perfil al máximo nivel!' : 'Completa cada sección para x3 postulaciones'}
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] sm:text-[11px] text-slate-300">
            <span className={`flex items-center gap-1 truncate ${avatarUrl ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3 shrink-0" /> Foto de perfil
            </span>
            <span className={`flex items-center gap-1 truncate ${resumeFileName || resumePublicUrl ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3 shrink-0" /> Hoja de Vida (CV)
            </span>
            <span className={`flex items-center gap-1 truncate ${skills.length >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3 shrink-0" /> Habilidades ({skills.length}/3)
            </span>
            <span className={`flex items-center gap-1 truncate ${experiences.length > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3 shrink-0" /> Experiencia / Proyectos
            </span>
          </div>
        </div>
      </div>

      {/* Guest Warning Banner */}
      {!user && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Inicia sesión para sincronizar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Inicia sesión con Google para guardar tu perfil en la nube y acceder desde cualquier dispositivo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => signInWithGoogle()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={() => openAuthModal('register')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Registrarme
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. SECCIÓN: FOTO DE PERFIL & DATOS PERSONALES */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <span>Foto de Perfil e Información Personal</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-200 shadow-md bg-slate-100 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-indigo-600">
                    {(firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition-transform group-hover:scale-105">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarFile} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-900">Foto de Perfil</h3>
              <p className="text-xs text-slate-500">
                Sube una foto clara en formato JPG o PNG para transmitir profesionalismo a los reclutadores.
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('');
                    localStorage.removeItem('realjobs_cand_avatar');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Eliminar foto
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellido</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Titular Profesional / Cargo Deseado</label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ej: Junior Frontend Developer | React & Next.js o Asesor Comercial Remoto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Ubicación Desglosada: País, Departamento y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <span>🇨🇴 País</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>🇨🇴 Colombia</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Departamento</span>
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {COLOMBIA_DEPARTMENTS_AND_CITIES.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ciudad / Municipio</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Teléfono / WhatsApp</span>
              </label>
              <input
                type="tel"
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Dirección / Barrio (Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Calle 123 #45-67"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Breve Resumen Profesional / Biografía</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a las empresas sobre tu pasión, proyectos destacados o tu disponibilidad inmediata..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* 2. SECCIÓN: HOJA DE VIDA / CV */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Hoja de Vida / Curriculum Vitae (CV)</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Formato PDF / DOCX
            </span>
          </div>

          {/* File Upload Box */}
          {resumeFileName ? (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="truncate max-w-[200px] sm:max-w-xs">{resumeFileName}</span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                      ✓ Listo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tamaño: {resumeFileSize} · {resumeUploadDate ? `Cargado: ${resumeUploadDate}` : 'Archivo adjunto'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resumePublicUrl && (
                  <a
                    href={resumePublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver CV</span>
                  </a>
                )}

                <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors">
                  <span>Reemplazar</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar CV"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Haz clic para subir tu Hoja de Vida (PDF o DOCX)
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Se guardará en la base de datos y se adjuntará automáticamente a tus postulaciones. Máximo 10 MB.
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Optional Direct Link */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              (Opcional) Enlace alternativo si no usas archivo PDF (Google Drive, Notion, Dropbox, etc.)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/tu-cv/view"
                value={resumeDriveLink}
                onChange={(e) => setResumeDriveLink(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN: EXPERIENCIA LABORAL & PROYECTOS */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span>Experiencia Laboral / Proyectos</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddExp(!showAddExp)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          {experiences.length === 0 && !showAddExp ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No has añadido experiencia. Puedes agregar proyectos personales, voluntariados, prácticas o empleos.
            </p>
          ) : (
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{exp.role}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-semibold text-indigo-600">{exp.company}</span>
                      {exp.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {exp.startMonth} {exp.startYear} - {exp.isCurrent ? 'Presente' : `${exp.endMonth || ''} ${exp.endYear || ''}`}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(exp.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form to Add Experience */}
          {showAddExp && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4 animate-in fade-in">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nueva Experiencia o Proyecto</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo o Rol</label>
                  <input
                    type="text"
                    placeholder="Ej. Frontend Developer Jr / Asesor Comercial"
                    value={newExp.role}
                    onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empresa o Proyecto</label>
                  <input
                    type="text"
                    placeholder="Ej. Freelance / Tech Company"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Fechas con Selectores Elegantes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newExp.startMonth}
                      onChange={(e) => setNewExp({ ...newExp, startMonth: e.target.value })}
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={newExp.startYear}
                      onChange={(e) => setNewExp({ ...newExp, startYear: e.target.value })}
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Fecha de Fin</label>
                    <button
                      type="button"
                      onClick={() => setNewExp({ ...newExp, isCurrent: !newExp.isCurrent })}
                      className={`text-xs font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        newExp.isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {newExp.isCurrent ? '✓ Trabajo aquí actualmente' : 'Trabajo aquí actualmente'}
                    </button>
                  </div>

                  {newExp.isCurrent ? (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                      Presente (Actualmente trabajando aquí)
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newExp.endMonth || 'Dic'}
                        onChange={(e) => setNewExp({ ...newExp, endMonth: e.target.value })}
                        className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={newExp.endYear || '2025'}
                        onChange={(e) => setNewExp({ ...newExp, endYear: e.target.value })}
                        className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de Funciones y Logros</label>
                <textarea
                  rows={2}
                  placeholder="Describe tus responsabilidades, tecnologías que utilizaste o resultados logrados..."
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExp(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Experiencia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. SECCIÓN: EDUCACIÓN & ESTUDIOS ACADÉMICOS */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Educación & Estudios Académicos</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddEdu(!showAddEdu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{edu.degree}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs font-semibold text-indigo-600">{edu.institution}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{edu.startYear} - {edu.endYear}</span>
                    <span>·</span>
                    <span className={`text-[11px] font-bold px-2 py-0.2 rounded-md ${
                      edu.status === 'graduated' ? 'text-emerald-700 bg-emerald-100' : 'text-sky-700 bg-sky-100'
                    }`}>
                      {edu.status === 'graduated' ? 'Graduado' : 'En Curso (Finalización estimada)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(edu.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {showAddEdu && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4 animate-in fade-in">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Nuevo Estudio Académico</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título o Carrera</label>
                  <input
                    type="text"
                    placeholder="Ej. Ingeniería de Sistemas / Bachiller"
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institución Educativa</label>
                  <input
                    type="text"
                    placeholder="Ej. SENA / Universidad de Antioquia"
                    value={newEdu.institution}
                    onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado de los Estudios</label>
                  <select
                    value={newEdu.status}
                    onChange={(e) => setNewEdu({ ...newEdu, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="graduated">Graduado / Finalizado</option>
                    <option value="in_progress">En Curso / Estudiando</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Año Inicio</label>
                    <select
                      value={newEdu.startYear}
                      onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {newEdu.status === 'in_progress' ? 'Fin Estimado' : 'Año Grado'}
                    </label>
                    <select
                      value={newEdu.endYear}
                      onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none"
                    >
                      {FUTURE_YEARS.concat(YEARS).filter((v, i, a) => a.indexOf(v) === i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEdu(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Estudio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. SECCIÓN: CERTIFICACIONES & IDIOMAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Certificaciones */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Certificaciones & Cursos</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddCert(!showAddCert)}
                className="p-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {certifications.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-500">{c.issuer} · {c.year}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(c.id)}
                    className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {showAddCert && (
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2.5 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Nombre del Curso o Certificado"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Emisor (Platzi, Udemy, Google)"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none"
                  />
                  <select
                    value={newCert.year}
                    onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none font-medium"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCert(false)}
                    className="text-[11px] text-slate-500 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Idiomas con Lista Normalizada */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-600" />
                <span>Idiomas</span>
              </h2>
              <span className="text-xs text-slate-400">{languagesList.length} registrados</span>
            </div>

            <div className="space-y-2">
              {languagesList.map((lang) => (
                <div key={lang.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{lang.language}</span>
                    <span className="text-xs text-indigo-600 font-semibold ml-2">({lang.level})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang.id)}
                    className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none"
                >
                  {NORMALIZED_LANGUAGES.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <select
                  value={newLangLevel}
                  onChange={(e) => setNewLangLevel(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none"
                >
                  {LANGUAGE_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddLanguage}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Idioma</span>
              </button>
            </div>
          </div>

        </div>

        {/* 6. SECCIÓN: HABILIDADES & TECNOLOGÍAS */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Habilidades & Tecnologías</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {skills.length} agregadas
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe una habilidad (ej. React, Python, Ventas, Excel) y presiona Enter..."
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(newSkillInput);
                }
              }}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(newSkillInput)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 font-semibold text-xs border border-indigo-200 shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 rounded-full hover:bg-indigo-200 text-indigo-500 hover:text-indigo-900 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Sugerencias populares (haz clic para agregar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.filter(s => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7. SECCIÓN: PREFERENCIAS & SALARIO DESEADO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-4 border border-slate-200/90 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Preferencias de Empleo & Salario Deseado
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Seniority / Nivel</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as JuniorSeniorityLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="trainee">Trainee / Bootcamp (0 años)</option>
                <option value="intern">Pasantía / Prácticas (0 años)</option>
                <option value="junior">Junior (0 - 1 año)</option>
                <option value="entry_level">Entry Level (1 - 2 años)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Inglés</label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value as EnglishLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="no_english">Español (Sin inglés)</option>
                <option value="a1_beginner">A1 - Principiante</option>
                <option value="a2_elementary">A2 - Básico</option>
                <option value="b1_intermediate">B1 - Intermedio</option>
                <option value="b2_upper_intermediate">B2 - Intermedio Alto</option>
                <option value="c1_advanced">C1 - Avanzado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad Preferida</label>
              <select
                value={preferredModality}
                onChange={(e) => setPreferredModality(e.target.value as WorkModality)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="remote_worldwide">100% Remoto Global</option>
                <option value="remote_country">100% Remoto Colombia</option>
                <option value="hybrid">Híbrido</option>
                <option value="on_site">Presencial</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 mt-2">
            <label className="block text-xs font-bold text-emerald-950 mb-1">
              Salario Mínimo Deseado (USD / COP mensual)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-emerald-600">$</span>
              <input
                type="number"
                min={200}
                max={6000}
                step={50}
                value={minimumSalary}
                onChange={(e) => setMinimumSalary(Number(e.target.value))}
                className="w-36 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-extrabold text-sm focus:outline-none"
              />
              <span className="text-xs text-slate-600 font-medium">
                USD / mes (aprox. ${(minimumSalary * 4200).toLocaleString('es-CO')} COP mensuales)
              </span>
            </div>
          </div>
        </div>

        {/* 8. SECCIÓN: REDES Y ENLACES */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-4 border border-slate-200/90 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Enlaces & Redes Profesionales
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/tu-usuario"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-900" />
                <span>GitHub</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/tu-usuario"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portafolio / Web</span>
              </label>
              <input
                type="url"
                placeholder="https://miportafolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Floating / Sticky Bottom Bar for Mobile & Desktop */}
        <div className="sticky bottom-4 z-30 flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 backdrop-blur-md gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <span className="text-xs font-bold text-slate-300">
              Perfil: <strong className="text-emerald-400">{completeness}%</strong>
            </span>

            <button
              type="button"
              onClick={() => setShowHarvardPreview(true)}
              className="sm:hidden flex items-center gap-1 text-xs text-sky-400 font-bold underline"
            >
              Ver CV Harvard
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowHarvardPreview(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer border border-slate-700"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Ver CV Harvard</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Guardando en BD...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Guardar Mi Perfil & CV</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
