import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPaymentStatus, getJobPublications } from '../services/api';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [data, setData] = useState(null);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Poll until job is processed (up to 30s)
    let attempts = 0;
    const poll = async () => {
      try {
        const result = await getPaymentStatus(sessionId);
        setData(result);

        if (result.job?.id && ['approved', 'published', 'completed'].includes(result.job.status)) {
          const pubs = await getJobPublications(result.job.id);
          setPublications(pubs);
          setLoading(false);
          return;
        }

        attempts++;
        if (attempts < 15) {
          setTimeout(poll, 2000);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    poll();
  }, [sessionId]);

  const job = data?.job;
  const payment = data?.payment;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: 600, textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
      <h1 style={{ marginBottom: '0.5rem' }}>Pagamento confirmado!</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Sua vaga foi recebida e está sendo processada. Você receberá um e-mail quando o Story for publicado.
      </p>

      {job && (
        <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Resumo da vaga</h3>
          <p><strong>Vaga:</strong> {job.title}</p>
          <p><strong>Empresa:</strong> {job.company_name}</p>
          <p><strong>Status:</strong> <StatusBadge status={job.status} /></p>
        </div>
      )}

      {loading && job?.status === 'under_review' && (
        <div style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>⚙️ Gerando seu Story e agendando publicação...</div>
          <div style={{
            height: 4, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: '60%',
              background: 'var(--color-brand)',
              animation: 'progress 1.5s ease infinite alternate',
            }} />
          </div>
        </div>
      )}

      {publications.length > 0 && (
        <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Agenda de publicações</h3>
          {publications.map(pub => (
            <div key={pub.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <span>Story #{pub.sequence_order}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {new Date(pub.scheduled_for).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <StatusBadge status={pub.status} />
            </div>
          ))}
        </div>
      )}

      {job?.story_copy && (
        <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Preview do copy gerado</h3>
          <pre style={{
            whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            fontSize: '0.9rem', color: 'var(--color-text)',
          }}>
            {job.story_copy}
          </pre>
        </div>
      )}

      <Link to="/" className="btn btn-secondary">← Voltar ao início</Link>
    </div>
  );
}

function StatusBadge({ status }) {
  const MAP = {
    pending_payment: { label: 'Aguardando pagamento', color: '#F39C12' },
    payment_approved: { label: 'Pagamento aprovado', color: '#27AE60' },
    under_review: { label: 'Em análise', color: '#3498DB' },
    approved: { label: 'Aprovado', color: '#27AE60' },
    rejected: { label: 'Reprovado', color: '#E74C3C' },
    published: { label: 'Publicado', color: '#8E44AD' },
    completed: { label: 'Concluído', color: '#2C3E50' },
    scheduled: { label: 'Agendado', color: '#3498DB' },
    manual_required: { label: 'Envio manual', color: '#E67E22' },
  };
  const s = MAP[status] || { label: status, color: '#aaa' };
  return (
    <span style={{
      background: s.color + '22', color: s.color,
      padding: '0.2rem 0.6rem', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}
