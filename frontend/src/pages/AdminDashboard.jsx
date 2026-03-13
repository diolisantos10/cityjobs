import React, { useEffect, useState, useCallback } from 'react';
import {
  adminGetJobs,
  adminApproveJob,
  adminRejectJob,
  adminGetSchedule,
  adminGetManualQueue,
  adminMarkPublished,
} from '../services/api';

const STATUS_COLORS = {
  pending_payment: '#F39C12', payment_approved: '#27AE60', under_review: '#3498DB',
  approved: '#27AE60', rejected: '#E74C3C', published: '#8E44AD',
  completed: '#2C3E50', scheduled: '#3498DB', manual_required: '#E67E22',
};
const RISK_COLORS = { low: '#27AE60', medium: '#F39C12', high: '#E74C3C', blocked: '#2C3E50' };

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + '22', color,
      padding: '0.2rem 0.6rem', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [manualQueue, setManualQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('under_review');
  const [expandedJob, setExpandedJob] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetJobs({ status: statusFilter || undefined });
      setJobs(data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadSchedule = useCallback(async () => {
    const data = await adminGetSchedule(new Date().toISOString().split('T')[0]);
    setSchedule(data.schedule || []);
  }, []);

  const loadManualQueue = useCallback(async () => {
    const data = await adminGetManualQueue();
    setManualQueue(data);
  }, []);

  useEffect(() => {
    if (tab === 'jobs') loadJobs();
    if (tab === 'schedule') loadSchedule();
    if (tab === 'manual') loadManualQueue();
  }, [tab, loadJobs, loadSchedule, loadManualQueue]);

  const handleApprove = async (jobId) => {
    await adminApproveJob(jobId, { reviewed_by: 'admin' });
    loadJobs();
  };

  const handleReject = async (jobId, reason) => {
    await adminRejectJob(jobId, { reviewed_by: 'admin', rejection_reason: reason });
    loadJobs();
  };

  const handleMarkPublished = async (pubId) => {
    await adminMarkPublished(pubId, { approved_by: 'admin', manual_notes: 'Publicado manualmente' });
    loadManualQueue();
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Painel Administrativo</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>CityJobs.sp — Gestão de vagas e publicações</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
        {[
          { id: 'jobs', label: '💼 Vagas' },
          { id: 'schedule', label: '📅 Agenda de hoje' },
          { id: 'manual', label: '⚠️ Fila manual' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.6rem 1rem',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid var(--color-brand)' : '3px solid transparent',
              background: 'none',
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--color-brand)' : 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Jobs tab */}
      {tab === 'jobs' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['', 'under_review', 'payment_approved', 'approved', 'rejected', 'published'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  background: statusFilter === s ? 'var(--color-brand)' : undefined,
                  color: statusFilter === s ? '#fff' : undefined,
                  borderColor: statusFilter === s ? 'var(--color-brand)' : undefined,
                }}
              >
                {s || 'Todas'}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma vaga encontrada.</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{job.title}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{job.company_name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <Badge label={job.status} color={STATUS_COLORS[job.status] || '#aaa'} />
                      {job.niche && <Badge label={job.niche} color="#3498DB" />}
                      {job.risk_level && <Badge label={`Risco: ${job.risk_level}`} color={RISK_COLORS[job.risk_level] || '#aaa'} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className="btn"
                      style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', background: '#eee' }}
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    >
                      {expandedJob === job.id ? 'Fechar' : 'Detalhes'}
                    </button>
                    {job.status === 'under_review' && (
                      <>
                        <button className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleApprove(job.id)}>
                          ✓ Aprovar
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            const reason = prompt('Motivo da reprovação:');
                            if (reason) handleReject(job.id, reason);
                          }}>
                          ✕ Reprovar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expandedJob === job.id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#FAFAFA', borderRadius: 8 }}>
                    <p><strong>Descrição:</strong> {job.description}</p>
                    {job.requirements && <p style={{ marginTop: '0.5rem' }}><strong>Requisitos:</strong> {job.requirements}</p>}
                    {job.story_copy && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <strong>Copy gerada:</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: '0.25rem' }}>{job.story_copy}</pre>
                      </div>
                    )}
                    {job.risk_flags && job.risk_flags.length > 0 && (
                      <div style={{ marginTop: '0.5rem', color: 'var(--color-error)' }}>
                        <strong>Flags de risco:</strong> {Array.isArray(job.risk_flags) ? job.risk_flags.join(', ') : job.risk_flags}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>
            Publicações agendadas para hoje — {new Date().toLocaleDateString('pt-BR')}
          </h2>
          {schedule.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma publicação agendada para hoje.</p>
          ) : (
            schedule.map(pub => (
              <div key={pub.id} className="card" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{pub.job_title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{pub.company_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(pub.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge label={pub.status} color={STATUS_COLORS[pub.status] || '#aaa'} />
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Manual queue */}
      {tab === 'manual' && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Fila de publicação manual</h2>
          {manualQueue.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Nenhum item pendente de publicação manual.</p>
          ) : (
            manualQueue.map(pub => (
              <div key={pub.id} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{pub.job_title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{pub.company_name}</div>
                    {pub.error_message && (
                      <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Erro: {pub.error_message}
                      </div>
                    )}
                    {pub.story_copy && (
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', maxWidth: 500 }}>
                        {pub.story_copy}
                      </pre>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleMarkPublished(pub.id)}
                  >
                    ✓ Marcar publicado
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
