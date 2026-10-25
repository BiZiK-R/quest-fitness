---
target: frontend/src/pages/client-card/ClientCardPage.tsx
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\mrspy\\Desktop\\AIBot\\quest-fitness\\frontend\\src\\pages\\client-card\\ClientCardPage.tsx"
target_fingerprint: "sha256:ffc4805c097a306a142533569c47f48aeb4b5df81978bfe55a9f50928c733302"
target_path: "C:\\Users\\mrspy\\Desktop\\AIBot\\quest-fitness\\frontend\\src\\pages\\client-card\\ClientCardPage.tsx"
timestamp: 2026-10-09T11-19-13Z
slug: frontend-src-pages-client-card-clientcardpage-tsx
closed: true
---
# Critique: ClientCardPage (Operate)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | After take, template stays disabled with no why |
| 2 | Match System / Real World | 2 | Macrocycle/streak jargon vs floor coach language |
| 3 | User Control and Freedom | 3 | Back/release OK; silent unlock on leave |
| 4 | Consistency and Standards | 1 | Raw WorkoutScheduleRow vs ListRow/Button language |
| 5 | Error Prevention | 3 | Confirms OK; disabled form still invites taps |
| 6 | Recognition Rather Than Recall | 2 | Gate remembered while scrolling empty wall |
| 7 | Flexibility and Efficiency | 1 | Re-take every visit; assign buried under empties |
| 8 | Aesthetic and Minimalist Design | 1 | Equal-weight empty boxes, not one task |
| 9 | Error Recovery | 2 | Empty-template dead end, no CTA on template |
| 10 | Help and Documentation | 2 | No help for lock TTL / macro prerequisites |
| **Total** | | **19/40** | **Poor** |

## Design Specificity Verdict

**LLM:** Hybrid — Quest lock/Brutal CTA authored; dossier of EmptyStates is category-generic CRM.

**Detector:** CLI detect on 16 surface files: 0 findings. Browser overlay: 1 `bounce-easing` on body (likely global FP).

## Overall Impression

Lock take is a strong Operate moment that collapses into an empty-state wall and a disabled assign form. Biggest opportunity: one progressive path «взял → назначить первую тренировку» (or setup rite if no templates).

## What's Working

1. Lock pattern — BottomCta «Взять клиента» + LockRow
2. Brutal primary hierarchy — single red CTA
3. Concrete Russian gate hints when not tripled

## Priority Issues

### [P0] Assign dead-end after take
**Why:** Template disabled, assign disabled; empty catalog → task impossible.
**Fix:** One setup EmptyState → «К шаблонам»; hide assign until templates exist.
**Suggested command:** $impeccable onboard (then $impeccable distill)

### [P1] Empty-state wall
**Why:** Three EmptyStates + heading soup; equal weight.
**Fix:** One progressive empty composition; demote EmptyState titles.
**Suggested command:** $impeccable distill

### [P1] False affordance schedule form while gated
**Why:** Disabled datetime/template/assign dominate scroll.
**Fix:** Collapse assign until lock held AND assignable; one CTA instead.
**Suggested command:** $impeccable clarify / $impeccable layout

### [P2] StreakChip at 0
**Why:** Noise and false status.
**Fix:** Hide until streak > 0.
**Suggested command:** $impeccable quieter

### [P2] WorkoutScheduleRow craft debt
**Why:** Four equal actions will explode load when data appears.
**Fix:** Primary «Начать» + overflow for secondary.
**Suggested command:** $impeccable polish

## Persona Red Flags

**Floor trainer:** thumb travel through empties; cannot assign without leaving for catalog.
**First-time admin:** prerequisite maze templates→macros→take→schedule; jargon.

## Minor Observations

Heading soup; triple invite hints; cream class naming; overview raw error button.

## Questions to Consider

1. Why a four-section dossier instead of locked → assign → done?
2. Is take the product moment or a velvet rope to a dead form?
3. Should zero-catalog clients show streak + three empties or one setup rite?
