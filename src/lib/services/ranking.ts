import 'server-only';
import { fetchActiveRows } from './market-stats';
import { mapDbRowToJobPost } from './job-finder';
import { JobPost } from '@/types';

export interface RankedJob {
  job: JobPost;
  score: number;
}

/** Puntaje de "mejor camello": prioriza sin experiencia, remoto, salario real y frescura. */
function weeklyScore(r: any): number {
  let s = 0;
  if (r.is_zero_experience) s += 40;
  const mod = r.work_modality;
  if (mod === 'remote_worldwide' || mod === 'remote_country') s += 25;
  const sal = Number(r.salary_min_usd);
  if (sal > 0 && sal !== 700 && sal !== 1500) s += 20; // salario real publicado
  if (r.currency === 'USD' || sal >= 1000) s += 15;
  const age = Date.now() - new Date(r.created_at || 0).getTime();
  if (age < 7 * 86400000) s += 10;   // última semana
  if (age < 2 * 86400000) s += 5;    // últimos 2 días
  const src = (r.source_url || '').toLowerCase();
  if (src.includes('himalayas') || src.includes('greenhouse') || src.includes('lever') || src.includes('ashby')) s += 5;
  return s;
}

/** Nombres de empresa genéricos/placeholder que NO son empresas reales. */
function isGenericCompanyName(name: string): boolean {
  const n = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!n || n === 'empresa' || n === 'compania' || n === 'confidencial') return true;
  return /^(empresa verificada|empresa confidencial|empresa remota|importante empresa|reconocida)/.test(n);
}

/** Top N vacantes de la semana, clasificadas por el algoritmo (excluye empresas fantasma). */
export async function getWeeklyTopJobs(limit = 12): Promise<RankedJob[]> {
  const rows = await fetchActiveRows();
  return rows
    .map((r: any) => ({ job: mapDbRowToJobPost(r), score: weeklyScore(r) }))
    .filter(x => !isGenericCompanyName(x.job.companyName))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface CandidateMatchProfile {
  skills: string[];
  expectedSalaryUsd: number;
  preferredModality: string; // remote_country | remote_worldwide | hybrid | on_site
  yearsExperience: number;
}

/** Puntaje de match candidato ↔ vacante (0-100). */
function matchScore(r: any, p: CandidateMatchProfile): number {
  const text = `${r.title || ''} ${r.description || ''}`.toLowerCase();
  let s = 0;

  // Skills (0-40)
  const hits = p.skills.filter(sk => sk && text.includes(sk.toLowerCase())).length;
  s += p.skills.length > 0 ? Math.round((hits / p.skills.length) * 40) : 20;

  // Modalidad (0-20)
  const mod = r.work_modality;
  const pref = p.preferredModality;
  if (mod === pref) s += 20;
  else if ((mod === 'remote_country' || mod === 'remote_worldwide') && (pref === 'remote_country' || pref === 'remote_worldwide')) s += 15;
  else s += 5;

  // Salario (0-20)
  const sal = Number(r.salary_min_usd) || 700;
  if (sal >= p.expectedSalaryUsd) s += 20;
  else if (sal >= p.expectedSalaryUsd * 0.7) s += 10;
  else s += 2;

  // Experiencia (0-20)
  const req = Number(r.max_years_experience_required) || 0;
  if (p.yearsExperience >= req) s += 20;
  else if (p.yearsExperience >= req - 1) s += 10;
  else s += 2;

  return s;
}

/** Top N vacantes que mejor matchean con el perfil del candidato. */
export async function matchJobs(profile: CandidateMatchProfile, limit = 15): Promise<RankedJob[]> {
  const rows = await fetchActiveRows();
  return rows
    .map((r: any) => ({ job: mapDbRowToJobPost(r), score: matchScore(r, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
