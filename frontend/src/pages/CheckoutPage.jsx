import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPackages, getJob, createCheckout } from '../services/api';

const PACKAGE_ICONS = {
  single_story: '📸',
  multi_story_same_day: '🔥',
  multi_day_story: '📅',
  highlight_7d: '⭐',
};

function formatPrice(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(cents / 100);
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job_id');

  const [packages, setPackages] = useState([]);
  const [job, setJob] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) { navigate('/anunciar'); return; }
    Promise.all([getPackages(), getJob(jobId)])
      .then(([pkgs, j]) => {
        setPackages(pkgs);
        setJob(j);
        setSelectedPkg(pkgs[1]?.id); // default: second package
      })
      .catch(() => setError('Erro ao carregar dados.'));
  }, [jobId]);

  const handleCheckout = async () => {
    if (!selectedPkg) return;
    setLoading(true);
    setError(null);
    try {
      const { checkout_url } = await createCheckout({ job_id: jobId, package_id: selectedPkg });
      window.location.href = checkout_url;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao iniciar pagamento.');
      setLoading(false);
    }
  };

  if (!job) return <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 700 }}>
      <div className="step-indicator">
        <div className="step done">✓ Dados da Vaga</div>
        <div className="step-divider" />
        <div className="step active">2 Escolha o Pacote</div>
        <div className="step-divider" />
        <div className="step">3 Pagamento</div>
      </div>

      <h1 style={{ marginBottom: '0.25rem' }}>Escolha o pacote</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Vaga: <strong>{job.title}</strong> — {job.company_name}
      </p>

      {error && (
        <div style={{
          background: '#FDEDEC', border: '1px solid var(--color-error)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          color: 'var(--color-error)',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {packages.map(pkg => (
          <label
            key={pkg.id}
            className="card"
            style={{
              cursor: 'pointer',
              border: selectedPkg === pkg.id
                ? '2px solid var(--color-brand)'
                : '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
            }}
          >
            <input
              type="radio"
              name="package"
              value={pkg.id}
              checked={selectedPkg === pkg.id}
              onChange={() => setSelectedPkg(pkg.id)}
              style={{ accentColor: 'var(--color-brand)', width: 18, height: 18 }}
            />
            <span style={{ fontSize: '1.8rem' }}>{PACKAGE_ICONS[pkg.type] || '📦'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{pkg.name}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{pkg.description}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-brand)', whiteSpace: 'nowrap' }}>
              {formatPrice(pkg.price_cents)}
            </div>
          </label>
        ))}
      </div>

      {/* Summary */}
      {selectedPkg && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#FFF5F8' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Resumo</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {packages.find(p => p.id === selectedPkg)?.description}
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            ✅ Publicado em até 24h após aprovação do pagamento<br />
            ✅ Story gerado automaticamente com IA<br />
            ✅ Agendado nos horários de maior engajamento
          </p>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '1rem' }}
        disabled={!selectedPkg || loading}
        onClick={handleCheckout}
      >
        {loading ? 'Redirecionando para pagamento...' : 'Pagar com segurança →'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
        🔒 Pagamento processado com segurança via Stripe
      </p>
    </div>
  );
}
