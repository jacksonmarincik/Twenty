#!/bin/sh
set -e

# Railway (and similar platforms) set PORT; Twenty listens on NODE_PORT by default.
if [ -n "${PORT}" ]; then
  export NODE_PORT="${PORT}"
fi

exec /app/entrypoint.sh "$@"
