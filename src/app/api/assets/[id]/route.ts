import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Serve an uploaded asset (art/logo) stored in the DB.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(asset.data), {
    headers: {
      'Content-Type': asset.mime,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
