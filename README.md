# Quest Fitness

Каркас платформы (Story 1.1): Docker Compose с сервисами `frontend`, `backend`, `postgres`.

## Требования

- Docker и Docker Compose v2
- Node.js 22 LTS (для локальных тестов каркаса в корне репозитория)

## Переменные окружения

Скопируйте шаблон и заполните секреты локально (файл `.env` не коммитится):

```bash
cp .env.example .env
```

Обязательно задайте:

| Переменная | Назначение |
|------------|------------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Учётные данные PostgreSQL |
| `DATABASE_URL` | Строка подключения Prisma (хост `postgres` внутри Compose) |
| `SESSION_SECRET` | Секрет сессий backend |
| `GYM_TIMEZONE` | Часовой пояс зала (по умолчанию в примере: `Europe/Moscow`) |
| `SEED_ADMIN_LOGIN`, `SEED_ADMIN_PASSWORD` | Учётные данные для seed администратора |

**В репозитории нет дефолтного пароля администратора** — задайте `SEED_ADMIN_PASSWORD` только в своём `.env`.

## Запуск стека

Из корня репозитория:

```bash
docker compose up -d --build
```

Публичный вход — контейнер **frontend** (порт **5173** на хосте → nginx внутри на 80). Контейнер **backend** наружу не публикуется; API доступен same-site через прокси `/api` на frontend.

Остановка:

```bash
docker compose down
```

С данными Postgres (volume сохраняется):

```bash
docker compose down
```

Полное удаление volume БД:

```bash
docker compose down -v
```

## Проверка health

После старта стека проверьте:

```bash
curl -sS http://localhost:5173/api/health
```

Ожидается HTTP **200** и JSON со статусом `ok`.

## Seed администратора

После `docker compose up` миграции применяются автоматически. Seed **не** запускается сам — только когда заданы `SEED_ADMIN_*`:

```bash
docker compose exec backend npx prisma db seed
```

Либо локально из `backend/` при доступной БД: `npm run prisma:seed`.

Без `SEED_ADMIN_LOGIN` / `SEED_ADMIN_PASSWORD` seed пропускает создание пользователя и **не** подставляет пароль по умолчанию.

## Локальная разработка (без полного Compose UI)

```bash
# БД
docker compose up -d postgres

# Backend (из backend/, DATABASE_URL на localhost)
cd backend && npm install && npx prisma migrate deploy && npm run start:dev

# Frontend (из frontend/)
cd frontend && npm install && npm run dev
```

Vite проксирует `/api` → `http://localhost:3000`. Swagger UI: `http://localhost:3000/api/docs`.

## Тесты каркаса Compose

```bash
npm install
npm run test:compose
```

## OpenAPI и codegen (Story 1.1)

Канонический контракт: `backend/openapi/openapi.yaml` (OpenAPI 3.0.x).

1. После изменения DTO/контроллеров backend:

```bash
cd backend
npm run openapi:export
```

Скрипт также запускается автоматически перед `npm run build` в backend (`prebuild`).

2. Генерация типов и клиента на frontend (только `frontend/src/shared/api`):

```bash
cd frontend
npm run codegen
```

Перед `npm run build` frontend выполняет `codegen`; без YAML сборка падает.

## Структура

- `frontend/` — статика и nginx с прокси `/api` → `backend:3000`
- `backend/` — Nest API (дорабатывается отдельными задачами)
- `backend/openapi/openapi.yaml` — экспортированный контракт API
- `docker-compose.yml` — три сервиса: `frontend`, `backend`, `postgres:16`
