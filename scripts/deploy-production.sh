#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${HOME}/GSPE-Deployment"
test -f "${DEPLOY_DIR}/.env"

echo "📂 Sinkronisasi file konfigurasi ke ${DEPLOY_DIR}..."
mkdir -p "${DEPLOY_DIR}/nginx" "${DEPLOY_DIR}/backups"
install -m 0644 docker-compose.yml "${DEPLOY_DIR}/docker-compose.yml"
install -m 0644 nginx/default.conf "${DEPLOY_DIR}/nginx/default.conf"

cd "${DEPLOY_DIR}"

# 0. Migrasi Legacy Standalone gspe-app jika masih ada
if docker ps -a --format '{{.Names}}' | grep -q "^gspe-app$"; then
  echo "⚠️ Menemukan container legacy standalone 'gspe-app'. Menghentikan container untuk migrasi ke Nginx Blue/Green..."
  docker stop gspe-app || true
  docker rm gspe-app || true
fi

# 1. Pastikan file upstream.inc ada
if [ ! -f "nginx/upstream.inc" ]; then
  echo 'set $upstream_app app_blue;' > nginx/upstream.inc
fi

# 2. Login GHCR jika GH_TOKEN tersedia
if [ -n "${GH_TOKEN:-}" ]; then
  printf '%s' "${GH_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR:-alfimaulanaa}" --password-stdin
fi

# 3. Deteksi Active Container (Blue vs Green)
ACTIVE="none"
TARGET="blue"

if grep -q "app_green" nginx/upstream.inc 2>/dev/null && docker ps --format '{{.Names}}' | grep -q "^gspe-app-green$"; then
  ACTIVE="green"
  TARGET="blue"
elif grep -q "app_blue" nginx/upstream.inc 2>/dev/null && docker ps --format '{{.Names}}' | grep -q "^gspe-app-blue$"; then
  ACTIVE="blue"
  TARGET="green"
fi

echo "=================================================="
echo "🎯 Mode Deployment: Zero-Downtime Blue/Green"
echo "📌 Active Container : $ACTIVE"
echo "🚀 Target Container : $TARGET (New Version: ${APP_IMAGE})"
echo "=================================================="

# 4. Backup Database Sebelum Migrasi (Rollback Safety)
if docker ps --format '{{.Names}}' | grep -q "^gspe-db$"; then
  BACKUP_FILE="${DEPLOY_DIR}/backups/db-backup-$(date +%Y%m%d_%H%M%S).sql"
  echo "💾 Melakukan backup database otomatis ke ${BACKUP_FILE}..."
  docker exec gspe-db pg_dump -U gspe_admin gspe_deployment > "${BACKUP_FILE}" 2>/dev/null || true
  # Hapus backup lebih dari 7 hari agar disk tetap hemat
  find "${DEPLOY_DIR}/backups" -name "db-backup-*.sql" -mtime +7 -delete 2>/dev/null || true
fi

# 5. Pull Image Baru untuk Target Container
echo "📥 Menarik Docker Image baru (${APP_IMAGE})..."
APP_IMAGE="${APP_IMAGE}" APP_VERSION="${APP_VERSION:-v1.0.0}" docker compose pull "app_${TARGET}"

# 6. Jalankan Target Container Baru
echo "🚀 Menyalakan target container baru (gspe-app-${TARGET}) dengan versi ${APP_VERSION:-v1.0.0}..."
APP_IMAGE="${APP_IMAGE}" APP_VERSION="${APP_VERSION:-v1.0.0}" docker compose up -d "app_${TARGET}"

# 7. Internal Health Check pada Container Baru (Fail-safe Rollback)
echo "🩺 Melakukan health check internal pada gspe-app-${TARGET}..."
HEALTHY=0
for attempt in $(seq 1 30); do
  if docker exec "gspe-app-${TARGET}" wget -q -O /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
    HEALTHY=1
    echo "✅ Container baru gspe-app-${TARGET} SEHAT (Attempt ${attempt}/30)!"
    break
  fi
  sleep 2
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "❌ Container baru gspe-app-${TARGET} GAGAL health check!"
  echo "📋 Log error container baru:"
  docker compose logs "app_${TARGET}"
  echo "🔄 MEMULAI AUTOMATED ROLLBACK..."
  docker compose stop "app_${TARGET}" || true
  docker compose rm -f "app_${TARGET}" || true
  if [ "$ACTIVE" != "none" ]; then
    echo "🛡️ Container aktif sebelumnya (gspe-app-${ACTIVE}) TETAP MELAYANI TRAFFIC tanpa downtime!"
  fi
  exit 1
fi

# 8. Eksekusi Migrasi Database Skema pada Container Baru
echo "🔄 Menjalankan migrasi database (npx prisma db push)..."
docker exec "gspe-app-${TARGET}" npx prisma db push

# 9. Pastikan Nginx Aktif
echo "🌐 Memastikan reverse proxy Nginx aktif..."
docker compose up -d nginx

# 10. Switch Nginx Upstream Traffic ke Container Baru (Zero-Downtime Reload)
echo "⚡ Mengalihkan lalu lintas Nginx ke app_${TARGET}..."
echo "set \$upstream_app app_${TARGET};" > nginx/upstream.inc
docker exec gspe-nginx nginx -s reload

# 11. External Smoke Verification via Nginx (Port 3000)
echo "🔍 Verifikasi respons eksternal melalui Nginx di http://127.0.0.1:3000/..."
EXTERNAL_OK=0
for attempt in $(seq 1 15); do
  if curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null 2>&1; then
    EXTERNAL_OK=1
    break
  fi
  sleep 2
done

if [ "$EXTERNAL_OK" -ne 1 ]; then
  echo "❌ Verifikasi eksternal gagal! Mengembalikan Nginx ke container lama (${ACTIVE})..."
  if [ "$ACTIVE" != "none" ]; then
    echo "set \$upstream_app app_${ACTIVE};" > nginx/upstream.inc
    docker exec gspe-nginx nginx -s reload
  fi
  docker compose stop "app_${TARGET}" || true
  docker compose rm -f "app_${TARGET}" || true
  exit 1
fi

echo "🎉 Switch traffic ke app_${TARGET} BERHASIL dengan ZERO DOWNTIME!"

# 12. Graceful Shutdown Container Lama
if [ "$ACTIVE" != "none" ] && [ "$ACTIVE" != "$TARGET" ]; then
  echo "🧹 Menghentikan container versi lama (gspe-app-${ACTIVE})..."
  docker compose stop "app_${ACTIVE}" || true
  docker compose rm -f "app_${ACTIVE}" || true
fi

# 13. Disk Cleanup
echo "🧹 Membersihkan cache dan image docker usang (>72h)..."
docker image prune -af --filter "until=72h" || true

echo "=================================================="
echo "✅ DEPLOYMENT SELESAI DENGAN SUKSES & ZERO DOWNTIME"
echo "🌐 Port Live: http://192.168.2.42:3000"
echo "=================================================="
