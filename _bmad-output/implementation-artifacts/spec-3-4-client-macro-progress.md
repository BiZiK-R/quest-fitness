---
title: 'Story 3.4 — Указатель этапа Макроцикла у Клиента'
type: 'feature'
created: '2026-09-29'
status: 'in-progress'
baseline_commit: ''
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Тренер не может назначить Клиенту Макроцикл и вручную сдвинуть currentStageId.

**Approach:** Endpoints на карточке клиента (lock-gated) для assign + override; upsert ClientMacroProgress; FE блок на ClientCard; предупреждение «этапы кончились»; TDD. Автосдвиг на attended — НЕ в этой story (Epic 4/5).

## Boundaries & Constraints

**Always:** AD-6 lock on mutate (LOCK_REQUIRED / CLIENT_LOCKED); AD-7 currentStageId FK; default first stage by sortOrder; override only explicit; OpenAPI; CLIENT forbidden.

**Never:** auto advance on attended; Session; invent new ErrorCode beyond envelope; DnD.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Assign with lock | macrocycleId | progress, currentStageId=first | N/A |
| Assign without lock | — | — | LOCK_REQUIRED |
| Override stage | stageId of same macro | currentStageId updated | N/A |
| Override foreign stage | stage of other macro | — | VALIDATION_FAILED / NOT_FOUND |
| Stages exhausted | pointer last / null after deplete | warn flag/message for UI | N/A |
| Client role | any mutate | — | FORBIDDEN_ROLE |

</frozen-after-approval>

## Code Map

- backend: clients or macrocycles progress endpoints under `/api/clients/{id}/macro-progress`
- ClientsLockService.assertActorHoldsLiveLock
- ClientProfileDto may include macroProgress summary
- FE: ClientCardPage panel assign/override + stages-exhausted warning

## Tasks & Acceptance

**Execution:**
- [ ] BE assign + override + lock + OpenAPI
- [ ] FE ClientCard macro panel + tests
- [ ] Vitest red→green; FE build

**Acceptance Criteria:** Story 3.4 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
