---
title: 'Story 3.1 — CRUD Упражнений и мышечные группы'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '3134f5d'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет каталога упражнений и мышечных групп для шаблонов.

**Approach:** Prisma MuscleGroup, Exercise, ExerciseMuscle; seed groups; CRUD exercises with primary/secondary groups; soft-delete archivedAt; FE catalog page from trainer-menu; TDD.

## Boundaries & Constraints

**Always:** AD-19 soft-delete; groups optional with warning copy; seed muscle groups; TRAINER|ADMIN; OpenAPI; no hard-delete with FK.

**Never:** Templates (3.2); Session; invent Stage-2 analytics.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Create exercise | name + groups | persisted | N/A |
| No groups | name only | saved + warn flag/message | N/A |
| Archive | soft delete | archivedAt set; hidden from default list | N/A |

</frozen-after-approval>

## Code Map

- prisma exercises
- modules/exercises
- FE catalog page
- seed muscle groups

## Tasks & Acceptance

**Execution:**
- [x] Schema + seed groups + CRUD + archive
- [x] FE catalog
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 3.1 epics

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
