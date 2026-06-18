#!/bin/sh
set -e

mkdir -p /app/uploads
chown -R appuser:appgroup /app/uploads

exec su-exec appuser "$@"
