import { NextResponse } from 'next/server';
import { getWeeklyTopJobs } from '@/lib/services/ranking';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE = 'https://www.camelloonline.com';

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(ranked: any[]): string {
  const rows = ranked.map((r, i) => {
    const j = r.job;
    const badges = [
      j.isZeroExperience ? '🌱 Sin experiencia' : '',
      j.isRemote ? '🏠 Remoto' : '',
      j.salaryDisplayText && j.salaryDisplayText !== 'Salario a convenir' ? esc(j.salaryDisplayText) : '',
    ].filter(Boolean).join(' · ');
    return `<tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:15px;font-weight:700;color:#111;">${i + 1}. ${esc(j.title)}</div>
        <div style="font-size:13px;color:#555;margin-top:2px;">${esc(j.companyName)} · ${esc(j.displayLocation || j.locationCity || 'Colombia')}</div>
        ${badges ? `<div style="font-size:12px;color:#777;margin-top:4px;">${badges}</div>` : ''}
        <a href="${BASE}/jobs/${encodeURIComponent(j.slug)}" style="display:inline-block;margin-top:8px;font-size:13px;font-weight:700;color:#d97706;text-decoration:none;">Ver vacante →</a>
      </td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;color:#fff;">
      <h1 style="margin:0;font-size:22px;">🐫 Camello Online</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#cbd5e1;">Los mejores camellos de la semana</p>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:24px;">
      <p style="font-size:14px;color:#333;margin:0 0 16px;">Estas son las vacantes destacadas de la semana en Colombia: sin experiencia, remotas y con buen salario.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="margin-top:20px;text-align:center;">
        <a href="${BASE}" style="background:#d97706;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;display:inline-block;">Ver todas las vacantes</a>
      </div>
    </div>
    <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">Recibes este correo porque te suscribiste en camelloonline.com. 100% gratis.</p>
  </div>
</body></html>`;
}

export async function GET(request: Request) {
  // Protección opcional: query ?secret= o header Authorization.
  const url = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const q = url.searchParams.get('secret');
    const header = request.headers.get('authorization');
    if (q !== secret && header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Camello Online <newsletter@camelloonline.com>';

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  }

  // Suscriptores activos
  const { data: subs } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('email')
    .eq('is_active', true);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, subscribers: 0, message: 'No hay suscriptores' });
  }

  const ranked = await getWeeklyTopJobs(10);
  const html = buildHtml(ranked);

  let sent = 0;
  const errors: string[] = [];
  for (const s of subs) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [s.email],
          subject: '🏆 Los mejores camellos de la semana',
          html,
        }),
      });
      if (res.ok) sent++;
      else errors.push(`${s.email}: ${res.status}`);
    } catch (e: any) {
      errors.push(`${s.email}: ${e.message}`);
    }
  }

  return NextResponse.json({ sent, subscribers: subs.length, errors });
}
