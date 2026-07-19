import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { jobArtUrl } from '@/lib/publishing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve a arte final da vaga como **JPEG 1080×1920** — formato que a API da
 * Meta exige para publicar Stories. Converte a arte (PNG do agente ou o upload
 * do cliente) e garante fundo branco (sem transparência) e proporção 9:16.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: { assets: true },
  });
  if (!job) return new Response('Not found', { status: 404 });

  // Bytes de origem: upload do cliente (SELF_UPLOAD) ou render do agente/story-art.
  let source: Buffer;
  const artAsset = job.assets.find((a) => a.kind === 'ART');
  if (job.artMode === 'SELF_UPLOAD' && artAsset) {
    source = Buffer.from(artAsset.data);
  } else {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}${jobArtUrl(job, job.assets)}`);
    if (!res.ok) return new Response('Falha ao gerar arte', { status: 502 });
    source = Buffer.from(await res.arrayBuffer());
  }

  const jpeg = await sharp(source)
    .resize(1080, 1920, { fit: 'cover' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90 })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
