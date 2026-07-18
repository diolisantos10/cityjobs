import Link from 'next/link';

/**
 * "Em breve" splash shown at / while COMING_SOON=true.
 * Brand palette taken from the CityJobs logo (navy + white).
 * The employer intake (/anunciar) and /admin stay reachable by direct URL.
 */
export function ComingSoon() {
  return (
    <div className="cj-soon">
      <div className="cj-soon-inner">
        <div className="cj-logo">
          <span>CITY</span>
          <span>JOBS</span>
        </div>

        <p className="cj-soon-badge">Em breve</p>

        <h1 className="cj-soon-title">Vagas locais com salário aberto</h1>
        <p className="cj-soon-sub">
          O canal de vagas de <strong>São Paulo e Grande São Paulo</strong> direto nos stories.
          Vagas reais, salário visível, candidatura rápida.
        </p>

        <a
          className="cj-soon-ig"
          href="https://instagram.com/cityjobs.sp"
          target="_blank"
          rel="noopener noreferrer"
        >
          Siga @cityjobs.sp no Instagram →
        </a>

        <Link href="/anunciar" className="cj-soon-link">
          É empresa? Anuncie sua vaga
        </Link>
      </div>
    </div>
  );
}
