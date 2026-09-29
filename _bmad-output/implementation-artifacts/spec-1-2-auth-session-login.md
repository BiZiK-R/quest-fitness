---
title: 'Story 1.2 — Серверная сессия и вход Тренера/Админа'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'd55a8ee'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-1-platform-scaffold.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Каркас есть, но Тренер/Админ не могут войти: нет серверной сессии, cookie, CSRF и экрана входа.

**Approach:** Модуль `auth` + таблица сессий в Postgres, login/logout для trainer/admin, глобальный CSRF-guard, FE login → stub Пул клиентов, OpenAPI+codegen обновлены; TDD red→green.

## Boundaries & Constraints

**Always:**
- ARCHITECTURE-SPINE побеждает. AD-5: cookie `qf_session` httpOnly, SameSite=Lax, Path=/, Secure вне `local`; сессии в Postgres; argon2id memoryCost≥65536; CSRF custom-header/double-submit на все мутации; FE client `credentials: 'same-origin'`.
- Error envelope `{ error: { code, message, details? } }` + enum `ErrorCode` (минимум из spine).
- OpenAPI канон `backend/openapi/openapi.yaml` → codegen только `frontend/src/shared/api`.
- Логин trainer/admin: логин + пароль; login lowercase; пароль не в логах.
- После успеха landing — экран **Пул клиентов** (stub с заголовком допустим).
- CSRF header по умолчанию: `x-csrf-token` + значение из сессии/cookie double-submit.
- TDD Vitest: login / logout / session create.

**Ask First:** нет — дефолты из spine зафиксированы выше.

**Never:**
- Story 1.3+ (вход клиента по телефону, полноценные role guards client).
- JWT/localStorage; CORS credentials; SMS OTP.
- Полноценный пул клиентов / инвайты / домен зала.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login ok | seeded admin login+password | 200; Set-Cookie qf_session; session row in DB | N/A |
| Login bad | wrong password | 401 envelope `UNAUTHENTICATED` | form fields not cleared on FE |
| Login invalid | empty login | 400 `VALIDATION_FAILED` | details optional |
| Logout | valid session cookie | session invalidated; cookie cleared | N/A |
| CSRF missing | POST mutation without CSRF | rejected by global guard | FORBIDDEN/CSRF via envelope |
| Restart | cookie valid, backend restarted | still authenticated (Postgres session) | N/A |

</frozen-after-approval>

## Code Map

- `backend/prisma/schema.prisma` — AuthSession
- `backend/src/modules/auth/` — login/logout, session service
- `backend/src/common/errors/` — ErrorCode + filter
- `backend/src/common/guards/csrf.guard.ts`
- `backend/src/main.ts` — cookie-parser, guards/filters
- `frontend/src/shared/api/client.ts` — credentials + CSRF
- `frontend/src/pages/` — login + client-pool stub
- `frontend/src/app/` — router
- Existing seed/health/openapi pipeline

## Tasks & Acceptance

**Execution:**
- [x] TDD red→green: auth login/logout/session + CSRF
- [x] Prisma AuthSession migration + Auth Nest module
- [x] Error envelope + ErrorCode
- [x] Cookie qf_session + CSRF guard
- [x] FE login + pool stub + credentials same-origin + codegen
- [x] OpenAPI re-export; FE build green

**Acceptance Criteria:**
- Given seeded Admin, when login+password, then Postgres session + qf_session cookie; argon2id; landing Пул клиентов
- Given mutating route without CSRF, when called, then CSRF-guard rejects; client credentials same-origin
- Given authed user, when logout, then session+cookie cleared
- Given bad credentials, when login, then UNAUTHENTICATED/VALIDATION_FAILED; FE by code; form not cleared
- Given backend restart + valid cookie, then still logged in
- Given Vitest auth tests, then green; password not logged

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd backend && npm run openapi:export`
- `cd frontend && npm test && npm run build`
