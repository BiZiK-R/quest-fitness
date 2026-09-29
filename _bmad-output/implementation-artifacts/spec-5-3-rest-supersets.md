---
title: 'Story 5.3 — Таймер отдыха и Суперсеты'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'f5ad9fe'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет rest-timer после Подхода и логики суперсета (отдых только после круга).

**Approach:** FE rest-timer на абсолютном endsAt (skip/+30s); optional `supersetGroupId` on SessionExercise (from TemplateExercise snapshot); no rest mid-group; auto-advance within group; TDD. Modifiers OUT (5.4).

## Boundaries & Constraints

**Always:** AD-8 server owns sequenceIndex/supersetGroupId; client endsAt only; rest does not cover logger; prefers-reduced-motion discrete updates.

**Never:** modifiers; complete session; invent offline rest state in DB.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Set saved, no group | success | rest starts endsAt | N/A |
| Mid-superset set | success | no rest; next exercise | N/A |
| End of superset round | success | rest starts | N/A |
| Skip rest / +30s | tap | endsAt adjust / clear | N/A |
| Tab return | visibility | remaining from endsAt | N/A |

</frozen-after-approval>

## Code Map

- SessionExercise.supersetGroupId (+ TemplateExercise for snapshot)
- FE RestTimer + SessionWorkoutView wiring
- Tests

## Tasks & Acceptance

**Execution:**
- [x] Schema supersetGroupId + snapshot
- [x] FE rest-timer + superset advance
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 5.3 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
