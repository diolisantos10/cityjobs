import { prisma } from '@/lib/prisma';
import { buildStoryImageResponse } from '@/lib/renderDesign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Design agent renderer — a polished 1080×1920 Instagram Story composed from
 * the design spec (palette + copy) and the client's logo. Variants 1..N give
 * distinct looks so a "2 artes" order yields two different designs. A renderização
 * fica em `buildStoryImageResponse` para ser reaproveitada pelo /api/publish-image
 * (sem fetch HTTP interno, que falha por SSL no Railway).
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
  return buildStoryImageResponse(job, variant);
}
