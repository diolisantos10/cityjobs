# Deploy — CityJobs no Railway

Estado atual e o **único passo manual** que falta para o app ficar no ar.

## TL;DR

- ✅ Código completo, testado ponta a ponta contra Postgres real (build + 21 testes unitários + 3 de integração + e2e de browser passando).
- ✅ Banco saudável existe no Railway: serviço **`Postgres-fAQf`** (● Online).
- ✅ `main` do GitHub populado (auto-deploy pronto).
- ⛔ **Falta 1 passo manual seu:** recriar o **serviço do app** (foi deletado). Um *project token* não cria serviços (`Unauthorized`), então isso só dá no dashboard.

## O passo manual (≈ 1 min)

No projeto `rare-youthfulness` (Railway):

1. **+ Add** → **GitHub Repo**
2. Seleciona **`diolisantos10/cityjobs`**
3. Branch: **`main`**
4. O Railway cria o serviço e começa a buildar. **O primeiro deploy provavelmente crasha** (ainda sem variáveis) — tudo bem.

## Finalização automática (o resto)

Com o serviço criado, rode o script de finalização (ou peça pro Claude rodar
com o project token):

```bash
RAILWAY_TOKEN=<project-token> ./scripts/railway-finish.sh
```

Ele:
1. Detecta o Postgres saudável e lê a `DATABASE_PUBLIC_URL`.
2. Seta `DATABASE_URL` no app apontando pra ela.
3. Gera e seta `ADMIN_SECRET` (se ainda não existir).
4. Dispara o redeploy → o start command (`railway.json`) roda `migrate` + `seed` + `start`.

Se a auto-detecção falhar, passe os nomes explicitamente:
```bash
RAILWAY_TOKEN=<token> ./scripts/railway-finish.sh cityjobs Postgres-fAQf
```

Depois, valide:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<seu-dominio>.up.railway.app/
```

## Por que usamos a URL pública do Postgres (e não a interna)

A rede privada do Railway (`*.railway.internal`, IPv6) leva alguns segundos para
inicializar no start do container. O `prisma migrate deploy` roda **imediatamente**
no start, antes da rede interna estar pronta, e falhava com `P1001: Can't reach
database server`, derrubando o container num loop. A **URL pública** (proxy IPv4)
é alcançável de imediato e elimina essa corrida. Para um MVP o custo de egress é
irrelevante; dá para migrar para a rede interna depois (ex.: rodar migrations num
release step separado).

## Limpeza recomendada

- Deletar o serviço **`Postgres`** antigo (crashado, ⚠️) — não é mais usado.
- Deletar o volume solto **`postgres-volume-w93M`** se estiver `detached`.
- **Revogar** o(s) project token(s) antigos após terminar (Account/Project → Tokens).

## Histórico do diagnóstico (para referência)

- O serviço do app (`cityjobs`) e o primeiro Postgres estavam **crashados**.
- Causa do crash do app: faltavam `DATABASE_URL` e `ADMIN_SECRET`.
- Causa do crash do banco: o primeiro Postgres ficou irrecuperável (crash-loop no
  volume); foi substituído por `Postgres-fAQf` (Online).
- O serviço do app foi deletado durante o troubleshooting e precisa ser recriado
  (passo manual acima).
