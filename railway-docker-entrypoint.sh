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

exec /app/entrypoint.sh "$@"
