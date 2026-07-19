# CityJobs — Status & Backlog

_Atualizado na madrugada da sessão autônoma._

## ✅ No ar e funcionando (produção)
- **Site + pagamento real** (Mercado Pago: cartão + PIX embutido) — validado com pagamento real
- **Fase 1** — cadastro com escolha de arte: "CityJobs cria" (pago, 1/2 artes) vs "envio minha arte" (upload) + anamnese
- **Fase 2** — agente de design: briefing (cores/estilo/logo) → arte 1080×1920 automática, texto nítido
- **Central de publicação** (`/admin/agenda`) — fila com arte + copy prontos
- **Auto-publicação no Instagram** (API oficial STORIES) — vaga aprovada publica sozinha no horário; scheduler in-process a cada 5 min + `/api/cron/publish` (backup) + botão manual
- **Regiões** (`/admin/regioes`) — segmentação por região, cada uma com seu Instagram/credenciais; SP+Grande SP seedada. Base pronta para escalar (Campinas etc.)
- **Preço de arte configurável** (`/admin/art-prices`) — 1 arte R$41,90 / 2 artes R$69,90 (−30% da média de mercado)
- Página **"Em breve"** (flag `COMING_SOON`), health check, trust flags

## 🔑 Fluxo automático (paga e esquece)
1. Cliente anuncia → escolhe arte (agente ou upload) → paga (cartão/PIX)
2. Pagamento aprovado → vaga **limpa** (sem flag de risco) é **auto-aprovada** e ganha horário de pico; vaga com risco espera revisão no admin
3. No horário, o scheduler publica o **Story sozinho** na conta da região (se as credenciais da Meta estiverem configuradas)
4. Sem credenciais → cai na central de publicação (manual, 1-2 cliques)

## ⛔ Pendências que dependem de VOCÊ
1. **Credenciais da Meta** (pra ligar o auto-post) → seguir `docs/META_SETUP.md`, colar em `/admin/regioes`. É o único passo que falta pra ficar 100% automático.
2. **Domínio `cityjobs.com.br`** — pausado (erro no painel HostGator). Já criado no Railway; falta o DNS (HostGator zone editor ou Cloudflare). Registros prontos.
3. **Segurança** — você autorizou manter os tokens como estão (ok).

## 🟡 Ideias / próximos (quando quiser)
- **Token da Meta que não expira** (System User no Business Manager) — evita renovar a cada 60 dias. Posso configurar contigo.
- **Auto-aprovação mais fina** — hoje aprova automaticamente vagas com risco baixo; dá pra ajustar o limiar ou revisar 100% no começo.
- **IA (Claude) na copy/paleta** do agente de design — precisa `ANTHROPIC_API_KEY`.
- **Multi-região de verdade** — mapear cidade→região quando abrir Campinas/outras; UI de seleção de região no cadastro.
- **Dashboard de métricas** no QG (vagas/mês, receita, publicadas).
- **Lançar** — virar `COMING_SOON=false` quando quiser abrir ao público.

## Credenciais/infra (referência)
- Railway: projeto `rare-youthfulness`, serviço `cityjobs` + Postgres `Postgres-fAQf`
- Env já setadas: DATABASE_URL, ADMIN_SECRET, MERCADOPAGO_* (produção), APP_URL, CRON_SECRET
- Admin: `/admin` (senha = ADMIN_SECRET)
