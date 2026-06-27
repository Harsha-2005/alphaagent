// GET /api/history — Returns list of past research sessions

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { researchSessions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ sessions: [], message: 'Database not configured' });
    }

    const sessions = await db
      .select({
        id: researchSessions.id,
        companyName: researchSessions.companyName,
        officialName: researchSessions.officialName,
        ticker: researchSessions.ticker,
        exchange: researchSessions.exchange,
        status: researchSessions.status,
        verdict: researchSessions.verdict,
        confidence: researchSessions.confidence,
        durationMs: researchSessions.durationMs,
        createdAt: researchSessions.createdAt,
      })
      .from(researchSessions)
      .orderBy(desc(researchSessions.createdAt))
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('GET /api/history error:', err);
    return NextResponse.json({ sessions: [], error: 'Failed to fetch history' });
  }
}
