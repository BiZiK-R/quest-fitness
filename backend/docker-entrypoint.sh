#!/bin/sh
set -e

if [ -f ./node_modules/.bin/prisma ] && [ -f prisma/schema.prisma ]; then
  npx prisma migrate deploy
fi

if [ ! -f dist/main.js ]; then
  echo "backend: dist/main.js not found — run npm run build" >&2
  exit 1
fi

exec node dist/main.js
