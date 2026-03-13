# CityJobs.sp

> Plataforma de divulgação de vagas locais em Instagram Stories para pequenos negócios em São Paulo.
> Perfil: **[@cityjobs.sp](https://instagram.com/cityjobs.sp)**

---

## Visão Geral

O CityJobs automatiza o ciclo completo de publicação de vagas de emprego como Stories no Instagram, desde a submissão pelo empregador até a publicação automática no perfil @cityjobs.sp.

```
Empresa → Formulário → Pagamento → Validação → Classificação → Análise de Risco
       → Geração de Copy (IA) → Agenda → Scheduler → Instagram
```

---

## Arquitetura

```
cityjobs/
├── backend/                  # API Node.js + Express
│   ├── src/
│   │   ├── app.js            # Entry point, middlewares, rotas
│   │   ├── config/
│   │   │   ├── database.js   # Pool PostgreSQL (pg)
│   │   │   └── logger.js     # Winston logger
│   │   ├── models/           # Acesso ao banco de dados
│   │   │   ├── Company.js
│   │   │   ├── Job.js
│   │   │   ├── Package.js
│   │   │   ├── Payment.js
│   │   │   └── Publication.js
│   │   ├── routes/           # Express routers
│   │   │   ├── jobs.js
│   │   │   ├── packages.js
│   │   │   ├── payments.js
│   │   │   └── publications.js
│   │   ├── services/         # Lógica de negócio
│   │   │   ├── nicheClassifier.js     # Classifica nicho por keywords
│   │   │   ├── riskAnalysis.js        # Analisa fraude/risco
│   │   │   ├── copyGenerator.js       # Gera copy via Claude API
│   │   │   ├── schedulerService.js    # Monta agenda de publicações
│   │   │   ├── instagramService.js    # Publica via Meta Graph API
│   │   │   └── jobProcessingService.js # Orquestra o pipeline
│   │   ├── middleware/
│   │   │   ├── adminAuth.js   # Autenticação por chave secreta
│   │   │   └── errorHandler.js
│   │   └── jobs/
│   │       └── scheduler.js   # Cron job (node-cron, 1/min)
│   ├── migrations/            # SQL migrations versionadas
│   │   ├── 001_create_companies.sql
│   │   ├── 002_create_jobs.sql
│   │   ├── 003_create_packages_and_payments.sql
│   │   ├── 004_create_publications.sql
│   │   └── run.js             # Migration runner
│   └── package.json
│
└── frontend/                 # React + Vite
    └── src/
        ├── pages/
        │   ├── HomePage.jsx          # Landing page com pacotes
        │   ├── JobFormPage.jsx       # Formulário da vaga (Step 1)
        │   ├── CheckoutPage.jsx      # Seleção de pacote (Step 2)
        │   ├── SuccessPage.jsx       # Confirmação + status da vaga
        │   └── AdminDashboard.jsx    # Painel admin
        ├── components/
        │   └── Header.jsx
        ├── services/
        │   └── api.js                # Axios client
        └── App.jsx                   # Roteamento React Router
```

---

## Banco de Dados (PostgreSQL)

### Tabelas

| Tabela | Descrição |
|---|---|
| `companies` | Dados da empresa anunciante |
| `jobs` | Vaga de emprego com status, niche, risco e copy |
| `packages` | Pacotes disponíveis (4 tipos) |
| `payments` | Registro de pagamentos Stripe |
| `publications` | Agenda de publicações por vaga |

### Ciclo de status de uma vaga

```
pending_payment
    → payment_approved   (webhook Stripe)
        → under_review   (pipeline iniciado)
            → approved   (risco OK, copy gerada, agenda criada)
            → rejected   (bloqueado por risco)
                → published  (scheduler publica)
                    → completed  (todos os stories publicados)
```

---

## Pacotes

| Tipo | Nome | Preço | Stories | Período |
|---|---|---|---|---|
| `single_story` | Story Único | R$ 49 | 1 | 1 dia |
| `multi_story_same_day` | Stories do Dia | R$ 99 | 3 | 1 dia (picos) |
| `multi_day_story` | Campanha Semanal | R$ 249 | 7 | 7 dias |
| `highlight_7d` | Destaque Premium | R$ 399 | 1 + destaque | 7 dias |

---

## Nichos

`varejo` · `saude` · `escritorio` · `restaurante` · `logistica` · `outros`

A classificação usa matching de keywords com score ponderado (keywords primárias valem 2x).
A confiança é calculada como `score_melhor_niche / score_total * 100`.

---

## Análise de Risco

### Bloqueios automáticos (risco = `blocked`)
- Vaga sem salário informado ou com "a combinar"
- Sem nome de empresa
- Keywords de fraude (pirâmide, pague para trabalhar, etc.)

### Sinais suspeitos (eleva score)
- Keywords suspeitas em excesso
- Salário irreal (> R$ 20.000 para cargos simples)
- Descrição muito curta (< 80 chars)
- Muitas letras maiúsculas
- Sem localização

---

## Pipeline de Processamento

Acionado automaticamente após webhook de pagamento aprovado:

```
1. Verificação de pagamento aprovado (GUARD obrigatório)
2. classifyNiche()     → niche + confidence + tags
3. analyzeRisk()       → risk_level + score + flags
4. Se blocked → status = rejected, pipeline encerra
5. generateStoryCopy() → Claude API ou template fallback
6. buildSchedule()     → cria publications no DB
7. status = approved
```

---

## Scheduler (Cron)

- Roda a cada minuto via `node-cron`
- Busca publications com `status = 'scheduled'` e `scheduled_for <= NOW()`
- Publica via Meta Graph API
- Em caso de falha: retry com backoff (30min × tentativa)
- Após 3 falhas: status = `manual_required`

### Horários de pico (BRT)
- **08:00** — Manhã (início de expediente)
- **12:00** — Almoço
- **18:00** — Saída do trabalho (maior engajamento)

---

## API Endpoints

### Público
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/packages` | Lista pacotes disponíveis |
| POST | `/api/jobs` | Submete nova vaga |
| GET | `/api/jobs/:id` | Detalhes de uma vaga |
| POST | `/api/payments/checkout` | Cria sessão Stripe Checkout |
| POST | `/api/payments/webhook` | Webhook Stripe (raw body) |
| GET | `/api/payments/status/:sessionId` | Status do pagamento |
| GET | `/api/publications/job/:jobId` | Publicações de uma vaga |

### Admin (requer header `x-admin-key`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/jobs` | Lista vagas com filtros |
| PATCH | `/api/jobs/:id/approve` | Aprova vaga manualmente |
| PATCH | `/api/jobs/:id/reject` | Reprova vaga |
| GET | `/api/publications/schedule` | Agenda do dia |
| GET | `/api/publications/pending-manual` | Fila manual |
| PATCH | `/api/publications/:id/mark-published` | Marca como publicado |

---

## Setup Local

### Pré-requisitos
- Node.js >= 18
- PostgreSQL rodando localmente
- Conta Stripe (modo teste)

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais

npm install
npm run migrate     # Cria tabelas + seeds de pacotes
npm run dev         # Inicia em modo desenvolvimento
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

---

## Deploy no Railway

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço **PostgreSQL** no projeto
3. Adicione um serviço para o **backend** (pasta `/backend`)
4. Configure as variáveis de ambiente conforme `.env.example`
5. O Railway detecta automaticamente Node.js via Nixpacks
6. Após deploy, rode as migrations:
   ```bash
   railway run npm run migrate
   ```
7. Configure o webhook do Stripe apontando para `https://seu-dominio/api/payments/webhook`

### Variáveis obrigatórias no Railway
```
DATABASE_URL          # Gerado automaticamente pelo serviço PostgreSQL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PUBLIC_KEY
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_BUSINESS_ACCOUNT_ID
ANTHROPIC_API_KEY
FRONTEND_URL          # URL do deploy do frontend
ADMIN_SECRET_KEY
```

---

## Regras de Negócio (Críticas)

> Estas regras **nunca** devem ser violadas:

1. **Nunca publicar sem pagamento aprovado** — o `processJobAfterPayment` verifica `payment.status === 'approved'` antes de qualquer ação.
2. **Nunca publicar vaga sem salário** — `analyzeRisk` bloqueia automaticamente.
3. **Nunca publicar vaga sem empresa** — `analyzeRisk` bloqueia automaticamente.
4. **Nunca publicar vaga suspeita de fraude** — keywords de fraude bloqueiam automaticamente.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 18+ · Express 4 |
| Banco de Dados | PostgreSQL + node-postgres (pg) |
| Pagamentos | Stripe Checkout |
| IA (copy) | Anthropic Claude API (claude-haiku-4-5) |
| Instagram | Meta Graph API v18 |
| Agendamento | node-cron |
| Frontend | React 18 · React Router 6 · React Hook Form |
| Build | Vite 5 |
| Deploy | Railway |
| Logs | Winston |
