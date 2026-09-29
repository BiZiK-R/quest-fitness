---
title: 'Story 4.1 — Назначение одной Тренировки'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'd60e934'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Тренер не может назначить Клиенту одну Тренировку (Ожидание) из этапа Макроцикла или явного Шаблона.

**Approach:** Prisma Workout; module `workouts`; lock-gated POST assign with Idempotency-Key; list on client card; FE schedule + assign UI; stagesExhausted warning; TDD. Skip/cancel/reschedule OUT (4.2+).

## Boundaries & Constraints

**Always:** AD-6 lock; AD-20 only `workouts` writes Workout status; Idempotency-Key on POST (24h same response); status `pending`; one date not series; OpenAPI; TRAINER/ADMIN only.

**Never:** mass date series; skip/cancel/attended; Session; streak side-effects beyond storing pending; invent error codes outside spine enum.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Assign from stage template | lock + scheduledAt | Workout pending | N/A |
| Assign explicit templateId | lock + templateId + scheduledAt | pending | N/A |
| No lock | — | — | LOCK_REQUIRED |
| Stages exhausted | open assign | warn + manual template | N/A |
| Same Idempotency-Key | replay POST | same body, no dup | N/A |
| Client role | — | — | FORBIDDEN_ROLE |

</frozen-after-approval>

## Code Map

- prisma Workout (+ IdempotencyRecord if needed)
- backend/src/modules/workouts/
- FE ClientCard schedule list + assign form (native datetime)
- OpenAPI + schema.d.ts

## Tasks & Acceptance

**Execution:**
- [x] Schema Workout + idempotency store
- [x] POST assign + GET list; lock; OpenAPI
- [x] FE assign UI + tests + build

**Acceptance Criteria:** Story 4.1 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
