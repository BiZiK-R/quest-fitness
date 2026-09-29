# Addendum notes (tech & deferred detail)

Captured during PRD Discovery — belongs in architecture / UX later, not as PRD capability fluff.

## Auth (confirmed product rules)
- Client invite link with TTL → registration form: Name, phone, login, password (validated) → cabinet.
- Later login: login **or** phone + password.
- Trainers/Admin: login + password.
- SMS OTP not required for the chosen client auth scheme.

## Explicit non-goals (product)
- Product food database / barcode search — out of scope for current product goals.
- Payments, payroll, revenue — out of scope (plan **price** is informational only).
- Client self-booking calendar — out of scope (scheduled workouts are trainer-created).
- Hardcoded membership tariffs in application code — plans live in DB via admin CRUD.

## Membership plan seed reference (NOT code constants)
Photos: `docs/design-refs/abonement-guide-1.jpg`, `abonement-guide-2.jpg` («Путеводитель»).
Seed into DB after plan CRUD exists. Illustrative rows:

| name | price_rub | sessions | days | workout_min | gamification | notes |
|------|-----------|----------|------|-------------|--------------|-------|
| Тропа Начинающего | 14990 | 12 | 30 | 60 | off | classic |
| Покровительство Рыцаря | 16990 | 9 | 180 | 90 | full | |
| Первый шаг | 11990 | 8 | 60 | 60 | off | try pack |
| Гармония Воина | 26990 | 15 | 180 | 90 | full | achievements + profile stats |
| Сокровищница | 16500 | 12 | 90 | 60 | off | |
| Бонус Пасс | 1490 | — | 30 | — | achievements/stats focus | may have no session count |

Hourly rates on flyers are derived display fields, not required storage if calculable.

## Process note
Technical implementation questions must be raised separately when the work reaches that stage — do not silently invent stack choices in stories.
