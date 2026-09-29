---
title: 'Story 2.3 — Регистрация Клиента по инвайту'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'f975bee'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-2-invite-link.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Клиент не может зарегистрироваться по инвайт-ссылке.

**Approach:** Public POST consume invite in transaction (once); create User CLIENT + link ClientProfile; session cookies; FE `/invite/:token` form; errors INVITE_EXPIRED / INVITE_ALREADY_CONSUMED; TDD.

## Boundaries & Constraints

**Always:** AD-5 one-time consume in DB transaction; E.164 phone; login lowercase; unique phone/login; argon2id; SkipCsrf on register (public like login); UX-DR21 validation; landing `/cabinet/workouts`; OpenAPI+codegen.

**Never:** ClientLock; trainer menu; invent fields beyond name/phone/login/password.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Valid invite | name,phone,login,password | user+session; invite consumed; cabinet | N/A |
| Expired | old token | INVITE_EXPIRED + UX copy | envelope |
| Consumed | reused token | INVITE_ALREADY_CONSUMED | envelope |
| Validation | short login | field errors; form kept | VALIDATION_FAILED |

</frozen-after-approval>

## Code Map

- invites service consume
- auth session after register
- FE InviteRegisterPage
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] POST /api/invites/:token/register (or similar) transactional consume
- [x] FE /invite/:token page
- [x] Tests consume once + TTL + FE
- [x] OpenAPI + build

**Acceptance Criteria:** Story 2.3 epics

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
