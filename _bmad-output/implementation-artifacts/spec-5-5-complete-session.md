---
title: 'Story 5.5 — Завершение Сессии → Пришёл + итог'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'e79ec27'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет завершения Session → attended + итог тоннажа; лок не снимается.

**Approach:** POST complete; sessions calls workouts.markAttended in same flow; clear ClientLock; return summary DTO; FE cream summary screen. Abandoned cannot complete. Diary OUT (5.6).

## Boundaries & Constraints

**Always:** AD-15 completed only from active; AD-7 stage via markAttended only; AD-20 workouts writes Workout status; release lock on complete; no confirm dialog; OpenAPI.

**Never:** complete abandoned; diary module; invent streak UI here.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Complete active | POST | completed + attended + stage? + lock gone | N/A |
| Complete abandoned | POST | — | SESSION_ABANDONED |
| No history for exercise | summary | «Первый раз» | N/A |
| With prior completed | summary | growth % tonnage | N/A |

</frozen-after-approval>

## Code Map

- sessions.complete → markAttended + release lock
- SessionSummaryDto
- FE cream summary page
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE complete + tonnage summary + tests
- [x] FE Завершить + cream summary
- [x] OpenAPI + build

**Acceptance Criteria:** Story 5.5 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
