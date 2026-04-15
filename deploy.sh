#!/bin/bash
# =============================================================
#  deploy.sh — деплой MessengerShop на хостинге Beget
#  Использование: bash ~/MessengerShop/deploy.sh
# =============================================================

DOMAIN="101school.uz"
PUBLIC_HTML="$HOME/domains/$DOMAIN/public_html"
PROJECT_DIR="$HOME/MessengerShop"
FRONTEND_DIR="$PROJECT_DIR/my-frontend"
DIST_ZIP="$FRONTEND_DIR/dist.zip"

echo "======================================"
echo " Деплой → $DOMAIN"
echo "======================================"

# ── 1. Git pull (бэкенд + исходники) ──────────────────────────
echo ""
echo "▶ [1/3] Обновляем код из Git..."
cd "$PROJECT_DIR" || { echo "ОШИБКА: папка $PROJECT_DIR не найдена"; exit 1; }
git pull origin master

# ── 2. Применяем миграции Django ──────────────────────────────
echo ""
echo "▶ [2/3] Применяем миграции Django..."
source "$HOME/virtualenv/MessengerShop/bin/activate" 2>/dev/null || \
source "$HOME/virtualenv/bin/activate" 2>/dev/null || \
echo "  (virtualenv не найден, пропускаем)"

python "$PROJECT_DIR/manage.py" migrate --noinput 2>/dev/null && \
  echo "  Миграции применены" || echo "  (миграции пропущены)"

# ── 3. Деплой фронтенда (dist.zip) ────────────────────────────
echo ""
echo "▶ [3/3] Деплой фронтенда..."

if [ ! -f "$DIST_ZIP" ]; then
  echo "  ВНИМАНИЕ: $DIST_ZIP не найден — пропускаем фронтенд"
  echo "  Собери локально: npm run build → упакуй dist/ → залей dist.zip"
else
  rm -rf "$PUBLIC_HTML"/*
  unzip -o "$DIST_ZIP" -d "$PUBLIC_HTML/"

  # Если unzip создал папку dist/ внутри — перемещаем содержимое наверх
  if [ -d "$PUBLIC_HTML/dist" ]; then
    mv "$PUBLIC_HTML/dist"/* "$PUBLIC_HTML/"
    rm -rf "$PUBLIC_HTML/dist"
  fi

  echo "  Фронтенд задеплоен → $PUBLIC_HTML"
fi

echo ""
echo "======================================"
echo " ГОТОВО: https://$DOMAIN"
echo "======================================"
