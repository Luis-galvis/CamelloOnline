import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const VALID_MODALITIES = ['remote_worldwide', 'remote_country', 'hybrid', 'on_site'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyName = (body.companyName || '').trim();
    const contactEmail = (body.contactEmail || '').trim();
    const title = (body.title || '').trim();

    if (companyName.length < 2) return NextResponse.json({ success: false, error: 'Falta el nombre de la empresa' }, { status: 400 });
    if (title.length < 4) return NextResponse.json({ success: false, error: 'Falta el título de la vacante' }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) return NextResponse.json({ success: false, error: 'Email de contacto inválido' }, { status: 400 });

    const modality = VALID_MODALITIES.includes(body.workModality) ? body.workModality : 'on_site';

    const { data, error } = await supabaseAdmin.rpc('publish_company_job', {
      p_company_name: companyName,
      p_company_website: (body.website || '').trim(),
      p_contact_email: contactEmail,
      p_title: title,
      p_description: (body.description || `Vacante de ${title} en ${companyName}.`).slice(0, 2000),
      p_work_modality: modality,
      p_location_city: (body.locationCity || 'Colombia').trim(),
      p_salary_min_usd: Number(body.salaryMinUsd) || null,
      p_salary_max_usd: Number(body.salaryMaxUsd) || null,
      p_currency: (body.currency || 'COP').trim().toUpperCase(),
      p_is_zero_experience: Boolean(body.isZeroExperience),
      p_english_required: body.englishRequired || 'no_english',
    });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error' }, { status: 500 });
  }
}
