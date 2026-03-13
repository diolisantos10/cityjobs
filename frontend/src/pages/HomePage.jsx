import React from 'react';
import { Link } from 'react-router-dom';

const NICHES = [
  { icon: '🛍️', label: 'Varejo' },
  { icon: '💊', label: 'Saúde' },
  { icon: '💼', label: 'Escritório' },
  { icon: '🍴', label: 'Restaurante' },
  { icon: '🚚', label: 'Logística' },
];

const PACKAGES = [
  { name: 'Story Único', price: 'R$ 49', desc: '1 publicação no @cityjobs.sp', highlight: false },
  { name: 'Stories do Dia', price: 'R$ 99', desc: '3 publicações no mesmo dia', highlight: true },
  { name: 'Campanha Semanal', price: 'R$ 249', desc: '1 Story por dia por 7 dias', highlight: false },
  { name: 'Destaque Premium', price: 'R$ 399', desc: 'Story + destaque no perfil por 7 dias', highlight: false },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #E1306C 0%, #F77737 100%)',
        color: '#fff',
        padding: '4rem 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            Sua vaga no Instagram de São Paulo
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
            O <strong>@cityjobs.sp</strong> conecta pequenos negócios aos melhores talentos locais
            através de Stories no Instagram.
          </p>
          <Link to="/anunciar" className="btn" style={{
            background: '#fff',
            color: 'var(--color-brand)',
            fontSize: '1.1rem',
            padding: '0.9rem 2rem',
          }}>
            Anunciar Vaga Agora →
          </Link>
        </div>
      </section>

      {/* Niches */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Segmentos atendidos</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {NICHES.map(n => (
              <div key={n.label} className="card" style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '2rem' }}>{n.icon}</div>
                <div style={{ fontWeight: 600, marginTop: '0.5rem' }}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#fff', padding: '3rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Como funciona</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '1', title: 'Preencha o formulário', desc: 'Dados da empresa e detalhes da vaga' },
              { step: '2', title: 'Escolha o pacote', desc: 'Single, multi-day ou destaque premium' },
              { step: '3', title: 'Pague com segurança', desc: 'Checkout via Stripe com cartão' },
              { step: '4', title: 'Publicação automática', desc: 'Story gerado e agendado automaticamente' },
            ].map(item => (
              <div key={item.step} className="card" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'var(--color-brand)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1.2rem',
                  margin: '0 auto 1rem',
                }}>
                  {item.step}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Pacotes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.name} className="card" style={{
                textAlign: 'center',
                border: pkg.highlight ? '2px solid var(--color-brand)' : undefined,
                position: 'relative',
              }}>
                {pkg.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--color-brand)', color: '#fff',
                    padding: '0.2rem 0.8rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    Mais Popular
                  </div>
                )}
                <h3>{pkg.name}</h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-brand)', margin: '0.5rem 0' }}>
                  {pkg.price}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {pkg.desc}
                </p>
                <Link to="/anunciar" className="btn btn-primary" style={{ width: '100%' }}>
                  Anunciar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-text)', color: '#aaa',
        textAlign: 'center', padding: '2rem',
        fontSize: '0.85rem',
      }}>
        <p>© 2024 CityJobs.sp · Vagas locais em São Paulo via Instagram</p>
        <p style={{ marginTop: '0.5rem' }}>
          Instagram: <a href="https://instagram.com/cityjobs.sp" style={{ color: '#E1306C' }}>@cityjobs.sp</a>
        </p>
      </footer>
    </div>
  );
}
