import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'cityjobs_admin';

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length > 0);
}

export function isAdmin(): boolean {
  if (!adminConfigured()) return false;
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  return cookie === process.env.ADMIN_SECRET;
}

export function requireAdmin(): void {
  if (!isAdmin()) {
    throw new Error('Acesso não autorizado');
  }
}
