---
title: 'Story 1.4 — Shell Гильдии, mobile-first колонка и noindex'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: '8e1e668'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-quest-fitness-2026-09-29/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Экраны без единой темы Гильдии и без noindex на защищённых страницах.

**Approach:** CSS tokens из DESIGN.md в `frontend/src/shared/ui` (или `shared/styles`), AppShell колонка ≤640, Rubik, focus-ring, знак Гильдии в шапке, `lang="ru"`, noindex на cabinet/pool/login protected; TDD smoke на tokens/layout/meta.

## Boundaries & Constraints

**Always:** tokens colors (surface-app #FAF7F4, accent #C33F46, …), Rubik, spacing content-max 640, margin 16/24, touch-min 48; no gradients/glass/purple/glow/emoji icons; monochrome guild mark 24–32px in header; focus-visible from focus-ring; noindex,nofollow on cabinet/protected pages (and ideally pool/login shell).

**Never:** redesign all components; session dark surface full UI; Epic 2 features; inventing tokens not in DESIGN.md.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Error |
|----------|-------|----------|-------|
| Tokens loaded | app CSS | --color-accent-red #C33F46 etc | N/A |
| Shell layout | any viewport | column max 640 centered | N/A |
| Protected HTML | pool/cabinet | meta robots noindex,nofollow | N/A |
| a11y floor | login | lang=ru; focus-visible rule | N/A |

</frozen-after-approval>

## Code Map

- DESIGN.md — source of tokens
- `frontend/index.html` — lang=ru, fonts
- `frontend/src/shared/ui/tokens.css` or similar
- `frontend/src/app/` — AppShell layout wrapping routes
- pages login/pool/cabinet — use shell

## Tasks & Acceptance

**Execution:**
- [x] Tokens CSS + Rubik
- [x] AppShell column ≤640 + header mark
- [x] focus-visible + lang=ru
- [x] noindex on protected pages
- [x] Vitest/smoke for tokens/meta; build green

**Acceptance Criteria:** from Story 1.4 epics AC

## Spec Change Log

## Verification

**Commands:**
- `cd frontend && npm test && npm run build`
