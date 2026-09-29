---
title: 'Story 6.4 — Extension hooks Этапа 2 (stubs only)'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '047434c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет явных пустых Nest-точек расширения и no-op хука списания абонемента.

**Approach:** Empty Nest modules for analytics/nutrition/measurements/achievements/membership; no-op membership debit hook called from session start and workout skip (and cancel if natural); no Stage 2 endpoints/OpenAPI domain APIs; no tariff/achievement seed. UI already soon-stub from 6.3.

## Boundaries & Constraints

**Always:** AD-9 stubs only; no FR-21…30a logic; no-op debit documented; no Путеводитель seed; no hardcoded ranks.

**Never:** Working Stage 2 REST; billing logic; invent schema tables unless nullable placeholder clearly unused.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| App boots | modules registered | empty modules load | N/A |
| Start session | hook | no-op called | N/A |
| Skip workout | hook | no-op called | N/A |
| OpenAPI | export | no Stage2 domain paths | N/A |

</frozen-after-approval>

## Code Map

- backend/src/modules/{analytics,nutrition,measurements,achievements,membership}/
- membership debit no-op service
- wire sessions start + workouts skip
- Vitest no-op called / OpenAPI gate optional

## Tasks & Acceptance

**Execution:**
- [x] Empty Nest modules + AppModule
- [x] No-op membership debit on start/skip
- [x] Tests + no Stage2 OpenAPI paths + build

**Acceptance Criteria:** Story 6.4 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`

