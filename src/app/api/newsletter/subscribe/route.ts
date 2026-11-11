import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const clean = (email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email: clean });

    if (error) {
      if (/duplicate/i.test(error.message)) {
        return NextResponse.json({ success: true, message: 'Ya estás suscrito' });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error' }, { status: 500 });
  }
}
