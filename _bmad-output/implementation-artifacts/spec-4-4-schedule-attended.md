---
title: 'Story 4.4 — Расписание UI, просрочена, attended + автосдвиг этапа'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'c6d5879'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Расписание без status-pill/просрочена; нет сервисного перехода в attended с автосдвигом этапа для Epic 5.

**Approach:** Enrich WorkoutDto (isOverdue via GYM_TIMEZONE); status-pill FE; pool row next-workout meta; `markAttended` in workouts (same tx stage advance AD-7); Начать stub only. No Session UI.

## Boundaries & Constraints

**Always:** AD-17 overdue on BFF only; AD-7 advance only on attended from current stage; AD-20 workouts writes status; no UI to mark attended without Session; Start = stub.

**Never:** full Session start (5.1); paint status pills red; browser TZ for overdue.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| pending past gym day | list | isOverdue true | N/A |
| markAttended from current stage | service | attended + next stage | N/A |
| markAttended no stage link | service | attended, pointer unchanged | N/A |
| skip/cancel | — | no stage advance | N/A |
| Start button | click | stub/disabled | N/A |

</frozen-after-approval>

## Code Map

- workouts markAttended + isOverdue helper
- WorkoutDto + pool Client list meta
- FE status-pill + Start stub
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE overdue + markAttended + stage advance tests
- [x] Pool next-workout meta
- [x] FE pills + Start stub + tests + build

**Acceptance Criteria:** Story 4.4 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
