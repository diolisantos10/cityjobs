import { NextResponse } from 'next/server';
import { publishDueJobs } from '@/lib/autoPublish';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron de auto-publicação. Um agendador externo (Railway Cron / pinger) chama
 * este endpoint a cada poucos minutos. Protegido por CRON_SECRET.
 *
 *   curl -H "x-cron-secret: <CRON_SECRET>" https://<dominio>/api/cron/publish
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const origin = process.env.APP_URL || new URL(req.url).origin;
  const result = await publishDueJobs(origin);
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
