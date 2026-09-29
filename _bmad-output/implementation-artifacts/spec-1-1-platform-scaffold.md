---
title: 'Story 1.1 — Каркас платформы (Docker + Nest/Prisma/React + OpenAPI)'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Репозиторий greenfield без `frontend/` / `backend/` / Compose — нельзя наращивать домен поверх одного контракта и одного стека.

**Approach:** Поднять Structural Seed: Compose (`frontend`, `backend`, `postgres:16`), Nest+Prisma+health, React/Vite с proxy `/api` и FSD-скелетом, канонический OpenAPI → FE codegen; TDD red→green на каждый кусок.

## Boundaries & Constraints

**Always:**
- Побеждает ARCHITECTURE-SPINE при конфликте артефактов.
- Корни приложения: только `frontend/` и `backend/` (AD-1). Compose и README — в корне репо рядом с `docs/` / `_bmad-output/`.
- Стек (пины): NestJS 12.1.1, Prisma 7.10.0, PostgreSQL 16, React 19.3.0, Vite 8.3.1, Node 22 LTS (≥22.12), TypeScript 5.9.x, Vitest 3.x, openapi-typescript 7.13.0, openapi-fetch 0.17.0, OpenAPI 3.0.x.
- Канон контракта: `backend/openapi/openapi.yaml` (коммитится) → codegen только в `frontend/src/shared/api`; сборка FE падает без YAML / при битом codegen (AD-2).
- FE→API: Vite proxy `/api` same-site; без CORS credentials (AD-13/AD-5).
- Seed готов к `SEED_ADMIN_LOGIN` + `SEED_ADMIN_PASSWORD` из env; дефолтного пароля в репо нет.
- TDD (AD-18): сначала failing Vitest, затем минимальный код до green.
- Postgres доступен только через Prisma; схема — только миграциями.

**Ask First:**
- Любая деталь вне AC Story 1.1 + spine (путь health HTTP, если неясен — зафиксировать `/api/health` и задокументировать).
- Выбор package manager, если не указан в spine (по умолчанию npm в каждом корне `frontend`/`backend`).

**Never:**
- Story 1.2+ (cookie-сессии, CSRF, экраны входа, пул, инвайты, домен зала).
- Этап 2, offline-очередь подходов, бизнес-CRUD клиентов.
- Второй ручной OpenAPI YAML / обход codegen.
- Redis/Kafka/websockets/очереди; CORS credentials; дефолтный пароль админа в коде/README.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Compose up | чистый клон + env из README | контейнеры `frontend`, `backend`, `postgres:16` healthy | README описывает необходимые env |
| Health smoke | backend + migrate | GET health → 200; Vitest smoke green | падение теста без endpoint |
| Seed без пароля | нет `SEED_ADMIN_PASSWORD` | seed не подставляет дефолт | явная ошибка/пропуск без секрета в репо |
| FE codegen | есть `backend/openapi/openapi.yaml` | клиент в `frontend/src/shared/api` | prebuild/build падает без YAML или при битом codegen |
| Vite proxy | FE запрос `/api/...` | прокси на backend, same-site | CORS credentials не настраиваются |

</frozen-after-approval>

## Code Map

Greenfield — создавать с нуля (сейчас нет `frontend/`, `backend/`, compose, package.json):

- `docker-compose.yml` — сервисы `frontend`, `backend`, `postgres:16` + volume (AD-13)
- `README.md` — compose-команды, env (`SEED_ADMIN_*`, `DATABASE_URL`, `SESSION_SECRET`, `GYM_TIMEZONE`), проверка health
- `backend/package.json` — Nest 12.1.1, Prisma 7.10.0, Vitest 3.x, `@nestjs/swagger` 11.x
- `backend/prisma/schema.prisma` + `migrations/` + `seed.ts` — минимальная схема + seed без дефолтного пароля
- `backend/src/main.ts`, `app.module.ts` — bootstrap Nest
- `backend/src/modules/` — каркас; health (модуль/контроллер) для smoke
- `backend/src/scripts/export-openapi.ts` — пишет `backend/openapi/openapi.yaml`
- `backend/openapi/openapi.yaml` — канон OpenAPI 3.0.x
- `frontend/package.json` — React 19.3.0, Vite 8.3.1, openapi-typescript 7.13.0, openapi-fetch 0.17.0, Vitest 3.x
- `frontend/vite.config.*` — proxy `/api` → backend
- `frontend/src/{app,pages,widgets,features,entities,shared}/` — FSD скелет; codegen только в `shared/api`
- `_bmad-output/implementation-artifacts/epic-1-context.md` — контекст эпика (read-only для имплементации)

## Tasks & Acceptance

**Execution:**
- [x] TDD-дисциплина на каждый кусок: red Vitest → green → refactor
- [x] `docker-compose.yml` + Dockerfiles — сервисы `frontend`, `backend`, `postgres:16`
- [x] `README.md` — поднять стек, env, health
- [x] `backend/` — Nest 12.1.1 + Prisma 7.10.0 + migrate + seed (`SEED_ADMIN_*`) + health + Vitest smoke
- [x] `frontend/` — React/Vite + proxy `/api` + FSD-заготовка `app`/`shared` (+ пустые слои)
- [x] `backend/openapi/openapi.yaml` + FE codegen в `frontend/src/shared/api` + fail-build без YAML/битого codegen

**Acceptance Criteria:**
- Given чистый клон, when `docker compose up` по README, then контейнеры `frontend`, `backend`, `postgres:16`; корни приложения — `frontend/` и `backend/`; README описывает compose, env и health
- Given Nest+Prisma+Node 22, when migrate + seed, then БД только через Prisma; seed читает `SEED_ADMIN_*` без дефолтного пароля в репо; схема — миграциями
- Given пайплайн контракта, when export OpenAPI + FE codegen, then канон `backend/openapi/openapi.yaml` (3.0.x); клиент только в `frontend/src/shared/api`; сборка FE падает без YAML / при битом codegen
- Given локальный Vite, when FE → API, then proxy `/api` same-site; CORS credentials не настраивается
- Given TDD, when каркас готов, then Vitest в BE (заготовка FE); smoke health green

## Spec Change Log

## Verification

**Commands:**
- `docker compose up -d --build` — три сервиса up; health 200
- `cd backend && npm test` (или эквивалент) — Vitest health smoke green
- `cd frontend && npm run build` — codegen + сборка green при наличии YAML
- Удалить/переименовать YAML временно → `npm run build` FE падает

**Manual checks (if no CLI):**
- README открывается и команды копируются без правок кода

## Suggested Review Order

**Compose и поставка**

- Три сервиса и FE build context с каноническим YAML
  [`docker-compose.yml:1`](../../docker-compose.yml#L1)

- FE-образ копирует `backend/openapi/openapi.yaml` для codegen
  [`Dockerfile:1`](../../frontend/Dockerfile#L1)

- Entrypoint: migrate deploy → Nest
  [`docker-entrypoint.sh:1`](../../backend/docker-entrypoint.sh#L1)

**Backend каркас**

- Глобальный prefix `api` + health
  [`main.ts:1`](../../backend/src/main.ts#L1)

- Smoke endpoint `{ status: 'ok' }`
  [`health.controller.ts:1`](../../backend/src/modules/health/health.controller.ts#L1)

- Prisma 7 + adapter-pg
  [`prisma.service.ts:1`](../../backend/src/shared/prisma/prisma.service.ts#L1)

- Seed без дефолтного пароля, argon2id, lowercase login
  [`seed-credentials.ts:1`](../../backend/prisma/seed-credentials.ts#L1)

**OpenAPI → codegen**

- Канон OpenAPI 3.0.x
  [`openapi.yaml:1`](../../backend/openapi/openapi.yaml#L1)

- Export из Nest
  [`export-openapi.ts:1`](../../backend/src/scripts/export-openapi.ts#L1)

- FE prebuild gate на YAML
  [`codegen.mjs:1`](../../frontend/scripts/codegen.mjs#L1)

- Клиент только в `shared/api`
  [`client.ts:1`](../../frontend/src/shared/api/client.ts#L1)

**Frontend proxy / FSD**

- Vite same-site `/api` → backend
  [`vite.config.ts:1`](../../frontend/vite.config.ts#L1)

- Nginx proxy в Compose
  [`nginx.conf:1`](../../frontend/nginx.conf#L1)

**Тесты и README**

- Health Vitest smoke
  [`health.controller.spec.ts:1`](../../backend/src/modules/health/health.controller.spec.ts#L1)

- Codegen gate (в т.ч. spawn без YAML)
  [`codegen.gate.spec.ts:1`](../../frontend/src/shared/api/codegen.gate.spec.ts#L1)

- Compose-контракт
  [`compose.scaffold.spec.ts:1`](../../tests/compose.scaffold.spec.ts#L1)

- Как поднять / seed / health
  [`README.md:1`](../../README.md#L1)
