import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CityJobs SP — Vagas locais com salário aberto',
  description:
    'Publique sua vaga local com salário aberto. Vagas reais, validadas, publicadas nos stories do CityJobs SP.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-brand-700">
              cityjobs<span className="text-gray-400">.sp</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/anunciar" className="btn-primary px-4 py-2">
                Anunciar vaga
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-500">
            <p className="font-medium text-gray-600">
              Vagas passam por validação antes da publicação.
            </p>
            <p className="mt-1">Golpes ou informações falsas resultam em banimento permanente.</p>
            <p className="mt-3">© {new Date().getFullYear()} CityJobs SP</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
