# CityJobs SP

> Canal pago de publicação de vagas locais, distribuído via Instagram Stories (**@cityjobs.sp**).
> Não é um job board tradicional — é mídia local de vagas com curadoria, salário aberto e empresa identificada.

Este MVP substitui a stack frágil de Tally + Make + Google Sheets por uma aplicação web real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| ORM | Prisma |
| Banco | PostgreSQL |
| Validação | Zod |
| Deploy | Railway |

Sem dependências de automação externa. Pagamento via links configuráveis (Mercado Pago), sem integração de API nesta versão.

---

## Fluxos do MVP

### Empresa (público)
1. Acessa `/` (landing) → CTA **"Anunciar vaga"**
2. Preenche o formulário em `/anunciar` (salário e empresa obrigatórios)
3. Seleciona o plano (1, 3 ou 7 dias)
4. Confirma que a vaga é real (checkbox obrigatório)
5. Recebe página de confirmação em `/vagas/[id]/confirmacao` com:
   - resumo da vaga, plano, preço
   - botão com o link de pagamento correto do plano
   - status **Aguardando pagamento**

### Admin
1. Acessa `/admin` (gate por `ADMIN_SECRET`)
2. Dashboard com KPIs (total, aguardando pagamento, pagas, aprovadas, publicadas)
3. Tabela de vagas com filtros (status, nicho, cidade)
4. Detalhe da vaga em `/admin/jobs/[id]`:
   - informações completas + story copy gerada
   - ações: **Marcar como paga · Aprovar · Rejeitar · Marcar como publicada · Arquivar**
   - notas de moderação
5. Configuração de planos em `/admin/plans` (preço, link de pagamento, ativar/desativar)

### Ciclo de status da vaga

```
AWAITING_PAYMENT → PAID → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED
                                    ↘ REJECTED
```

---

## Planos (seed padrão)

| Plano | Preço | Link de pagamento |
|---|---|---|
| 1 dia | R$ 29 | https://mpago.li/1q7LgWX |
| 3 dias | R$ 49 | https://mpago.li/1TqHkoe |
| 7 dias (destaque) | R$ 79 | https://mpago.li/23cDcPh |

Preços e links são editáveis em `/admin/plans`. Cada vaga grava o preço e link vigentes no momento do envio.

---

## Story Copy

Geração determinística em código (sem IA na v1), formato:

```
[ESCRITÓRIO]
Auxiliar Administrativo
Empresa XPTO
📍 Pinheiros – São Paulo
💰 R$ 3.000 + VT, VR
👉 Candidate-se pelo WhatsApp
```

Regras: salário sempre visível, empresa sempre visível, nicho em maiúsculas, texto conciso. Gerada no envio e armazenada em `JobPost.storyCopy`.

---

## Regras de confiança

- Curadoria paga, não mural aberto
- Salário obrigatório — vagas sem salário não passam na validação do formulário
- Empresa identificada obrigatória
- Títulos genéricos ("vaga", "trabalho", "oportunidade", "diversas vagas") são rejeitados
- Aprovação do admin antes de qualquer publicação
- Avisos visíveis: *"Vagas passam por validação antes da publicação."* e *"Golpes ou informações falsas resultam em banimento permanente."*

---

## Estrutura do projeto

```
cityjobs/
├── prisma/
│   ├── schema.prisma          # Company, JobPost, PlanConfig, AdminUser
│   ├── seed.ts                # Seed dos 3 planos
│   └── migrations/            # Migration inicial (PostgreSQL)
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Landing
│   │   ├── anunciar/page.tsx              # Formulário de envio
│   │   ├── vagas/[id]/page.tsx            # Status público da vaga (empresa acompanha)
│   │   ├── vagas/[id]/confirmacao/page.tsx
│   │   ├── api/story-art/[id]/route.tsx   # Arte do Story (imagem 9:16) via next/og
│   │   └── admin/
│   │       ├── layout.tsx                 # Gate ADMIN_SECRET
│   │       ├── page.tsx                   # Dashboard + KPIs + filtros
│   │       ├── jobs/[id]/page.tsx         # Detalhe + ações + notas + trust + edição
│   │       └── plans/page.tsx             # Configuração de planos
│   ├── actions/
│   │   ├── jobs.ts            # createJobPost, updateJobStatus, updateModerationNotes, updateJobFields
│   │   ├── plans.ts           # updatePlanConfig, seedPlanConfigs
│   │   └── admin.ts           # adminLogin, adminLogout
│   ├── components/
│   │   ├── JobForm.tsx        # Formulário client-side com campos condicionais
│   │   ├── EditJobForm.tsx    # Edição de campos no admin (regenera story copy)
│   │   ├── TrustFlagsPanel.tsx
│   │   ├── StatusBadge.tsx
│   │   └── AdminLoginForm.tsx
│   └── lib/
│       ├── prisma.ts          # Client singleton
│       ├── validation.ts      # Schemas Zod (submissão + edição)
│       ├── storyCopy.ts       # Geração determinística de copy
│       ├── company.ts         # findOrCreateCompany (dedupe por CNPJ)
│       ├── trust.ts           # Heurísticas de risco (trustFlags)
│       ├── rateLimit.ts       # Anti-spam por IP (janela em memória)
│       ├── plans.ts           # Auto-seed + consultas de planos
│       ├── adminAuth.ts       # Gate por cookie + ADMIN_SECRET
│       └── constants.ts       # Nichos, contratos, status, formatação
├── test/                      # node:test + tsx (storyCopy, validation, trust)
└── railway.json
```

---

## Setup local

### Pré-requisitos
- Node.js ≥ 18.17
- PostgreSQL rodando

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# edite DATABASE_URL e ADMIN_SECRET

# 3. Criar o banco (aplica migrations)
npm run prisma:migrate          # produção: migrate deploy
# ou em desenvolvimento:
npm run prisma:migrate:dev

# 4. Seed dos planos
npm run prisma:seed

# 5. Rodar
npm run dev                     # http://localhost:3000

# Testes (lógica pura — não precisa de banco)
npm test                        # storyCopy, validação, trust
```

> Os planos também são auto-seedados na primeira visita a `/anunciar` ou `/admin/plans` caso o banco esteja vazio.

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `ADMIN_SECRET` | Senha de acesso ao painel `/admin` |

---

## Deploy no Railway

1. Crie um projeto no [Railway](https://railway.app) e adicione um serviço **PostgreSQL**
2. Adicione um serviço apontando para este repositório
3. Configure as variáveis:
   - `DATABASE_URL` → referência ao serviço PostgreSQL (`${{Postgres.DATABASE_URL}}`)
   - `ADMIN_SECRET` → senha forte de sua escolha
4. O `railway.json` já define o start command:
   ```
   npm run prisma:migrate && npm run prisma:seed && npm run start
   ```
   (migrations e seed idempotentes rodam a cada deploy)
5. O build (`npm run build`) já executa `prisma generate` automaticamente

---

## Checklist de teste

- [ ] `/` carrega com os 3 planos e preços corretos
- [ ] `/anunciar` envia vaga válida e redireciona para confirmação
- [ ] Confirmação mostra plano, preço e link de pagamento corretos do plano escolhido
- [ ] Vaga criada com status `AWAITING_PAYMENT` e story copy gerada
- [ ] Formulário rejeita: sem salário, sem empresa, título genérico ("vaga"), sem checkbox
- [ ] Campo WhatsApp obrigatório quando método = WhatsApp; link quando método = Link
- [ ] `/admin` sem `ADMIN_SECRET` configurado mostra aviso de setup
- [ ] `/admin` pede senha e aceita apenas o valor de `ADMIN_SECRET`
- [ ] KPIs e filtros do dashboard funcionam
- [ ] Detalhe da vaga: marcar paga → aprovar → publicar → arquivar persistem
- [ ] Notas de moderação persistem
- [ ] `/admin/plans` edita preço/link e nova vaga usa os valores atualizados
- [ ] `/vagas/[id]` mostra o status da vaga para a empresa (read-only)
- [ ] `/api/story-art/[id]` retorna a arte do Story (imagem 9:16)
- [ ] Painel de confiança lista trustFlags (ex: sem CNPJ, termos suspeitos)
- [ ] Admin consegue editar campos da vaga e a story copy é regenerada
- [ ] `npm test` passa (20 testes)
- [ ] `npm run build` conclui sem erros

---

## Recursos da Fase 2 (adicionados)

- **Company vinculada**: cada submissão cria/reaproveita uma `Company` (dedupe por CNPJ, ou por nome quando sem CNPJ) e grava `companyId` na vaga.
- **Página de status pública** (`/vagas/[id]`): a empresa acompanha o status pelo link, com explicação em linguagem clara e lembrete de pagamento enquanto pendente.
- **trustFlags**: heurísticas determinísticas de risco no envio (termos de golpe, salário fora de faixa, empresa genérica, sem CNPJ) — não bloqueiam, apenas sinalizam para o admin.
- **Arte do Story**: imagem 9:16 gerada server-side (`next/og`) a partir dos dados da vaga, para publicação manual no Instagram.
- **Edição no admin**: correção de qualquer campo da vaga, regenerando a story copy.
- **Rate limiting**: proteção anti-spam por IP no envio de vagas.
- **Testes**: `node:test` + `tsx`, sem dependências novas, cobrindo story copy, validação e trust.

### Follow-ups conhecidos
- Teste e2e do fluxo completo de submissão (depende de Postgres em CI — os testes atuais cobrem a lógica pura).
- Confirmação de pagamento automática (webhook Mercado Pago) — hoje o admin marca "paga" manualmente.
- Auth admin multiusuário usando o model `AdminUser` (hoje é gate por segredo único).
