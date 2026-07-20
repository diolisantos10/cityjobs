import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Diagnóstico isolado das etapas de publish-image. Protegido por ADMIN_SECRET. */
export async function GET(req: Request) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const out: Record<string, unknown> = { marker: 'diag-v1' };

  // 1) sharp funciona? (gera um PNG sólido e converte pra JPEG)
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#c00' } })
      .png().toBuffer();
    const jpeg = await sharp(png).resize(50, 50).jpeg().toBuffer();
    out.sharp = { ok: true, pngBytes: png.length, jpegBytes: jpeg.length };
  } catch (e) {
    out.sharp = { ok: false, err: e instanceof Error ? e.message : String(e) };
  }

  // 2) buildStoryImageResponse + arrayBuffer com um job real (o mais recente)
  const jobId = new URL(req.url).searchParams.get('job');
  const job = jobId
    ? await prisma.jobPost.findUnique({ where: { id: jobId }, include: { assets: true } })
    : await prisma.jobPost.findFirst({ where: { artMode: 'WE_CREATE' }, include: { assets: true }, orderBy: { createdAt: 'desc' } });
  if (!job) { out.render = { ok: false, err: 'no job' }; return NextResponse.json(out); }
  out.jobId = job.id;

  try {
    const { buildStoryImageResponse } = await import('@/lib/renderDesign');
    const img = await buildStoryImageResponse(job, 1);
    out.renderStep = 'built ImageResponse';
    const ab = await img.arrayBuffer();
    out.render = { ok: true, pngBytes: ab.byteLength };
    try {
      const sharp = (await import('sharp')).default;
      const jpeg = await sharp(Buffer.from(ab)).resize(1080, 1920, { fit: 'cover' }).flatten({ background: '#fff' }).jpeg({ quality: 90 }).toBuffer();
      out.convert = { ok: true, jpegBytes: jpeg.length };
    } catch (e) {
      out.convert = { ok: false, err: e instanceof Error ? e.message : String(e) };
    }
  } catch (e) {
    out.render = { ok: false, err: e instanceof Error ? `${e.message}` : String(e) };
  }

  return NextResponse.json(out);
}
