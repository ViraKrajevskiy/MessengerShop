# ── Django Backend ─────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Системные зависимости (Pillow, psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn psycopg2-binary

# Код
COPY . .

# Собираем статику. collectstatic выполняется на этапе сборки образа, где нет
# .env и переменных окружения. Запускаем его в dev-режиме (DEBUG=True), чтобы
# settings не требовали обязательных секретов на билде. В рантайме DEBUG=False
# и реальные SECRET_KEY/MODERATOR_SECRET_KEY приходят из .env (fail-closed).
RUN DEBUG=True python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "Config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
