# Setup da auto-publicação no Instagram (Meta) — passo a passo

Objetivo: obter **2 credenciais** por região e colar em `/admin/regioes`:
1. **Instagram Business Account ID**
2. **Access Token** (longa duração)

Com elas, o sistema publica os Stories **automaticamente** no horário agendado,
pela **API oficial da Meta** (sem risco de ban).

---

## Pré-requisitos (uma vez)
1. **@cityjobs.sp** precisa ser conta **Profissional/Business** (não pessoal).
   - No app do Instagram: Configurações → Conta → *Mudar para conta profissional* → Empresa.
2. **Vincular a uma Página do Facebook.**
   - Instagram → Configurações → *Central de Contas* / *Página vinculada* → conecte/crie uma Página.

## Passo 1 — Criar o app na Meta
1. Acesse **https://developers.facebook.com/apps** → **Criar app**.
2. Tipo: **Empresa (Business)**.
3. No painel do app, adicione o produto **Instagram** (Graph API) e **Facebook Login** (ou "Login do Facebook para Empresas").

## Passo 2 — Permissões necessárias
No **Graph API Explorer** (developers.facebook.com/tools/explorer), selecione seu app e peça as permissões:
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

Gere o token (**Generate Access Token**) e autorize com a conta que administra a Página/Instagram.

## Passo 3 — Pegar o Instagram Business Account ID
Com o token, no Graph API Explorer rode:
```
GET /me/accounts
```
→ pegue o `id` da sua **Página**. Depois:
```
GET /{PAGE_ID}?fields=instagram_business_account
```
→ o `instagram_business_account.id` é o seu **Instagram Business Account ID**.

## Passo 4 — Token de longa duração (60 dias)
O token do Explorer dura ~1h. Troque por um de 60 dias:
```
GET https://graph.facebook.com/v20.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={TOKEN_CURTO}
```
→ use o `access_token` retornado. (Para token que não expira, use um **System User** no Business Manager — recomendado para produção; posso te ajudar depois.)

## Passo 5 — Colar no CityJobs
1. Abra **/admin/regioes** no CityJobs.
2. Na região **São Paulo e Grande São Paulo**, cole:
   - **Instagram Business Account ID** → campo *Instagram Business Account ID*
   - **Access Token** → campo *Access Token*
3. Salve. O sistema **testa a conexão na hora** e mostra `@usuario` se deu certo.

Pronto: a partir daí, vagas aprovadas publicam sozinhas no horário agendado. ✅

---

### Observações
- **Limite:** ~25 publicações por 24h por conta (folgado para o começo).
- **Imagem:** o sistema já entrega a arte em **JPEG 1080×1920** (o que a Meta exige) via `/api/publish-image/[id]`.
- **App Review:** como você publica **na sua própria conta** (@cityjobs.sp), dá para operar em modo de desenvolvimento / com você como administrador do app, sem revisão completa da Meta.
- **Multi-região:** cada nova região (ex.: Campinas) terá seu próprio Instagram e suas próprias credenciais, coladas na mesma tela `/admin/regioes`.
