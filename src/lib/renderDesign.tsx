import { ImageResponse } from 'next/og';
import type { JobPost, Asset } from '@prisma/client';
import { buildDesignSpec, type DesignBrief } from './designAgent';
import { getOrCreateBackground } from './artBackground';

type JobWithAssets = JobPost & { assets: Asset[] };

/**
 * Renderiza a arte do Story (1080×1920) como ImageResponse (PNG).
 * Compartilhado pela rota /api/design e pelo /api/publish-image — este último
 * chama direto (sem fetch HTTP interno, que falha por SSL no Railway).
 */
export async function buildStoryImageResponse(
  job: JobWithAssets,
  variant: number
): Promise<ImageResponse> {
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

  let logoDataUri: string | null = null;
  if (brief.useLogo) {
    const logo = job.assets.find((a) => a.kind === 'LOGO');
    if (logo) logoDataUri = `data:${logo.mime};base64,${Buffer.from(logo.data).toString('base64')}`;
  }

  let bgDataUri: string | null = null;
  if (job.artMode === 'WE_CREATE') {
    const bg = await getOrCreateBackground(job);
    if (bg) bgDataUri = `data:image/png;base64,${bg.toString('base64')}`;
  }

  const p = spec.palette;
  const isClean = spec.layout === 'clean' && !bgDataUri;

  const rootBackground = bgDataUri
    ? `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.72) 100%), url(${bgDataUri})`
    : isClean
      ? p.bg
      : `linear-gradient(160deg, ${p.bgAccent} 0%, ${p.bg} 70%)`;

  const text = bgDataUri ? '#FFFFFF' : p.text;
  const textMuted = bgDataUri ? 'rgba(255,255,255,0.85)' : p.textMuted;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundImage: rootBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: text,
          padding: '84px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: text }}>
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

        <div style={{ display: 'flex', marginTop: 40, fontSize: 96, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1 }}>
          {spec.role}
        </div>

        <div style={{ display: 'flex', marginTop: 22, fontSize: 46, fontWeight: 500, color: textMuted }}>
          {spec.company}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 26 }}>
          <div style={{ display: 'flex', fontSize: 40, color: textMuted }}>📍 {spec.location}</div>

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

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 8,
              border: `3px solid ${isClean ? p.accent : 'rgba(255,255,255,0.85)'}`,
              color: text,
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
