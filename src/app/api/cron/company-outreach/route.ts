import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE = 'https://www.camelloonline.com';

export async function GET(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });

  // Empresas con email de contacto (las que reclamaron/publicaron).
  // Las auto-ingestadas no tienen email todavía; se van sumando a medida que reclaman.
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name, contact_email')
    .not('contact_email', 'is', null);

  if (!companies || companies.length === 0) {
    return NextResponse.json({ sent: 0, companies: 0, message: 'Sin emails de empresas recolectados aún' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Camello Online <newsletter@camelloonline.com>';
  let sent = 0;

  for (const c of companies) {
    const email = (c.contact_email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;

    // Generar token fresco de reclamo para esta empresa
    const { data } = await supabaseAdmin.rpc('request_company_claim', {
      p_email: email,
      p_company_name: c.name,
    });
    const token = data?.token;
    const link = token ? `${BASE}/para-empresas?token=${token}` : `${BASE}/para-empresas`;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Publica tus vacantes gratis en Camello Online',
          html: `<p>Hola,</p><p>En Camello Online puedes publicar tus vacantes gratis y llegar a talento junior y remoto en Colombia.</p><p><a href="${link}" style="background:#d97706;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">Publicar vacante →</a></p><p>Este enlace expira en 7 días.</p>`,
        }),
      });
      if (res.ok) sent++;
    } catch {
      // continuar
    }
  }

  return NextResponse.json({ sent, companies: companies.length });
}
