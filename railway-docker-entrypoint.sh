#!/bin/sh
set -e

# Railway (and similar platforms) set PORT; Twenty listens on NODE_PORT by default.
if [ -n "${PORT}" ]; then
  export NODE_PORT="${PORT}"
fi

# Railway Postgres usually exposes DATABASE_URL; Twenty's entrypoint expects PG_DATABASE_URL.
# If PG_DATABASE_URL is empty, psql falls back to a local socket and errors.
if [ -z "${PG_DATABASE_URL}" ] && [ -n "${DATABASE_URL}" ]; then
  export PG_DATABASE_URL="${DATABASE_URL}"
fi

if [ -z "${PG_DATABASE_URL}" ]; then
  echo 'error: PG_DATABASE_URL is not set (Twenty needs a PostgreSQL URL).' >&2
  echo 'In Railway: link Postgres to this service and set PG_DATABASE_URL to your DATABASE_URL,' >&2
  echo 'or rely on DATABASE_URL — this script copies DATABASE_URL → PG_DATABASE_URL when set.' >&2
  exit 1
fi

# Twenty validates SERVER_URL with require_protocol: true — hostnames without https:// fail.
if [ -z "${SERVER_URL}" ] && [ -n "${RAILWAY_PUBLIC_DOMAIN}" ]; then
  export SERVER_URL="https://${RAILWAY_PUBLIC_DOMAIN}"
fi

if [ -n "${SERVER_URL}" ]; then
  trimmed_server_url=$(printf '%s' "${SERVER_URL}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  case "${trimmed_server_url}" in
    *://*) export SERVER_URL="${trimmed_server_url}" ;;
    *) export SERVER_URL="https://${trimmed_server_url}" ;;
  esac
fi

# Redis is a separate in-memory service (not your public website). Twenty needs a URL that
# starts with redis:// or rediss:// from Railway's Redis resource — not your *.up.railway.app web address.
if [ -z "${REDIS_URL}" ] && [ -n "${REDIS_PRIVATE_URL}" ]; then
  export REDIS_URL="${REDIS_PRIVATE_URL}"
fi

if [ -z "${REDIS_URL}" ]; then
  echo 'error: REDIS_URL is not set.' >&2
  echo 'In Railway: add a Redis service to this project. On your Twenty service → Variables →' >&2
  echo 'New variable → Variable Reference → choose Redis → REDIS_URL (starts with redis://).' >&2
  exit 1
fi

trimmed_redis_url=$(printf '%s' "${REDIS_URL}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
export REDIS_URL="${trimmed_redis_url}"
case "${REDIS_URL}" in
  redis://*|rediss://*) ;;
  *)
    echo 'error: REDIS_URL must be a Redis connection string (starts with redis:// or rediss://).' >&2
    echo "You currently have something that looks like a website hostname, not Redis. Remove that value." >&2
    echo 'Add a Redis database in Railway, then set REDIS_URL to a Variable Reference from that Redis service.' >&2
    exit 1
    ;;
esac

# Stock /app/entrypoint.sh only runs database:init:prod when the "core" schema is missing. If a
# deploy was killed mid-migration (often healthcheck timeout), "core" exists but tables do not, so
# init is skipped and the DB stays broken. Run init whenever the marker table is absent.
core_app_token_exists=$(
  psql "${PG_DATABASE_URL}" -tAc \
    "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'core' AND c.relkind = 'r' AND c.relname = 'appToken')" \
    2>/dev/null | tr -d '[:space:]' || true
)
if [ -z "${core_app_token_exists}" ]; then
  core_app_token_exists=f
fi
if [ "${core_app_token_exists}" != 't' ]; then
  echo 'Railway: database not fully migrated; running database:init:prod...'
  cd /app/packages/twenty-server && yarn database:init:prod
fi

exec /app/entrypoint.sh "$@"
