---
title: 'Story 5.1 — Старт Сессии: snapshot и таймер длительности'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'c1b4783'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет старта Session с immutable snapshot и таймером длительности.

**Approach:** Prisma Session + SessionExercise snapshot; POST start; link ClientLock.activeSessionId; FE session page dark surface + endsAt duration timer; wire Начать. Set logging OUT (5.2). Complete/abandon OUT later stories.

## Boundaries & Constraints

**Always:** AD-6 lock + activeSessionId prolongs lock; AD-7 snapshot at start from template exercises; AD-8 client endsAt only; AD-15 status active; SESSION_ALREADY_ACTIVE; OpenAPI.

**Never:** set upsert (5.2); complete/abandon UI; offline queue; mid-session exercise swap; invent ErrorCodes.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Start pending + lock | POST | Session active + snapshot | N/A |
| Already active | POST | — | SESSION_ALREADY_ACTIVE |
| No lock | POST | — | LOCK_REQUIRED |
| Template edit after start | change template | snapshot unchanged | N/A |

</frozen-after-approval>

## Code Map

- prisma Session, SessionExercise
- modules/sessions
- FE /sessions/:id dark surface + duration endsAt
- Wire Start on schedule panel

## Tasks & Acceptance

**Execution:**
- [x] Schema + start + snapshot + lock activeSessionId
- [x] FE session screen + timer + Start wire
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 5.1 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
