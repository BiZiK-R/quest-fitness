---
title: 'Story 2.2 — Ссылка-приглашение (выдача, TTL, копирование, перевыпуск)'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '6fa33bd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-create-client-pool.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет выдачи инвайт-ссылки с TTL 1 сутки и копирования.

**Approach:** Nest `invites` module: issue/reissue invite (token hashed, expiresAt +1 day), return plain URL once + expiresAt display fields in GYM_TIMEZONE; FE invite-share on pool/client row; copy with text confirmation; TDD.

## Boundaries & Constraints

**Always:** AD-5 hash token, expiresAt = created+1 day; reissue invalidates previous; CLIENT cannot issue; AD-17 calendar fields from BFF in GYM_TIMEZONE; OpenAPI codegen; CSRF on mutations; UX-DR15 copy confirmation not toast over CTA.

**Never:** Story 2.3 registration consume; ClientLock; invent SMS.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Issue invite | trainer + clientId | plain token once; hash in DB; expiresAt +1d | N/A |
| Reissue | trainer | new token; old invalid | N/A |
| Client issues | client session | FORBIDDEN_ROLE | 403 |
| Copy UI | tap copy | clipboard + text confirmation | N/A |

</frozen-after-approval>

## Code Map

- Prisma Invite model
- `backend/src/modules/invites`
- FE invite-share on pool
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] Prisma Invite + migrate
- [x] POST issue/reissue + GET status for client
- [x] FE invite-share + copy
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 2.2 epics

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
