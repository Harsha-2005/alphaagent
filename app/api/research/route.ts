// POST /api/research — Start a new research session
// GET /api/research?sessionId=xxx — SSE stream for live updates
// GET /api/research?sessionId=xxx&result=true — Get full result

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { runResearch } from '@/lib/agent/graph';
import { createSession, updateSession, appendStep, getSession } from '@/lib/store';
import { getDb } from '@/lib/db';
import { researchSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for research

// POST: Start research
export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid company name' }, { status: 400 });
    }

    const sessionId = uuidv4();
    const startTime = Date.now();

    // Initialize in-memory session
    createSession(sessionId, {
      id: sessionId,
      companyName: companyName.trim(),
      status: 'running',
      createdAt: new Date().toISOString(),
      steps: [],
    });

    // Save to DB (optional — skip if DATABASE_URL not set)
    const db = getDb();
    if (db) {
      try {
        await db.insert(researchSessions).values({
          id: sessionId,
          companyName: companyName.trim(),
          status: 'running',
        });
      } catch (dbErr) {
        console.warn('DB insert failed (non-fatal):', dbErr);
      }
    }

    // Run agent in background
    (async () => {
      try {
        const result = await runResearch(companyName.trim(), (step) => {
          appendStep(sessionId, step);
        });

        const durationMs = Date.now() - startTime;
        const sessionData = {
          ...result,
          id: sessionId,
          status: 'done',
          durationMs,
        };

        updateSession(sessionId, sessionData);

        // Update DB
        const db2 = getDb();
        if (db2) {
          try {
            await db2
              .update(researchSessions)
              .set({
                status: 'done',
                officialName: result.officialName,
                ticker: result.ticker,
                exchange: result.exchange,
                verdict: result.verdictResult?.verdict,
                confidence: result.verdictResult?.confidence,
                report: sessionData as any,
                durationMs,
                updatedAt: new Date(),
              })
              .where(eq(researchSessions.id, sessionId));
          } catch (dbErr) {
            console.warn('DB update failed (non-fatal):', dbErr);
          }
        }
      } catch (err) {
        console.error('Research agent error:', err);
        updateSession(sessionId, { status: 'error', error: String(err) });

        const db3 = getDb();
        if (db3) {
          try {
            await db3
              .update(researchSessions)
              .set({ status: 'error', updatedAt: new Date() })
              .where(eq(researchSessions.id, sessionId));
          } catch {}
        }
      }
    })();

    return NextResponse.json({ sessionId });
  } catch (err) {
    console.error('POST /api/research error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: SSE stream or full result
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const wantResult = searchParams.get('result') === 'true';

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  // Return full result JSON
  if (wantResult) {
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  // SSE stream
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        if (!closed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }
      };

      // Send heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat);
          return;
        }
        send({ type: 'heartbeat' });
      }, 15000);

      // Poll for updates every 500ms
      let lastStepCount = 0;
      const poll = setInterval(() => {
        if (closed) {
          clearInterval(poll);
          clearInterval(heartbeat);
          return;
        }

        const session = getSession(sessionId);
        if (!session) {
          send({ type: 'error', message: 'Session not found' });
          clearInterval(poll);
          clearInterval(heartbeat);
          controller.close();
          closed = true;
          return;
        }

        // Send new steps
        const currentSteps = session.steps || [];
        if (currentSteps.length > lastStepCount) {
          const newSteps = currentSteps.slice(lastStepCount);
          newSteps.forEach((step: any) => send({ type: 'step', data: step }));
          lastStepCount = currentSteps.length;
        }

        // Check if done
        if (session.status === 'done' || session.status === 'error') {
          send({ type: 'complete', data: session });
          clearInterval(poll);
          clearInterval(heartbeat);
          setTimeout(() => {
            if (!closed) {
              controller.close();
              closed = true;
            }
          }, 100);
        }
      }, 500);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
