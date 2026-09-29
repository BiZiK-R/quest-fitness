---
title: 'Story 2.4 — Пул клиентов: список, поиск, карточка на чтение'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '8154072'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-create-client-pool.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-quest-fitness-2026-09-29/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Пул слишком сырой: нет поиска, empty states, client-row, карточки на чтение, poll.

**Approach:** Enrich pool UI + GET client by id (read never acquires lock); search filter; empty/search-empty copy; decorative lock-badge stub; soft poll ~30s; trainer-menu stub sheet; TDD.

## Boundaries & Constraints

**Always:** UX empty «Гильдия пока собирается» + Добавить клиента; search miss «Никого не нашли»; client-row name; lock-badge decorative non-interactive until 2.5; GET /clients/:id never locks (AD-6); no bottom tab bar for trainer; OpenAPI.

**Never:** real ClientLock acquire (2.5); workout schedule meta (Epic 4 — omit/hide); full catalog menus.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Empty pool | no clients | Guild empty copy + add CTA | N/A |
| Search miss | query no match | «Никого не нашли» | N/A |
| Open card | tap row | /clients/:id read page | N/A |
| GET card | any | no lock side effects | N/A |

</frozen-after-approval>

## Code Map

- PoolPage enhance
- ClientCardPage
- GET /api/clients/:id
- client-row widget
- trainer-menu stub

## Tasks & Acceptance

**Execution:**
- [x] GET client by id API
- [x] Pool search + empty states + poll
- [x] Client card read page + route
- [x] Tests + OpenAPI + build

**Acceptance Criteria:** Story 2.4 epics (lock occupied read: stub badge OK until 2.5)

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm test`
- `cd frontend && npm test && npm run build`
