---
title: 'Story 6.2 — Стрик тренировок'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '54f9ad9'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Клиент не видит Стрик; fold уже есть, но не отдаётся в API/UI.

**Approach:** Expose streak from workouts.computeStreak on overview (or dedicated field); FE streak-chip apricot when >0, cream «копится» at 0; extend FR-20 fold tests. No DB column. Tab bar OUT (6.3).

## Boundaries & Constraints

**Always:** AD-16 on-demand fold only in workouts; FE displays server value verbatim; accessible name «Стрик тренировок: N подряд».

**Never:** streakCount column; FE recalculation; confetti/sound; invent Stage 2.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| 5 attended + 5 pending | fold | streak 5 | N/A |
| After skip | fold | 0 | N/A |
| Ramp 0→2 | first/second attended | 0 then 2 | N/A |
| UI streak 0 | — | cream «копится» | N/A |
| UI streak >0 | — | apricot chip | N/A |

</frozen-after-approval>

## Code Map

- compute-streak.ts (extend tests)
- overview DTO streak field
- FE StreakChip
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE streak on overview + FR-20 fold tests
- [x] FE streak-chip + tests
- [x] OpenAPI + build

**Acceptance Criteria:** Story 6.2 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
