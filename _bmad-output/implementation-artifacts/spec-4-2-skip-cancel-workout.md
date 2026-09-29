---
title: 'Story 4.2 — Пропустить и Отменить'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '31ebefd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Тренер не может Пропустить/Отменить Ожидание с confirm про сброс Стрика.

**Approach:** POST skip/cancel в `workouts` (AD-20) с Idempotency-Key; streak fold helper (AD-16) unit-tested; FE confirm с точным текстом + альтернатива Перенести (без применения skip); TDD. Full Перенести sheet — Story 4.3.

## Boundaries & Constraints

**Always:** only `workouts` writes status; lock required; Idempotency-Key 24h; confirm before mutate; exact confirm copy from epics; pending → skipped|cancelled only.

**Never:** push; membership debit; stage pointer move; invent streak column; implement full reschedule sheet (4.3).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Skip pending | confirm + POST | status skipped; streak fold → 0 | N/A |
| Cancel pending | confirm + POST | status cancelled; streak → 0 | N/A |
| No confirm | click skip | no API call | N/A |
| No lock | POST | — | LOCK_REQUIRED |
| Non-pending | POST | — | WORKOUT_STATUS_CONFLICT |
| Same Idempotency-Key | replay | same response | N/A |

</frozen-after-approval>

## Code Map

- workouts.service skip/cancel + streakFold util
- FE ClientWorkoutSchedulePanel confirm dialog
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE skip/cancel + streak fold tests + idempotency
- [x] FE confirm UX + tests
- [x] OpenAPI + build

**Acceptance Criteria:** Story 4.2 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
