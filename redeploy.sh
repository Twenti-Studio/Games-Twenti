#!/usr/bin/env bash
# Redeploy Games-Twenti — game platform (Node backend + frontend)
# Usage: ./redeploy.sh
set -euo pipefail
cd "$(dirname "$0")"

# Compose references env_file: .env.production — make sure it exists.
if [ ! -f .env.production ]; then
  echo "==> [games] .env.production missing — creating from .env"
  cp .env .env.production
fi

echo "==> [games] Rebuilding & restarting containers..."
docker compose up -d --build

# Attach the app to the shared reverse-proxy edge network so games.twenti.studio
# routes here. Attached by CONTAINER NAME only (no generic 'app'/'db' alias) to
# avoid DNS collisions with other stacks on that network. Then refresh the proxy
# so it re-resolves our (possibly new) container IP.
echo "==> [games] Wiring into public reverse proxy (edge network)..."
docker network connect sim-rumah-maggot_maggot gametwenti-app 2>/dev/null && echo "   connected gametwenti-app" || echo "   gametwenti-app already attached"
docker exec sim-rumah-maggot-web-1 nginx -s reload 2>/dev/null && echo "   proxy reloaded" || echo "   (proxy reload skipped)"

echo "==> [games] Waiting for health..."
sleep 5
docker compose ps
echo "==> [games] Health check:"
curl -fsS -m 5 -o /dev/null -w "  app :3001/health -> HTTP %{http_code}\n" http://127.0.0.1:3001/health || echo "  (not ready yet — check: docker compose logs -f app)"
echo "==> [games] Done. App: http://127.0.0.1:3001  |  DB: 127.0.0.1:5432 (localhost only)"
