import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim();

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token de reclamo no proporcionado.' }, { status: 400 });
    }

    // Consultar exclusivamente con supabaseAdmin en el servidor para evitar exponer claim_token en el cliente
    const { data: job, error } = await supabaseAdmin
      .from('job_posts')
      .select('id, title, company_name, salary_min, salary_max, salary_min_usd, salary_max_usd, is_claimed')
      .eq('claim_token', token)
      .maybeSingle();

    if (error || !job) {
      return NextResponse.json({ valid: false, error: 'Token de reclamo no encontrado o inválido.' }, { status: 404 });
    }

    if (job.is_claimed) {
      return NextResponse.json({ valid: false, error: 'Esta vacante ya ha sido reclamada previamente.' }, { status: 409 });
    }

    return NextResponse.json({
      valid: true,
      job: {
        id: job.id,
        title: job.title,
        companyName: job.company_name,
        salaryMinUsd: job.salary_min_usd || job.salary_min || 0,
        salaryMaxUsd: job.salary_max_usd || job.salary_max || 0
      }
    });
  } catch (err: any) {
    console.error('Error verificando token de reclamo:', err);
    return NextResponse.json({ valid: false, error: 'Error interno verificando el token.' }, { status: 500 });
  }
}
