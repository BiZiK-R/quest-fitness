---
title: 'Story 4.3 — Перенести Тренировку'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '4df3c79'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Тренер не может Перенести Ожидание на другую дату без сброса Стрика.

**Approach:** PATCH/POST reschedule in `workouts` updates `scheduledAt`, keeps `pending`; wire FE sheet + «Перенести» from skip/cancel confirm; TDD. Attended/status-pill polish OUT (4.4).

## Boundaries & Constraints

**Always:** AD-20 only workouts; AD-6 lock; status stays pending; no streak reset; no stage pointer move; no push; no separate confirm for reschedule.

**Never:** skip/cancel logic rewrite; Session start; invent push.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Reschedule pending | new scheduledAt | updated date, pending | N/A |
| No lock | — | — | LOCK_REQUIRED |
| Non-pending | — | — | WORKOUT_STATUS_CONFLICT |
| From skip confirm | Перенести | opens sheet, no skip | N/A |

</frozen-after-approval>

## Code Map

- workouts reschedule endpoint
- FE datetime sheet on schedule panel
- Wire Перенести in WorkoutSkipCancelConfirmDialog

## Tasks & Acceptance

**Execution:**
- [x] BE reschedule + tests
- [x] FE sheet + wire from confirm + tests
- [x] OpenAPI + build

**Acceptance Criteria:** Story 4.3 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
