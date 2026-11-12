import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE = 'https://www.camelloonline.com';
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const q = url.searchParams.get('secret');
    const header = request.headers.get('authorization');
    if (q !== secret && header !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  const from = process.env.RESEND_FROM_EMAIL || 'Camello Online <newsletter@camelloonline.com>';

  // Referidores (gente que ya invitó a alguien) → reciben las vacantes más nuevas ("premium")
  const { data: referrals } = await supabaseAdmin.from('referrals').select('referrer_email');
  const referrers = [...new Set((referrals || []).map((r: any) => (r.referrer_email || '').trim().toLowerCase()).filter(Boolean))];
  if (referrers.length === 0) return NextResponse.json({ sent: 0, message: 'Sin referidores aún' });

  // Las 10 vacantes más nuevas (premium)
  const { data: jobs } = await supabaseAdmin
    .from('job_posts')
    .select('title, slug, companies(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  const rows = (jobs || []).map((j: any, i: number) => {
    const comp = Array.isArray(j.companies) ? j.companies[0] : j.companies;
    return `<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
      <div style="font-weight:700;color:#111;font-size:14px;">${i + 1}. ${esc(j.title)}</div>
      <div style="color:#555;font-size:12px;">${esc(comp?.name || '')}</div>
      <a href="${BASE}/jobs/${encodeURIComponent(j.slug)}" style="color:#d97706;font-weight:700;font-size:12px;">Ver vacante →</a>
    </div>`;
  }).join('');

  let sent = 0;
  for (const email of referrers) {
    const html = `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="background:#0f172a;padding:20px;border-radius:14px 14px 0 0;color:#fff;">
        <h2 style="margin:0;font-size:18px;">⭐ Vacantes Premium para ti</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">Gracias por invitar gente. Estas son las más nuevas:</p>
      </div>
      <div style="background:#fff;padding:20px;border-radius:0 0 14px 14px;">${rows}</div>
    </div>`;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [email], subject: '⭐ Tus vacantes premium de la semana', html }),
      });
      if (res.ok) sent++;
    } catch { /* continuar */ }
  }

  return NextResponse.json({ sent, referrers: referrers.length });
}
