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

exec /app/entrypoint.sh "$@"
