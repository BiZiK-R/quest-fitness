---
title: 'Story 3.2 — Шаблон тренировки и LWW version'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '92da40c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет общих WorkoutTemplate с version LWW.

**Approach:** Prisma WorkoutTemplate + TemplateExercise; CRUD without ClientLock; optimistic version; 409 TEMPLATE_VERSION_CONFLICT; FE templates page with up/down reorder and conflict dialog; TDD.

## Boundaries & Constraints

**Always:** AD-7 version field; no AD-6 on templates; FR-8 fields; client FORBIDDEN; OpenAPI; buttons выше/ниже not DnD.

**Never:** Macrocycles 3.3; Session snapshot; invent drag-drop.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Create template | name+exercises | version=1 | N/A |
| Stale version | old version patch | 409 + currentVersion | TEMPLATE_VERSION_CONFLICT |
| Client CRUD | client | FORBIDDEN_ROLE | 403 |

</frozen-after-approval>

## Code Map

- prisma templates
- modules/templates
- FE /templates
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] Schema + CRUD + version conflict
- [x] FE list/editor + conflict dialog + reorder
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 3.2 epics (inline create exercise optional/minimal)

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
