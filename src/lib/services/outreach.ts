/**
 * Automated Recruiter Outreach Engine
 * 
 * Sends automated, highly-personalized claim emails to companies whose junior job postings
 * were ingested from ATS, granting them a magic link to claim their listing & access the Reverse Board.
 */

export interface OutreachPayload {
  companyName: string;
  companyDomain: string;
  recipientEmail: string;
  jobTitle: string;
  jobSlug: string;
  claimToken: string;
  sourceUrl: string;
}

export interface OutreachSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  error?: string;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'JuniorTech';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://juniortech.dev';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || 'talento@juniortech.dev';

export function generateClaimUrl(claimToken: string): string {
  return `${APP_URL}/claim-job?token=${claimToken}`;
}

export function buildOutreachEmailHtml(payload: OutreachPayload): string {
  const claimUrl = generateClaimUrl(payload.claimToken);
  const viewJobUrl = `${APP_URL}/jobs/${payload.jobSlug}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Publicamos su vacante de ${payload.jobTitle} en ${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090a0f; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #11131a; border: 1px solid #1e2230; border-radius: 12px; padding: 32px; }
    .badge { display: inline-block; background: #2563eb; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { color: #f8fafc; font-size: 22px; margin-top: 16px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 12px 0; }
    .job-card { background: #161922; border: 1px solid #272d3f; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .job-title { color: #38bdf8; font-size: 17px; font-weight: 600; margin: 0 0 6px 0; }
    .job-meta { color: #64748b; font-size: 13px; margin: 0; }
    .btn-primary { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 12px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e2230; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Nicho Tech Junior & Entry-Level</span>
    <h1>Hola equipo de ${payload.companyName},</h1>
    <p>
      Detectamos su reciente búsqueda para la posición de <strong>${payload.jobTitle}</strong> en su portal oficial y la hemos destacado <strong>sin ningún costo</strong> en <strong>${APP_NAME}</strong>.
    </p>
    
    <div class="job-card">
      <div class="job-title">${payload.jobTitle}</div>
      <p class="job-meta">Empresa: ${payload.companyName} | Publicada en ATS</p>
    </div>

    <p>
      ${APP_NAME} es el primer Job Board y <em>Reverse Job Board</em> exclusivo para talento tecnológico con <strong>0 a 2 años de experiencia</strong> (Trainees, Interns, Juniors y Graduados) que cuentan con proyectos verificados en GitHub.
    </p>

    <p><strong>¿Qué pueden hacer con su cuenta verificada?</strong></p>
    <ul style="color: #94a3b8; font-size: 14px; line-height: 1.7;">
      <li>Gestionar y editar los requisitos de su vacante directamente.</li>
      <li>Recibir postulaciones filtradas y sin spam de candidatos junior calificados.</li>
      <li><strong>Reverse Job Board:</strong> Enviar ofertas directas a candidatos disponibles y pre-evaluados antes de que postulen.</li>
    </ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${claimUrl}" class="btn-primary" target="_blank">Reclamar Vacante y Activar Empresa Gratis &rarr;</a>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      Si no eres el encargado de reclutamiento técnico, puedes reenviar este enlace a tu equipo de People/Talent Acquisition.
    </p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME} Inc. Plataforma de Empleo Tech Transparente.</p>
      <p><a href="${viewJobUrl}" style="color: #64748b;">Ver publicación</a> · <a href="${APP_URL}" style="color: #64748b;">Conocer más</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendRecruiterOutreach(payload: OutreachPayload): Promise<OutreachSendResult> {
  const subject = `Publicamos su vacante de ${payload.jobTitle} en ${APP_NAME} (Nicho Junior Tech)`;
  const htmlContent = buildOutreachEmailHtml(payload);

  // Si no está configurada la API Key de Resend en el entorno, registramos simulación para desarrollo
  if (!RESEND_API_KEY) {
    console.log(`[OUTREACH SIMULATION] Email to: ${payload.recipientEmail}`);
    console.log(`[OUTREACH SIMULATION] Subject: ${subject}`);
    console.log(`[OUTREACH SIMULATION] Magic Claim URL: ${generateClaimUrl(payload.claimToken)}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      recipient: payload.recipientEmail
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [payload.recipientEmail],
        subject: subject,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Resend failed with status ${response.status}`);
    }

    return {
      success: true,
      messageId: data.id,
      recipient: payload.recipientEmail
    };
  } catch (error: any) {
    console.error(`[OUTREACH ERROR] Failed to send to ${payload.recipientEmail}:`, error);
    return {
      success: false,
      recipient: payload.recipientEmail,
      error: error.message
    };
  }
}
