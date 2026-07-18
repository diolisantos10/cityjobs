import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { buildDesignSpec, type DesignBrief } from '@/lib/designAgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Design agent renderer — a polished 1080×1920 Instagram Story composed from
 * the design spec (palette + copy) and the client's logo. Variants 1..N give
 * distinct looks so a "2 artes" order yields two different designs.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string; variant: string } }
) {
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: { assets: true },
  });
  if (!job) return new Response('Not found', { status: 404 });

  const variant = Math.max(1, Number(params.variant) || 1);
  const brief = (job.designBrief ?? {}) as DesignBrief;

  const spec = buildDesignSpec(
    {
      niche: job.niche,
      roleTitle: job.roleTitle,
      companyName: job.companyName,
      neighborhood: job.neighborhood,
      city: job.city,
      salary: job.salary,
      benefits: job.benefits,
      applicationMethod: job.applicationMethod,
    },
    brief,
    variant
  );

  // Embed the client's logo when requested + available.
  let logoDataUri: string | null = null;
  if (brief.useLogo) {
    const logo = job.assets.find((a) => a.kind === 'LOGO');
    if (logo) logoDataUri = `data:${logo.mime};base64,${Buffer.from(logo.data).toString('base64')}`;
  }

  const p = spec.palette;
  const isClean = spec.layout === 'clean';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: isClean ? p.bg : `linear-gradient(160deg, ${p.bgAccent} 0%, ${p.bg} 70%)`,
          color: p.text,
          padding: '84px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar: brand + optional logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: p.text }}>
            cityjobs<span style={{ opacity: 0.55 }}>.sp</span>
          </div>
          {logoDataUri && (
            <img
              src={logoDataUri}
              width={120}
              height={120}
              style={{
                objectFit: 'contain',
                borderRadius: 16,
                background: isClean ? '#fff' : 'rgba(255,255,255,0.9)',
                padding: 10,
              }}
            />
          )}
        </div>

        {/* Niche pill */}
        <div style={{ display: 'flex', marginTop: 96 }}>
          <div
            style={{
              display: 'flex',
              background: p.accent,
              color: p.onAccent,
              borderRadius: 999,
              padding: '16px 34px',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {spec.nicheLabel}
          </div>
        </div>

        {/* Role */}
        <div style={{ display: 'flex', marginTop: 40, fontSize: 96, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1 }}>
          {spec.role}
        </div>

        {/* Company */}
        <div style={{ display: 'flex', marginTop: 22, fontSize: 46, fontWeight: 500, color: p.textMuted }}>
          {spec.company}
        </div>

        {/* Bottom block */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 26 }}>
          <div style={{ display: 'flex', fontSize: 40, color: p.textMuted }}>📍 {spec.location}</div>

          {/* Salary highlight */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: p.accent,
              color: p.onAccent,
              borderRadius: 22,
              padding: '30px 36px',
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            💰 {spec.salaryLine}
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 8,
              border: `3px solid ${isClean ? p.accent : 'rgba(255,255,255,0.85)'}`,
              color: p.text,
              borderRadius: 20,
              padding: '26px 40px',
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            👉 {spec.cta}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
