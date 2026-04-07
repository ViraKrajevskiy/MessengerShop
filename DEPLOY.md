# 🚀 Деплой на сервер

## Требования к серверу
- Ubuntu 22.04 / Debian 12
- Docker + Docker Compose
- Открытые порты: **80** и **443**

---

## 1. Установить Docker (если ещё нет)

```bash
curl -fsSL https://get.docker.com | sh
```

---

## 2. Загрузить проект на сервер

```bash
# Вариант А — через git
git clone <ваш-репозиторий> /srv/messhop
cd /srv/messhop

# Вариант Б — через zip/scp
scp messhop.zip user@ваш-сервер:/srv/
unzip /srv/messhop.zip -d /srv/messhop
cd /srv/messhop
```

---

## 3. Создать и заполнить .env

```bash
cp .env.example .env
nano .env
```

Обязательно заполнить:

| Переменная | Пример |
|---|---|
| `SECRET_KEY` | любая длинная случайная строка |
| `ALLOWED_HOSTS` | `101-school.uz,www.101-school.uz` |
| `POSTGRES_PASSWORD` | любой сложный пароль |
| `MODERATOR_SECRET_KEY` | секретный ключ для входа модератора |
| `VITE_GOOGLE_CLIENT_ID` | ID из Google Cloud Console |

Email — необязательно, можно оставить пустым.

---

## 4. Запустить

```bash
docker compose up -d --build
```

Сайт будет доступен на **http://ваш-сервер**

---

## 5. HTTPS (SSL) — через Nginx на сервере

Если нужен HTTPS, установить Certbot на сервере (не в Docker):

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

---

## Полезные команды

```bash
# Посмотреть логи
docker compose logs -f

# Перезапустить после изменений
docker compose up -d --build

# Остановить
docker compose down

# Создать суперпользователя Django
docker compose exec backend python manage.py createsuperuser
```

---

## Что где находится

| Сервис | Описание |
|---|---|
| `frontend` | React-сайт + Nginx (порт 80) |
| `backend` | Django API (внутренний порт 8000) |
| `db` | PostgreSQL (данные сохраняются в volume) |

Медиафайлы (фото, документы) хранятся в Docker volume `media_data` — не удалять!
