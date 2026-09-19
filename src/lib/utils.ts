import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSeniority(seniority: string): string {
  const map: Record<string, string> = {
    trainee: 'Trainee / Bootcamp',
    intern: 'Pasantía / Intern',
    junior: 'Junior (0-1 año)',
    entry_level: 'Entry Level (1-2 años)',
    early_mid: 'Early Mid (< 2.5 años)',
  };
  return map[seniority] || seniority;
}

export function formatModality(modality: string): string {
  const map: Record<string, string> = {
    remote_worldwide: 'Remoto Global',
    remote_country: 'Remoto País',
    hybrid: 'Híbrido',
    on_site: 'Presencial',
  };
  return map[modality] || modality;
}

export function formatEnglish(level: string): string {
  const map: Record<string, string> = {
    no_english: 'Sin inglés',
    a1_beginner: 'A1 - Principiante',
    a2_elementary: 'A2 - Elemental',
    b1_intermediate: 'B1 - Intermedio',
    b2_upper_intermediate: 'B2 - Profesional',
    c1_advanced: 'C1 - Avanzado',
    c2_proficient_native: 'C2 - Nativo/Fluido',
  };
  return map[level] || level;
}

export function getRemainingDays(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}
