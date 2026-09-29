---
title: 'Story 2.1 — Создание Клиента в Пуле'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '55fd12c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Тренер не может завести карточку Клиента в общем Пуле.

**Approach:** Nest `users` (clients) module: create ClientProfile slot without ownerTrainerId; list pool for trainer/admin; FE pool create + list; TDD; OpenAPI codegen.

## Boundaries & Constraints

**Always:** AD-4 — no owner / «ответственный тренер» field; shared pool; FORBIDDEN_ROLE for client creating; Prisma only; OpenAPI → shared/api; CSRF+session from Epic 1; TDD.

**Ask First:** минимальные поля создания, если не в spine — use displayName (required) only for draft slot; login/phone optional until invite (2.2). Prefer ClientProfile model linked optionally to User.

**Never:** invites (2.2), ClientLock (later), ownerTrainerId, invent CRM fields.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Trainer creates | displayName | client in pool list; no owner field | N/A |
| Client creates | session client | FORBIDDEN_ROLE | 403 |
| List pool | trainer | all clients visible | N/A |

</frozen-after-approval>

## Code Map

- `backend/prisma` — ClientProfile
- `backend/src/modules/users` or `clients`
- `frontend/src/pages/pool` — list + create form
- OpenAPI export

## Tasks & Acceptance

**Execution:**
- [x] Prisma ClientProfile + migrate (no ownerTrainerId)
- [x] POST/GET clients API trainer|admin only
- [x] FE pool list + create
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 2.1 from epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
