---
title: 'Story 5.4 — Модификаторы подхода (палитра 6–8)'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '2ca2b99'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет каталога SetModifier и навешивания метки на Подход.

**Approach:** Prisma SetModifier (presets seed + custom); attach to Set; palette 6–8 fixed colors; soft-archive; FE sheet under logger; TDD. Complete session OUT (5.5).

## Boundaries & Constraints

**Always:** AD-19 soft-archive; shared pool catalog; no free RGB picker; contrast ≥3:1 vs surface-session-sunken; OpenAPI; lock on mutate.

**Never:** hard-delete with history refs; modal overlay covering logger; invent colors outside palette.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| List modifiers | GET | presets + customs active | N/A |
| Create custom | name + palette colorId | available to all trainers | N/A |
| Attach to set | modifierId | set shows label | N/A |
| Archive | DELETE/archive | archivedAt set | N/A |
| Free RGB | — | rejected | VALIDATION_FAILED |

</frozen-after-approval>

## Code Map

- prisma SetModifier + Set.modifierId
- modules/modifiers or sessions
- seed presets
- FE modifier sheet
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] Schema + seed + CRUD/archive + attach
- [x] FE sheet + tape label + tests
- [x] OpenAPI + build

**Acceptance Criteria:** Story 5.4 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
