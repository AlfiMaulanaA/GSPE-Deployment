#!/usr/bin/env bash
# ==============================================================================
# Telegram CLI Notifier for GSPE Enterprise CI/CD
# ==============================================================================
set -euo pipefail

# Default Configuration (Bisa di-override oleh env var atau argumen CLI)
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8721253097:AAHXgZ-NPdt27VZVlOJhOHcEIh2niR5cQDY}"
CHAT_ID="${TELEGRAM_CHAT_ID:-8858363974}"
PARSE_MODE="HTML"
DISABLE_PREVIEW="true"
SILENT="false"

TITLE=""
MESSAGE=""
STATUS=""

print_usage() {
  cat <<'EOF'
GSPE Telegram CLI Notifier
Penggunaan:
  ./scripts/telegram-cli.sh [options] [message]

Pilihan:
  -m, --message TEXT      Isi pesan teks (atau masukkan langsung sebagai argumen pertama)
  -t, --title TITLE       Judul / Header pesan (format bold profesional)
  -s, --status STATUS     Label status: SUCCESS, FAILED, INFO, WARNING
  -c, --chat-id ID        ID Chat Telegram tujuan (default: 8858363974)
  -b, --token TOKEN       Token Bot Telegram (default: dari environment / konfigurasi)
  --silent                Kirim pesan tanpa membunyikan notifikasi suara
  -h, --help              Tampilkan panduan ini

Contoh:
  ./scripts/telegram-cli.sh "Halo, sistem server siap digunakan."
  ./scripts/telegram-cli.sh -t "SYSTEM ALERT" -m "Maintenance server selesai." -s SUCCESS
  ./scripts/telegram-cli.sh -t "DATABASE MIGRATION" -m "Prisma schema updated."
EOF
}

# Parse CLI Arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message|--text)
      MESSAGE="$2"
      shift 2
      ;;
    -t|--title)
      TITLE="$2"
      shift 2
      ;;
    -s|--status)
      STATUS="$2"
      shift 2
      ;;
    -c|--chat-id)
      CHAT_ID="$2"
      shift 2
      ;;
    -b|--token)
      BOT_TOKEN="$2"
      shift 2
      ;;
    --silent)
      SILENT="true"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    -*)
      echo "Error: Opsi tidak dikenal: $1" >&2
      print_usage
      exit 1
      ;;
    *)
      if [ -z "$MESSAGE" ]; then
        MESSAGE="$1"
      else
        MESSAGE="${MESSAGE} $1"
      fi
      shift
      ;;
  esac
done

if [ -z "$MESSAGE" ] && [ -z "$TITLE" ]; then
  echo "Error: Pesan atau Judul tidak boleh kosong." >&2
  echo "" >&2
  print_usage
  exit 1
fi

if [ -z "$BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN belum diset." >&2
  exit 1
fi

if [ -z "$CHAT_ID" ]; then
  echo "Error: TELEGRAM_CHAT_ID belum diset." >&2
  exit 1
fi

# Format Payload Text Profesional
FINAL_TEXT=""
DIVIDER="────────────────────────────"

if [ -n "$TITLE" ]; then
  FINAL_TEXT="<b>${TITLE}</b>"
fi

if [ -n "$STATUS" ]; then
  STATUS_UPPER=$(echo "$STATUS" | tr '[:lower:]' '[:upper:]')
  if [ -n "$FINAL_TEXT" ]; then
    FINAL_TEXT="${FINAL_TEXT} | [${STATUS_UPPER}]"
  else
    FINAL_TEXT="<b>[${STATUS_UPPER}]</b>"
  fi
fi

if [ -n "$FINAL_TEXT" ]; then
  FINAL_TEXT="${FINAL_TEXT}
${DIVIDER}
${MESSAGE}
${DIVIDER}
<i>Waktu: $(date -u +'%Y-%m-%d %H:%M:%S UTC')</i>"
else
  FINAL_TEXT="${MESSAGE}"
fi

# Kirim via Telegram Bot API
API_URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

RESPONSE=$(curl -s -X POST "${API_URL}" \
  -d "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${FINAL_TEXT}" \
  -d "parse_mode=${PARSE_MODE}" \
  -d "disable_web_page_preview=${DISABLE_PREVIEW}" \
  -d "disable_notification=${SILENT}")

# Verifikasi Respon
OK_STATUS=$(echo "$RESPONSE" | grep -o '"ok":true' || true)

if [ "$OK_STATUS" = '"ok":true' ]; then
  MSG_ID=$(echo "$RESPONSE" | grep -o '"message_id":[0-9]*' | cut -d: -f2 || echo "N/A")
  echo "✅ Pesan Telegram berhasil terkirim."
  echo "   Tujuan Chat ID : ${CHAT_ID}"
  echo "   Message ID     : ${MSG_ID}"
  exit 0
else
  echo "❌ Gagal mengirim pesan ke Telegram." >&2
  echo "   Respon API: ${RESPONSE}" >&2
  exit 1
fi
