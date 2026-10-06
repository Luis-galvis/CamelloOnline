import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token?.trim();
    const companyName = body?.companyName?.trim();
    const recruiterEmail = body?.recruiterEmail?.trim()?.toLowerCase();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token de reclamo requerido.' }, { status: 400 });
    }

    if (!recruiterEmail || !recruiterEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Correo corporativo válido requerido.' }, { status: 400 });
    }

    // 1. Verificar token y estado de la vacante en el servidor
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('job_posts')
      .select('id, title, is_claimed, company_id')
      .eq('claim_token', token)
      .maybeSingle();

    if (fetchError || !job) {
      return NextResponse.json({ success: false, error: 'Token de reclamo no válido o expirado.' }, { status: 404 });
    }

    if (job.is_claimed) {
      return NextResponse.json({ success: false, error: 'Esta vacante ya fue reclamada.' }, { status: 409 });
    }

    // 2. Marcar como reclamada y neutralizar el claim_token para evitar reuso
    const { error: updateError } = await supabaseAdmin
      .from('job_posts')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        // Neutralizamos o revocamos el token una vez consumido
        claim_token: null
      })
      .eq('id', job.id);

    if (updateError) {
      console.error('Error al actualizar reclamo de vacante:', updateError);
      return NextResponse.json({ success: false, error: 'Error al registrar el reclamo de la vacante.' }, { status: 500 });
    }

    // 3. Si se proporciona nombre de empresa y tiene company_id, actualizar la empresa
    if (job.company_id && companyName) {
      await supabaseAdmin
        .from('companies')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          billing_email: recruiterEmail
        })
        .eq('id', job.company_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Vacante reclamada exitosamente.',
      jobId: job.id
    });
  } catch (err: any) {
    console.error('Error procesando reclamo de vacante:', err);
    return NextResponse.json({ success: false, error: 'Error interno en el servidor.' }, { status: 500 });
  }
}
