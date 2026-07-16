import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { NICHE_STORY_LABELS } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Instagram Story format (9:16). Rendered server-side for manual publishing.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({ where: { id: params.id } });

  if (!job) {
    return new Response('Not found', { status: 404 });
  }

  const salaryLine = job.benefits?.trim()
    ? `${job.salary} + ${job.benefits.trim()}`
    : job.salary;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #047857 0%, #065f46 60%, #064e3b 100%)',
          color: 'white',
          padding: '80px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
          cityjobs<span style={{ opacity: 0.6 }}>.sp</span>
        </div>

        {/* Niche pill */}
        <div style={{ display: 'flex', marginTop: 120 }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.16)',
              borderRadius: 999,
              padding: '14px 32px',
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {NICHE_STORY_LABELS[job.niche]}
          </div>
        </div>

        {/* Role */}
        <div style={{ display: 'flex', marginTop: 40, fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
          {job.roleTitle}
        </div>

        {/* Company */}
        <div style={{ display: 'flex', marginTop: 24, fontSize: 44, fontWeight: 500, opacity: 0.9 }}>
          {job.companyName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 28 }}>
          <div style={{ display: 'flex', fontSize: 40 }}>📍 {job.neighborhood} – {job.city}</div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>💰 {salaryLine}</div>
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              background: 'white',
              color: '#047857',
              borderRadius: 20,
              padding: '28px 40px',
              fontSize: 44,
              fontWeight: 800,
              justifyContent: 'center',
            }}
          >
            👉 Candidate-se
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
