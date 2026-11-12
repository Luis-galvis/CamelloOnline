import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body._hp) return NextResponse.json({ success: true }); // honeypot

    const email = (body.email || '').trim().toLowerCase();
    const companyName = (body.companyName || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
    if (companyName.length < 2) return NextResponse.json({ success: false, error: 'Nombre de empresa inválido' }, { status: 400 });

    // Verificación: no se aceptan correos personales gratuitos para reclamar una empresa.
    const FREE_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'aol.com', 'live.com', 'proton.me', 'protonmail.com', 'mail.com'];
    const domain = email.split('@')[1];
    if (!domain || FREE_DOMAINS.includes(domain)) {
      return NextResponse.json({ success: false, error: 'Usa un email empresarial (no gmail/hotmail/yahoo) para verificar tu empresa' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('request_company_claim', {
      p_email: email,
      p_company_name: companyName,
    });
    if (error || !data?.token) return NextResponse.json({ success: false, error: error?.message || 'Error' }, { status: 500 });

    const token = data.token;
    const link = `https://www.camelloonline.com/para-empresas?token=${token}`;

    // Enviar el link por email si Resend está configurado
    const apiKey = process.env.RESEND_API_KEY;
    let emailError = '';
    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Camello Online <newsletter@camelloonline.com>',
            to: [email],
            subject: 'Reclama tu empresa en Camello Online',
            html: `<p>Hola,</p><p>Reclama tu empresa <strong>${companyName}</strong> en Camello Online para publicar y gestionar tus vacantes.</p><p><a href="${link}" style="background:#d97706;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">Reclamar mi empresa →</a></p><p>Este enlace expira en 7 días.</p>`,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          emailError = errBody?.message || `HTTP ${res.status}`;
          console.error('[request-claim] Resend error:', emailError);
        }
      } catch (e: any) {
        emailError = e.message;
      }
    } else {
      emailError = 'RESEND_API_KEY no configurada';
    }

    // Si el email falló o no hay Resend, devolver el token como respaldo (para no bloquear).
    return NextResponse.json({ success: true, ...(emailError ? { token, link, emailError } : {}) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error' }, { status: 500 });
  }
}
