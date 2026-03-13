import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--color-border)',
      padding: '0.75rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '1.3rem',
            background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            CityJobs.sp
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>Início</Link>
          <Link to="/anunciar" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Anunciar Vaga
          </Link>
        </nav>
      </div>
    </header>
  );
}
