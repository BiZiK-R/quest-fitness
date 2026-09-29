# Source extract — Quest Fitness UX Discovery
Date: 2026-09-29
Model: claude-opus-5-thinking-high
Sources: prd.md, project-spec.md, design-brief-guild.md, intake-design-guild.md, addendum.md, slides-utf8.txt, theme XML + slide colors

## Product & stakes
Internal web tool for one gym Quest Fitness. Shared trainer pool + shared client pool. Exclusive lock on client (TTL 30m). SM-C1: no gamification screens that hurt live Session speed.

## Roles
Trainer, Admin (= trainer + privileges), Client. No "my clients".

## Surfaces (Skeleton)
Login; Client pool; Client card + lock; Invite link; Exercise catalog; Template builder; Macrocycle; Assign workout; Waiting (Start/Skip/Cancel/Reschedule); Live Session; Session summary; Client cabinet tab Trainings (+ Streak). Stage 2 tabs: Analytics, Nutrition, Measurements, Achievements, Membership. Admin panel Stage 2.

## Brand (Guild)
Swatch: #241C20, #F6EBDD, #C33F46, #EFB68C. Product bg #FAF7F4. Slides also used #B33743 (working red), #6E5D60 (muted text), #BFAFB1 (borders). Rubik only. Sign: kettlebell+dragon icon/header only. Quest language in titles/empty states, NOT action buttons. Live workout: dark charcoal.

## Guild in Skeleton
Only Streak + visual language. Rank/Achievements Stage 2. No XP entity. Plans can disable gamification.

## Gaps
1. What fills Guild metaphor in v1 without SM-C1 violation
2. Password/login rules → UX
3. Lock UI
4. Template conflict warning
5. Cancel vs Reschedule (both kill workout; Cancel resets streak)
6. Invite reissue / password reset / archive
7. Custom modifier RGB palette
8. Hide vs stub Stage 2 tabs
9. Red hex canon
10. Offline sync indicator
11. Missing muscle groups warning
