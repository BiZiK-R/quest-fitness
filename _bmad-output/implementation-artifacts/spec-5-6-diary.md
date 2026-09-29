---
title: 'Story 5.6 — Дневник: история, author, abandoned'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'd21b11e'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет read-only Дневника с историей Сессий, автором и abandoned.

**Approach:** `diary` query module; list + detail for client; CLIENT own-only; TRAINER/ADMIN with client id; abandoned marked «не завершена»; FE diary pages with inline retry. No mutations. Epic 6 OUT.

## Boundaries & Constraints

**Always:** AD-20 diary query-only; AD-15 abandoned readable; FR-2a changelog; OpenAPI; no streak/stage side effects from read.

**Never:** mutate Session/Set; toast on error; client reading others' diary.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| List completed+abandoned | clientId | entries with status | N/A |
| Detail completed | sessionId | sets, modifiers, tonnage, author | N/A |
| Detail abandoned | sessionId | readable + incomplete flag | N/A |
| Client other diary | — | — | FORBIDDEN_ROLE |
| Load fail FE | error | inline + Повторить | N/A |

</frozen-after-approval>

## Code Map

- backend/src/modules/diary/
- FE diary list/detail (trainer on client card + client cabinet path stub ok)
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] BE diary list/detail read-only + ACL
- [x] FE history UI + retry
- [x] OpenAPI + build

**Acceptance Criteria:** Story 5.6 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
