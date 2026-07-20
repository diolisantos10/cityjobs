import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultRegion } from '@/lib/regions';
import { resolveIgCreds, publishStory } from '@/lib/instagram';
import { getOrCreateBackground } from '@/lib/artBackground';
import { generateStoryCopy } from '@/lib/storyCopy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Teste real de auto-publicação: cria uma vaga de exemplo, gera a arte (fundo IA
 * + texto) e publica o Story no Instagram da região. Protegido por ADMIN_SECRET.
 *   curl -X POST -H "x-admin-key: <ADMIN_SECRET>" https://<dominio>/api/admin/test-story
 */
export async function POST(req: Request) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const region = await getDefaultRegion();
  const creds = region ? resolveIgCreds(region) : null;
  if (!creds) {
    return NextResponse.json({ error: 'Região sem credenciais do Instagram.' }, { status: 400 });
  }

  const sample = {
    companyName: 'Restaurante Sabor Paulista',
    roleTitle: 'Auxiliar de Cozinha',
    niche: 'RESTAURANTE' as const,
    neighborhood: 'Centro',
    city: 'Mogi das Cruzes',
    contractType: 'CLT' as const,
    salary: 'R$ 2.100',
    benefits: 'VT, VR, refeição no local',
    applicationMethod: 'WHATSAPP' as const,
  };

  const storyCopy = generateStoryCopy({ ...sample, benefits: sample.benefits });

  const job = await prisma.jobPost.create({
    data: {
      regionId: region!.id,
      ...sample,
      applicationWhatsapp: '11999999999',
      selectedPlanDays: 1,
      planPriceInCents: 0,
      priceInCents: 0,
      paymentLink: '',
      artMode: 'WE_CREATE',
      artDesignCount: 1,
      designBrief: { useLogo: false, style: 'moderno e apetitoso', colors: 'laranja e branco', notes: '' } as object,
      status: 'APPROVED',
      storyCopy,
    },
  });

  const origin = process.env.APP_URL || new URL(req.url).origin;

  try {
    // Pré-gera o fundo IA antes da Meta buscar (evita timeout no render frio).
    await getOrCreateBackground({ ...job, assets: [] }).catch(() => null);
    const mediaId = await publishStory(creds, `${origin}/api/publish-image/${job.id}`);
    await prisma.jobPost.update({
      where: { id: job.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    return NextResponse.json({ ok: true, jobId: job.id, mediaId, account: region!.instagramHandle });
  } catch (err) {
    return NextResponse.json(
      { ok: false, jobId: job.id, error: err instanceof Error ? err.message : 'erro' },
      { status: 502 }
    );
  }
}
