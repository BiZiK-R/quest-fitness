---
title: 'Story 2.5 — Эксклюзивная блокировка Клиента'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '3f2677c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет эксклюзивного лока Клиента (AD-6).

**Approach:** Prisma ClientLock + clients-lock module: POST lock, POST heartbeat, DELETE release, force-unlock; atomic acquire; TTL 30m from lastActivityAt; FE take/release/heartbeat; TDD. Session abandoned hooks stubbed until Session model exists (document no-op).

## Boundaries & Constraints

**Always:** AD-6 numbers (heartbeat ≤60s FE, idle TTL 30m); GET never locks; POST lock only acquire; CLIENT_LOCKED details holderTrainerId+expiresAt; LOCK_REQUIRED when mutate without hold (protect invite issue as sample mutation requiring lock OR a dedicated ping); force-unlock holder|admin with confirm on FE.

**Never:** invent Redis; full Session/Workout domain (Epic later) — abandon path no-op with TODO; Story 2.6 admin trainers.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Acquire | free client | lock + expiresAt | N/A |
| Conflict | other holder live | 409 CLIENT_LOCKED | details |
| Heartbeat | holder | lastActivityAt refresh | N/A |
| Release | holder DELETE | lock gone | N/A |
| Force | admin | lock gone | N/A |
| Expire | stale >30m | new acquire succeeds | N/A |

</frozen-after-approval>

## Code Map

- Prisma ClientLock
- modules/clients-lock
- ClientCardPage FE
- OpenAPI

## Tasks & Acceptance

**Execution:**
- [x] ClientLock schema + APIs
- [x] Vitest acquire/conflict/release/force/expire
- [x] FE take/heartbeat/release/banner
- [x] OpenAPI + build

**Acceptance Criteria:** Story 2.5 core lock (session abandon deferred no-op)

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
