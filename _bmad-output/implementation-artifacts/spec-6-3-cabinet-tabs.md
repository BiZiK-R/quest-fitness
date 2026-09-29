---
title: 'Story 6.3 — IA кабинета: 6 вкладок и soon-stub'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'd1c175b'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-quest-fitness-2026-09-29/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Нет tab bar из 6 вкладок и verbatim soon-stub для Этапа 2.

**Approach:** Cabinet shell with 6 tabs; Workout tab real; five soon-stubs with exact copy from epics; trainer-menu admin Stage2 stub «Кузница правил». Extension hooks OUT (6.4).

## Boundaries & Constraints

**Always:** FR-19a tab order; active = charcoal label + 2px red indicator; soon labels ink-soon + «Скоро» without opacity; verbatim stub titles/lines; no demo data/skeletons; content-max width tab bar.

**Never:** Stage 2 business logic; opacity on soon labels; invent stub copy.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Open cabinet | CLIENT | tabs 6, start Workouts | N/A |
| Analytics tab | tap | Свиток аналитики + line | N/A |
| Nutrition | tap | Стол Гильдии + line | N/A |
| Measurements | tap | Лента мерок + line | N/A |
| Achievements | tap | Витрина наград + line | N/A |
| Membership | tap | Карта пропуска + line | N/A |
| Trainer admin Stage2 | tap | Кузница правил + line | N/A |

</frozen-after-approval>

## Code Map

- cabinet layout + tab bar
- soon-stub pages
- TrainerMenuSheet Stage2 item
- Vitest verbatim copy

## Tasks & Acceptance

**Execution:**
- [x] Cabinet 6-tab shell + routes
- [x] Verbatim soon-stubs + trainer menu
- [x] Tests + build

**Acceptance Criteria:** Story 6.3 epics.md

## Spec Change Log

## Verification

**Commands:**
- `cd frontend && npm test && npm run build`
