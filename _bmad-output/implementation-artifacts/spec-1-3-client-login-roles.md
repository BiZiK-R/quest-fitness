---
title: 'Story 1.3 — Вход Клиента и разграничение ролей'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '2a9dc7e'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-2-auth-session-login.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Клиент не может войти по логину/телефону; роли не режут trainer-only маршруты; нет landing в Кабинет.

**Approach:** Расширить auth: client login (login|phone E.164 + password), role guard FORBIDDEN_ROLE, FE client login + stub Кабинет→Тренировки; TDD.

## Boundaries & Constraints

**Always:** AD-5 phone E.164 + login lowercase; validation UX-DR21; error envelope; CSRF/session from 1.2 reuse; OpenAPI codegen; landing Кабинет вкладка Тренировки (stub OK); «Обратитесь к тренеру» for forgotten password; TDD.

**Never:** Invite registration; Story 1.4 full Guild tokens; admin password reset UI (may stub later); inventing routes outside AC.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error |
|----------|--------------|----------|-------|
| Client login login | client user + password | session; landing cabinet/workouts | N/A |
| Client login phone | E.164 phone + password | session | UNAUTHENTICATED |
| Client → trainer route | client session | FORBIDDEN_ROLE | envelope |
| Invalid fields | short login | VALIDATION_FAILED; form kept | field errors |
| Logout client | session | cleared | N/A |

</frozen-after-approval>

## Code Map

- `backend/prisma` — User.phoneE164 nullable unique
- `backend/src/modules/auth` — extend login identifier
- `backend/src/common/guards` — RolesGuard
- `frontend/src/pages` — client login + cabinet stub

## Tasks & Acceptance

**Execution:**
- [x] Prisma phoneE164 + migrate
- [x] Auth login by login OR phone; client landing
- [x] RolesGuard FORBIDDEN_ROLE on trainer-only sample route
- [x] FE client login + cabinet/workouts stub + copy «Обратитесь к тренеру»
- [x] OpenAPI + tests green

**Acceptance Criteria:**
- Given client, when login or phone+password, then session; landing Кабинет→Тренировки
- Given UX-DR21 invalid, when submit, then field errors; form not cleared; forgot → «Обратитесь к тренеру»
- Given client logout, when called, then session cleared
- Given client on trainer-only, when called, then FORBIDDEN_ROLE

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
