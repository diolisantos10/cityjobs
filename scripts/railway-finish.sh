#!/usr/bin/env bash
#
# railway-finish.sh — connect the deployed app service to the healthy Postgres
# and finish the CityJobs deploy on Railway.
#
# Prereqs (one-time, done in the Railway dashboard because a *project* token
# cannot create services):
#   1. The app service exists (created via "+ Add → GitHub Repo → diolisantos10/cityjobs").
#   2. A healthy PostgreSQL service exists in the same project/environment.
#
# Usage:
#   RAILWAY_TOKEN=<project-token> ./scripts/railway-finish.sh [APP_SERVICE] [PG_SERVICE]
#
# If APP_SERVICE / PG_SERVICE are omitted, the script tries to auto-detect them.
set -euo pipefail

ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  echo "ERRO: defina RAILWAY_TOKEN (project token) no ambiente." >&2
  exit 1
fi

command -v railway >/dev/null || { echo "ERRO: instale a Railway CLI: npm i -g @railway/cli" >&2; exit 1; }

echo "== serviços no projeto =="
railway status 2>/dev/null | sed -n '/All resources/,/^$/p' || true

APP_SERVICE="${1:-}"
PG_SERVICE="${2:-}"

# Auto-detect: the Postgres service is the one whose name contains 'postgres'
# (case-insensitive); the app service is the other one that responds to a
# variables query and is not a database.
if [[ -z "$PG_SERVICE" ]]; then
  PG_SERVICE=$(railway status --json 2>/dev/null | node -e "
    let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      try{const s=JSON.parse(d);const svcs=(s.services?.edges||s.services||[]).map(e=>e.node||e);
        const pg=svcs.find(x=>/postgres/i.test(x.name)&&/online/i.test(JSON.stringify(x)))||svcs.find(x=>/postgres/i.test(x.name));
        if(pg)process.stdout.write(pg.name);}catch(e){}
    });" 2>/dev/null || true)
fi

if [[ -z "$APP_SERVICE" ]]; then
  APP_SERVICE="cityjobs"
fi

echo "APP_SERVICE=${APP_SERVICE}"
echo "PG_SERVICE=${PG_SERVICE:-<informe manualmente>}"

if [[ -z "$PG_SERVICE" ]]; then
  echo "ERRO: não detectei o serviço Postgres. Rode: $0 <APP_SERVICE> <PG_SERVICE>" >&2
  exit 1
fi

# Read the healthy Postgres public URL (IPv4 proxy — reliable at container start,
# avoids the private-networking startup race that crashes early migrations).
PG_URL=$(railway variables --service "$PG_SERVICE" --environment "$ENVIRONMENT" --json 2>/dev/null \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const v=JSON.parse(d);process.stdout.write(v.DATABASE_PUBLIC_URL||'');}catch(e){}});")

if [[ -z "$PG_URL" ]]; then
  echo "ERRO: não consegui ler DATABASE_PUBLIC_URL de '$PG_SERVICE'." >&2
  exit 1
fi
echo "== DATABASE_URL apontado para ${PG_SERVICE} (público) =="
railway variables --service "$APP_SERVICE" --environment "$ENVIRONMENT" --skip-deploys \
  --set "DATABASE_URL=${PG_URL}" >/dev/null

# Set ADMIN_SECRET only if it isn't set yet, so re-runs don't rotate it.
HAS_ADMIN=$(railway variables --service "$APP_SERVICE" --environment "$ENVIRONMENT" --json 2>/dev/null \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const v=JSON.parse(d);process.stdout.write(v.ADMIN_SECRET?'yes':'');}catch(e){}});")
if [[ -z "$HAS_ADMIN" ]]; then
  ADMIN_SECRET=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")
  railway variables --service "$APP_SERVICE" --environment "$ENVIRONMENT" --skip-deploys \
    --set "ADMIN_SECRET=${ADMIN_SECRET}" >/dev/null
  echo "== ADMIN_SECRET gerado: ${ADMIN_SECRET} (guarde — é a senha do /admin) =="
else
  echo "== ADMIN_SECRET já configurado (mantido) =="
fi

echo "== redeploy do app =="
railway redeploy --service "$APP_SERVICE" --environment "$ENVIRONMENT" --yes >/dev/null || true

echo ""
echo "Pronto. Acompanhe o build com: railway logs --service ${APP_SERVICE}"
echo "O start command roda migrate + seed automaticamente (railway.json)."
