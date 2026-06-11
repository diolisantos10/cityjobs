'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, adminConfigured } from '@/lib/adminAuth';

export interface AdminLoginState {
  error?: string;
}

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  if (!adminConfigured()) {
    return { error: 'ADMIN_SECRET não está configurado no servidor.' };
  }

  const secret = String(formData.get('secret') ?? '');

  if (secret !== process.env.ADMIN_SECRET) {
    return { error: 'Senha de acesso incorreta.' };
  }

  cookies().set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  cookies().delete(ADMIN_COOKIE);
  redirect('/admin');
}
