import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { submitJob } from '../services/api';

const CONTRACT_TYPES = ['CLT', 'PJ', 'Estágio', 'Freelance', 'Temporário'];
const WORK_MODELS = ['Presencial', 'Híbrido', 'Remoto'];

export default function JobFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: { job: { contract_type: 'CLT', work_model: 'Presencial' } },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError(null);
    try {
      const result = await submitJob(data);
      navigate(`/checkout?job_id=${result.job.id}`);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error?.message
        || 'Erro ao enviar vaga. Tente novamente.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 700 }}>
      {/* Steps */}
      <div className="step-indicator">
        <div className="step active">1 Dados da Vaga</div>
        <div className="step-divider" />
        <div className="step">2 Escolha o Pacote</div>
        <div className="step-divider" />
        <div className="step">3 Pagamento</div>
      </div>

      <h1 style={{ marginBottom: '0.25rem' }}>Anunciar vaga</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Preencha os dados da empresa e da vaga. Seu Story será publicado no <strong>@cityjobs.sp</strong>.
      </p>

      {serverError && (
        <div style={{
          background: '#FDEDEC', border: '1px solid var(--color-error)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          color: 'var(--color-error)',
        }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Company ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Dados da Empresa</h2>

          <div className="form-group">
            <label>Nome da empresa *</label>
            <input
              {...register('company.name', { required: 'Obrigatório' })}
              placeholder="Ex: Padaria do João"
            />
            {errors.company?.name && <span className="error">{errors.company.name.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>E-mail de contato *</label>
              <input
                type="email"
                {...register('company.email', { required: 'Obrigatório' })}
                placeholder="contato@empresa.com"
              />
              {errors.company?.email && <span className="error">{errors.company.email.message}</span>}
            </div>
            <div className="form-group">
              <label>Telefone / WhatsApp *</label>
              <input
                {...register('company.phone', { required: 'Obrigatório' })}
                placeholder="(11) 9 9999-9999"
              />
              {errors.company?.phone && <span className="error">{errors.company.phone.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>CNPJ</label>
              <input {...register('company.cnpj')} placeholder="00.000.000/0001-00" />
            </div>
            <div className="form-group">
              <label>Instagram da empresa</label>
              <input {...register('company.instagram_handle')} placeholder="@suaempresa" />
            </div>
          </div>

          <div className="form-group">
            <label>Bairro</label>
            <input {...register('company.neighborhood')} placeholder="Ex: Pinheiros" />
          </div>
        </div>

        {/* ── Job ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Dados da Vaga</h2>

          <div className="form-group">
            <label>Título da vaga *</label>
            <input
              {...register('job.title', { required: 'Obrigatório' })}
              placeholder="Ex: Vendedor(a) — Período Integral"
            />
            {errors.job?.title && <span className="error">{errors.job.title.message}</span>}
          </div>

          <div className="form-group">
            <label>Descrição da vaga *</label>
            <textarea
              rows={5}
              {...register('job.description', {
                required: 'Obrigatório',
                minLength: { value: 50, message: 'Mínimo 50 caracteres' },
              })}
              placeholder="Descreva as atividades, rotina, ambiente de trabalho..."
            />
            {errors.job?.description && <span className="error">{errors.job.description.message}</span>}
          </div>

          <div className="form-group">
            <label>Requisitos</label>
            <textarea
              rows={3}
              {...register('job.requirements')}
              placeholder="Ex: Ensino médio completo, experiência com atendimento ao público..."
            />
          </div>

          <div className="form-group">
            <label>Benefícios</label>
            <textarea
              rows={2}
              {...register('job.benefits')}
              placeholder="Ex: Vale-transporte, vale-refeição, plano de saúde..."
            />
          </div>

          {/* Salary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Salário mínimo (R$) *</label>
              <input
                type="number"
                min="0"
                step="100"
                {...register('job.salary_min', { required: 'Informe o salário', min: 0 })}
                placeholder="1.500"
              />
              {errors.job?.salary_min && <span className="error">{errors.job.salary_min.message}</span>}
            </div>
            <div className="form-group">
              <label>Salário máximo (R$)</label>
              <input
                type="number"
                min="0"
                step="100"
                {...register('job.salary_max')}
                placeholder="2.500"
              />
            </div>
            <div className="form-group">
              <label>Exibição do salário</label>
              <input
                {...register('job.salary_display')}
                placeholder="Ex: R$ 1.500 + comissão"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Tipo de contrato *</label>
              <select {...register('job.contract_type', { required: true })}>
                {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Modelo de trabalho</label>
              <select {...register('job.work_model')}>
                {WORK_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Bairro / Região</label>
              <input {...register('job.neighborhood')} placeholder="Ex: Vila Madalena" />
            </div>
            <div className="form-group">
              <label>Endereço / Local</label>
              <input {...register('job.location')} placeholder="Ex: Rua das Flores, 123" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1rem' }} disabled={loading}>
          {loading ? 'Enviando...' : 'Continuar para escolha do pacote →'}
        </button>
      </form>
    </div>
  );
}
