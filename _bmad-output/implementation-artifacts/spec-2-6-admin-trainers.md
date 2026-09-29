---
title: 'Story 2.6 — Админ: тренеры, роль admin, сброс пароля клиента'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '690e005'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Админ не может заводить Тренеров, повышать до admin и сбрасывать пароль Клиента.

**Approach:** Minimal admin users API + UI: create trainer, promote to admin, reset client password (return temp once); TDD; OpenAPI.

## Boundaries & Constraints

**Always:** ADMIN only for these actions; FORBIDDEN_ROLE for trainer; argon2id hashes; no Stage-2 admin panel; OpenAPI; CSRF.

**Never:** self-serve password reset; Stage-2 CRM.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Create trainer | admin | user TRAINER | N/A |
| Promote | admin | role ADMIN | N/A |
| Trainer tries | trainer | FORBIDDEN_ROLE | 403 |
| Reset client pwd | admin on client card | temp password once | N/A |

</frozen-after-approval>

## Code Map

- users module admin endpoints
- FE admin trainers page + client card reset
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] Admin APIs + tests
- [x] FE minimal UI
- [x] OpenAPI + build

**Acceptance Criteria:** Story 2.6 epics

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
