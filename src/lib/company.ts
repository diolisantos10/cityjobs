import { prisma } from './prisma';

/**
 * Finds or creates a Company for a job submission.
 * Dedupes by CNPJ when provided (normalized to digits); otherwise dedupes
 * by exact company name. Keeps the Company record fresh with the latest name.
 */
export async function findOrCreateCompany(input: {
  name: string;
  cnpj?: string | null;
}): Promise<string> {
  const cnpjDigits = input.cnpj ? input.cnpj.replace(/\D/g, '') : '';

  if (cnpjDigits.length > 0) {
    const existing = await prisma.company.findFirst({
      where: { cnpj: cnpjDigits },
    });
    if (existing) {
      if (existing.name !== input.name) {
        await prisma.company.update({
          where: { id: existing.id },
          data: { name: input.name },
        });
      }
      return existing.id;
    }
    const created = await prisma.company.create({
      data: { name: input.name, cnpj: cnpjDigits },
    });
    return created.id;
  }

  // No CNPJ: dedupe by exact name to avoid duplicate companies for repeat posters.
  const byName = await prisma.company.findFirst({
    where: { name: input.name, cnpj: null },
  });
  if (byName) return byName.id;

  const created = await prisma.company.create({
    data: { name: input.name },
  });
  return created.id;
}
