import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { matchJobs } from '@/lib/services/ranking';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BASE = 'https://www.camelloonline.com';
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      if (res.ok) return true;
      if (res.status === 429) { await sleep(1500 * (attempt + 1)); continue; }
      return false;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

export async function GET(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  const from = process.env.RESEND_FROM_EMAIL || 'Camello Online <newsletter@camelloonline.com>';

  // 1. Candidatos CON perfil → match de vacantes
  const { data: profiles } = await supabaseAdmin
    .from('candidate_profiles')
    .select('user_id, first_name, skills, minimum_expected_salary_usd, preferred_modality, years_of_experience');
  const { data: users } = await supabaseAdmin.from('users').select('id, email');
  const emailById = new Map<string, string>((users || []).map((u: any) => [u.id, u.email]));

  let sentMatches = 0;
  const profiledIds = new Set<string>();

  for (const p of profiles || []) {
    profiledIds.add(p.user_id);
    const email = emailById.get(p.user_id);
    if (!email) continue;

    const skills: string[] = Array.isArray(p.skills) ? p.skills.map((s: any) => String(s)).filter(Boolean) : [];
    const matches = await matchJobs({
      skills,
      expectedSalaryUsd: Number(p.minimum_expected_salary_usd) || 0,
      preferredModality: p.preferred_modality || 'remote_country',
      yearsExperience: Number(p.years_of_experience) || 0,
    }, 5);

    const rows = matches.map((m, i) => {
      const j = m.job;
      return `<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-weight:700;color:#111;font-size:14px;">${i + 1}. ${esc(j.title)}</div>
        <div style="color:#555;font-size:12px;">${esc(j.companyName)} · ${esc(j.displayLocation || j.locationCity || '')}</div>
        <a href="${BASE}/jobs/${encodeURIComponent(j.slug)}" style="color:#d97706;font-weight:700;font-size:12px;">Ver vacante →</a>
      </div>`;
    }).join('');

    const html = `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="background:#0f172a;padding:20px;border-radius:14px 14px 0 0;color:#fff;">
        <h2 style="margin:0;font-size:18px;">🐫 Camello Online</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">Vacantes que te pueden funcionar</p>
      </div>
      <div style="background:#fff;padding:20px;border-radius:0 0 14px 14px;">
        <p style="font-size:14px;">Hola ${esc(p.first_name || '')}, según tu perfil estas vacantes te pueden interesar:</p>
        ${rows || '<p style="color:#777;font-size:13px;">Aún no encontramos matches perfectos; revisa el sitio para más opciones.</p>'}
        <div style="margin-top:16px;text-align:center;"><a href="${BASE}" style="background:#d97706;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Ver todas las vacantes</a></div>
      </div>
    </div>`;

    if (await sendEmail(apiKey, from, email, 'Tus vacantes recomendadas 🎯', html)) sentMatches++;
    await sleep(550);
  }

  // 2. Usuarios SIN perfil → invitarlos a completarlo
  let sentInvites = 0;
  for (const u of users || []) {
    if (profiledIds.has(u.id)) continue;
    const email = u.email;
    if (!email) continue;
    const html = `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="background:#0f172a;padding:20px;border-radius:14px 14px 0 0;color:#fff;">
        <h2 style="margin:0;font-size:18px;">🐫 Camello Online</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">Encuentra tu camello ideal</p>
      </div>
      <div style="background:#fff;padding:20px;border-radius:0 0 14px 14px;">
        <p style="font-size:14px;">Completa tu perfil y te enviaremos vacantes que coincidan con tus skills, salario y modalidad.</p>
        <div style="text-align:center;margin-top:16px;"><a href="${BASE}/candidate/profile" style="background:#d97706;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Completar mi perfil →</a></div>
      </div>
    </div>`;
    if (await sendEmail(apiKey, from, email, 'Completa tu perfil y recibe vacantes a tu medida', html)) sentInvites++;
    await sleep(550);
  }

  return NextResponse.json({ sentMatches, sentInvites });
}
