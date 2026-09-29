---
title: 'Story 6.1 — Обзор тренировок Клиента'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'aaf30fa'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Кабинет Клиента и карточка не показывают обзор тренировок месяца / ближайших / запланированной.

**Approach:** BFF overview DTO with monthCount, upcoming, nextScheduled computed in GYM_TIMEZONE; FE CabinetWorkoutsPage + ClientCard overview; empty «Первый поход ещё впереди»; link to diary. Streak OUT (6.2), tab bar OUT (6.3).

## Boundaries & Constraints

**Always:** AD-17 calendar fields from BFF only; CLIENT own overview; TRAINER/ADMIN by clientId; OpenAPI.

**Never:** browser TZ for month; onboarding tours; invent streak chip here.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Has workouts | GET overview | monthCount, upcoming, next | N/A |
| Empty | GET | empty flag / empty lists | N/A |
| Client other | — | — | FORBIDDEN_ROLE |
| FE month | — | uses BFF field only | N/A |

</frozen-after-approval>

## Code Map

- workouts or clients overview endpoint
- CabinetWorkoutsPage
- ClientCard overview block
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE overview + gym TZ month count
- [x] FE cabinet + card + empty + diary link
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 6.1 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
