import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });

    const { data } = await supabaseAdmin.rpc('verify_company_claim', { p_token: token });
    if (!data) return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 400 });

    return NextResponse.json({ success: true, company: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error' }, { status: 500 });
  }
}
