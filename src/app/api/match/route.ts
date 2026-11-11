import { NextResponse } from 'next/server';
import { matchJobs } from '@/lib/services/ranking';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const skills = Array.isArray(body.skills) ? body.skills.map((s: any) => String(s).trim()).filter(Boolean) : [];
    const matches = await matchJobs({
      skills,
      expectedSalaryUsd: Number(body.expectedSalaryUsd) || 0,
      preferredModality: body.preferredModality || 'remote_country',
      yearsExperience: Number(body.yearsExperience) || 0,
    });
    return NextResponse.json({ success: true, matches });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Error' }, { status: 500 });
  }
}
