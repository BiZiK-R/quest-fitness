---
title: 'Story 3.3 — Макроцикл: сборка этапов'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'de106e3'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет Macrocycle со стадиями на Templates.

**Approach:** Prisma Macrocycle, MacrocycleStage, ClientMacroProgress; CRUD macrocycles with ordered stages; reorder/delete stages re-point or null ClientMacroProgress.currentStageId in same transaction; FE page; TDD.

## Boundaries & Constraints

**Always:** AD-7 currentStageId is FK to MacrocycleStage not index; up/down not DnD; CLIENT forbidden; OpenAPI.

**Never:** auto advance on attended (3.4/Epic4); Session.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Create macro | name + stages | stages ordered | N/A |
| Delete stage | stage with progress | progress null/repointed in tx | N/A |
| Client CRUD | client | FORBIDDEN | 403 |

</frozen-after-approval>

## Code Map

- prisma macrocycles
- modules/macrocycles
- FE /macrocycles

## Tasks & Acceptance

**Execution:**
- [x] Schema + CRUD + stage reorder/delete with progress fix
- [x] FE + tests + OpenAPI + build

**Acceptance Criteria:** Story 3.3 epics

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
