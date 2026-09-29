# Epic 1 Context: Каркас зала и вход

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Эпик закладывает фундамент внутреннего web-инструмента одного зала: локальный запуск стека одной командой, единый HTTP-контракт React SPA ↔ Nest BFF, серверные сессии с ролевым доступом и визуальная оболочка «Гильдия». Без этого нельзя безопасно входить, различать Тренера, Админа и Клиента и наращивать домен поверх одного API и одной дизайн-системы.

## Stories

- Story 1.1: Каркас платформы (Docker + Nest/Prisma/React + OpenAPI)
- Story 1.2: Серверная сессия и вход Тренера/Админа
- Story 1.3: Вход Клиента и разграничение ролей
- Story 1.4: Shell Гильдии, mobile-first колонка и noindex

## Requirements & Constraints

- **Роли (FR-1):** `client` | `trainer` | `admin` (`admin` ⊇ `trainer`). Клиент не выполняет тренерские команды; тренер — admin-only; гость не видит защищённых данных (FR-3).
- **Вход (FR-3 / FR-3a):** тренер/админ — логин + пароль; клиент — логин или телефон (E.164) + пароль. Инвайт-регистрация — Epic 2. Self-reset нет: «Обратитесь к тренеру».
- **Валидация:** логин 3–32 (латиница, `_`, `-`, цифры); пароль ≥8; BFF зеркалит UX; ошибки под полями; форма не сбрасывается.
- **Первый админ:** seed из `SEED_ADMIN_LOGIN` / `SEED_ADMIN_PASSWORD`; дефолтного пароля в репо нет.
- **UI (FR-31, FR-32):** mobile-first, язык «Гильдия», акцент `#C33F46`.
- **ПДн (FR-33):** ролевая изоляция; `noindex,nofollow` на кабинет/защищённые страницы.
- **Ошибки:** envelope `{ error: { code, message, details? } }`; UI только по `code`.
- **TDD + env:** health/login тесты; пароли не в логах; README: compose, `DATABASE_URL`, `SESSION_SECRET`, `GYM_TIMEZONE`.

## Technical Decisions

- **Репо:** только `frontend/` и `backend/`; FSD на FE; доступ к БД — только Prisma на BE.
- **Стек:** Compose (`frontend`, `backend`, `postgres:16`); Nest 12.1.1, Prisma 7.10.0, Node 22, React 19 + Vite 8; argon2id (memoryCost ≥ 65536).
- **Контракт:** `backend/openapi/openapi.yaml` (3.0.x, в git) → codegen в `frontend/src/shared/api`; prebuild падает без spec; ручной второй YAML запрещён.
- **Same-site:** Vite proxy `/api` локально; один origin в prod; `credentials: 'same-origin'`; без CORS+credentials.
- **Сессия:** Postgres + cookie `qf_session` (httpOnly, Lax, Path=/, Secure вне local); CSRF на все мутации; коды `UNAUTHENTICATED`, `VALIDATION_FAILED`, `FORBIDDEN_ROLE`.
- **Landings:** тренер/админ → «Пул клиентов»; клиент → кабинет, вкладка «Тренировки» (контент — позже).

## UX & Interaction Patterns

- Корневой URL без сессии — вход; отдельные поля для тренера (логин+пароль) и клиента (логин или телефон + пароль).
- Shell: колонка ≤640 px, margins 16/24, touch-min 48, Rubik, токены DESIGN; без градиентов/стекла/эмодзи-иконок; знак Гильдии 24–32 px в шапке.
- Формы: глобальный `focus-ring` на `:focus-visible`, `lang="ru"`, контраст ≥4.5:1 на светлом.
- Тренер после входа — Пул клиентов (без tab bar); клиент — tab bar кабинета (6 вкладок, большинство «Скоро» вне скелета).

## Cross-Story Dependencies

- **1.1** блокирует **1.2–1.4** (compose, Prisma, OpenAPI, proxy).
- **1.2** → **1.3** (сессия, CSRF, cookie; 1.3 — клиентский вход и guards).
- **1.2/1.3** → **1.4** (shell вокруг защищённых маршрутов и post-login landing).
- **Epic 2+** требует сессии и ролей из этого эпика.
