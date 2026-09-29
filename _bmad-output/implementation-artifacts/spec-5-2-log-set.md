---
title: 'Story 5.2 — Лог Подхода: online-required, индикатор, правка'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'a161916'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет онлайн-записи Подхода с client setId upsert и индикатором sync.

**Approach:** Prisma Set; PUT upsert + DELETE by setId; sequenceIndex server-assigned; FE logger + sync indicator (сохранено/сохраняется/не сохранилось); max one in-flight; TDD. Rest/supersets/modifiers OUT.

## Boundaries & Constraints

**Always:** AD-8 client setId upsert; AD-14 online-only no offline queue; AD-6 lock; immutable after completed/abandoned; OpenAPI.

**Never:** sessionStorage buffer; background flush; rest timer (5.3); modifiers (5.4); complete session.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Upsert new set | setId UUID + payload | created, sequenceIndex | N/A |
| Retry same setId | same body | same row, no dup | N/A |
| Edit active | upsert same setId | updated | N/A |
| Delete active | DELETE setId | removed | N/A |
| Terminal session | mutate | — | WORKOUT_STATUS_CONFLICT or SESSION_ABANDONED |
| No lock | — | — | LOCK_REQUIRED |

</frozen-after-approval>

## Code Map

- prisma Set model
- sessions sets endpoints
- FE SessionSetLogger + sync indicator
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE Set upsert/delete + idempotency tests
- [x] FE logger + indicator + one in-flight
- [x] OpenAPI + build

**Acceptance Criteria:** Story 5.2 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
