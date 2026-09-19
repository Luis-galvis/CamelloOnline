import { NextResponse } from 'next/server';
import { aggregateAllColombiaJobs } from '@/lib/services/scrapers/index';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed duration on Vercel Pro, standard on hobby

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  // Optional CRON_SECRET check if set in environment
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await aggregateAllColombiaJobs();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalJobs: report.totalDeduplicatedColombiaJobs,
      remoteJobs: report.remoteCount,
      ibagueJobs: report.ibagueCount,
      sources: report.sourcesBreakdown
    });
  } catch (error: any) {
    console.error('Error executing scraper cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
