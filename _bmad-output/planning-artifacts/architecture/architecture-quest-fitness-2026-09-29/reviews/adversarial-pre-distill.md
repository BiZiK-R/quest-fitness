# Adversarial Pre-Distill Review — Quest Fitness

**Lens:** two independent agent builders, each literally obeying every adopted decision, still shipping incompatible systems.
**Stage:** before the spine is fully distilled — findings are phrased as **AD rule snippets to adopt**, not as defects.

**Inputs**

- `prd-quest-fitness-2026-09-29/prd.md` (final)
- `ARCHITECTURE-SPINE.md` (AD-1…AD-10 + conventions)
- `ux-quest-fitness-2026-09-29/EXPERIENCE.md`, `DESIGN.md`
- Prior pass: `reviews/review-adversary.md` (H1…H8 — **not repeated here**; this pass covers different axes)

**Known adopted decisions treated as fixed:** repo `frontend/`+`backend/`; React+TS; NestJS 12 + Prisma + Postgres; modular monolith BFF; OpenAPI YAML in `backend/` with FE codegen; Postgres-row client lock (TTL 30m, heartbeat, active session extends, force-unlock by holder+admin); httpOnly session cookie, invite TTL 1d, login|phone+password; immediate set persist, client absolute `endsAt` timers, no offline queue; template version LWW + immutable session snapshot; skeleton only with Stage-2 hooks.

---

## Verdict

**Eight blocking holes.** Every one is a place where two agent builders can each cite the adopted decisions verbatim and still produce clashing schemas, duplicated writes, or a broken product rule. Three are **critical**: they either contradict an already-shipped sibling artifact (UX), break FR-2b, or break every mutating request in a real deployment.

One cross-artifact contradiction deserves top billing: **`EXPERIENCE.md` specifies an offline set queue that `AD-8` forbids.** Two builders reading two "final" artifacts will not converge — this must be resolved in the spine, and the UX text amended, before any story is written.

---

## Hole 1 — Offline set queue: UX and AD-8 contradict each other `[CRITICAL]`

**Builder A** reads `AD-8` ("Skeleton is online-required for set writes; retry UI; no offline queue") and implements `POST /sessions/{id}/sets` with an error toast and a manual retry button.

**Builder B** reads `EXPERIENCE.md`, which is equally normative and says: «Нет связи. Подходы сохраняются и уйдут сами», «Подтверждённые Подходы копятся в очереди, индикатор показывает количество», sync indicator state «нет связи (N подходов в очереди)», and Flow 1's failure branch «после возвращения сети очередь уходит молча. Ни один подтверждённый Подход не теряется». B builds a `sessionStorage` queue with background flush.

**What diverges**

- FE ships a write buffer the BFF was never designed for: on reconnect it replays N sets, and because there is no idempotency key, a partially-succeeded flush **duplicates Set rows** — corrupting tonnage (FR-17) and diary history (FR-18), the two things the product exists for.
- Set ordering diverges too: queued sets acquire `sequenceIndex` at flush time, not at confirm time.
- Acceptance splits: QA testing FR-13 against `EXPERIENCE.md` fails Builder A's correct implementation.

**Missing/weak AD:** `AD-8` states the decision but does not bind the FE surface (no ban on client-side buffering) and specifies no **idempotency** for set writes — so even the online-only path duplicates rows on a timeout-then-retry, which is the single most likely failure in a gym basement.

**Proposed rule — AD-8b (Set write durability)**
> The Skeleton is online-required for Set writes: the frontend may hold at most the one in-flight Set plus an explicit retry affordance, and no client-side queue, `sessionStorage` buffer, or background flush may exist. Every Set write carries a client-generated UUID as its `setId` and is applied with upsert/idempotent semantics, so a retried or duplicated request can never create a second row.

**Required companion action:** amend `EXPERIENCE.md` — sync indicator becomes `сохранено · сохраняется · не сохранилось, повторить`, and the «уйдут сами» / «N подходов в очереди» copy is removed. Whichever way the product decides, **one** artifact must state it.

---

## Hole 2 — Lock acquire trigger, atomicity, and release-vs-navigation `[CRITICAL]`

**Builder A** (`frontend/features/client-card` + `clients-lock`) reads `EXPERIENCE.md` Flow 1 — «тапает `client-row` — Карточка Клиента открывается, Занятость переходит к Артёму» — and acquires the lock on card mount via `POST /clients/{id}/lock`.

**Builder B** (`workouts`, `sessions`) reads `AD-6` — "mutating client program, workouts schedule, or session/sets **requires** holding the lock" — and implements lazy acquire inside each mutating command: if no live lock, take it; if held by another, 403.

Both obey `AD-6`. Neither is wrong on its own text.

**What diverges**

- **Read becomes a write.** `EXPERIENCE.md` also says the card opens for reading even when the client is busy («Тап открывает Карточку Клиента всегда»). With A, opening a card to glance at the diary silently seizes the lock and blocks a colleague for 30 minutes; with B, viewing is free but a trainer can start editing only to be refused mid-form.
- **Acquire race.** `AD-6` says "unique on `clientId`" and "acquire fails if held by another and not expired" — but not *how*. A read-then-write implementation (`SELECT` expiry, then `INSERT`/`UPDATE`) lets two trainers both observe an expired row and both win; the unique constraint does not help, because the winning path is an `UPDATE` of the same row. Two holders → FR-2b broken exactly in the scenario it exists for.
- **Release on navigation is undefined.** "Release on leave card" can mean `useEffect` cleanup `DELETE`, `pagehide`/`visibilitychange` beacon, or "just let the TTL do it". Builder A's unmount-`DELETE` fires on an in-session back-swipe and drops the lock under an active Session; Builder B's TTL-only approach leaves an abandoned card locked for the full 30 minutes. Browser close never reliably fires either.
- **Who counts down.** The UX shows «Освободится через 12 мин». If the FE computes that from a local clock and the BFF from `lastActivityAt + 30m`, the two disagree by whatever the device clock drift is, and «блокировка истекает через 5 мин» fires at the wrong moment.

**Missing/weak AD:** `AD-6` fixes the *store* and the *numbers* but not the *lifecycle*: no acquire trigger, no atomic acquire statement, no release taxonomy, no authority for the remaining-time value.

**Proposed rule — AD-6d (Lock lifecycle)**
> The lock is taken only by an explicit `POST /clients/{id}/lock` issued when a trainer enters the Client card; `GET` reads never acquire, and no mutating command may implicitly acquire or steal it (it returns `409 CLIENT_LOCKED` instead). Acquire is one atomic statement — `INSERT … ON CONFLICT (clientId) DO UPDATE … WHERE holder = :actor OR lastActivityAt < now() - interval '30 minutes'` — and its response carries the server-computed `expiresAt`, which is the only source for every countdown the UI shows.

**Proposed rule — AD-6e (Release taxonomy)**
> The lock is released by exactly four paths: explicit `DELETE` on leaving the card, Session reaching a terminal state, TTL expiry, and force-unlock by holder or Admin. Navigation- and unload-based release is best-effort only (`pagehide` + keepalive request) and correctness must never depend on it; TTL expiry is the sole guarantee.

---

## Hole 3 — Session cookie: SameSite, CSRF, and the origin model `[CRITICAL]`

`AD-5` says "httpOnly cookie (**Secure/SameSite as deploy requires**)" — an explicit non-decision on the one axis that decides whether the app works at all.

**Builder A** assumes a same-origin deployment (Vite dev proxy, one reverse proxy in prod), sets `SameSite=Lax`, generates the client with `credentials: 'same-origin'`, and adds no CSRF defense because `Lax` blocks cross-site POST.

**Builder B** assumes `frontend` and `backend` are separate containers on separate origins (which the adopted `docker-compose` seed makes entirely plausible), sets `SameSite=None; Secure`, enables CORS with `credentials: true`, and adds a CSRF token endpoint plus a guard.

**What diverges**

- The two cookie policies are mutually exclusive, and each breaks the other's frontend: B's client sends credentials cross-origin that A's CORS config rejects; A's client omits them where B needs them. Every authenticated request in the app is affected, and the failure appears only at integration.
- Builder B's `SameSite=None` plus Builder A's missing CSRF guard is the realistic merge outcome: a fully CSRF-exposed API where any page can `POST` "start session" or "force-unlock" with the trainer's ambient cookie. `FR-33` (ПДн under role-based access) makes this more than academic.
- Secondary silent split: **where sessions live**. In-memory session store (Nest default) logs out the whole gym on every backend restart and during a session; a Postgres-backed store does not. `AD-5` says "server session" without naming the store.

**Missing/weak AD:** `AD-5` defers the cookie attributes to "deploy", but the FE codegen client, the CORS config, and the CSRF guard are all compile-time artifacts that cannot be deferred.

**Proposed rule — AD-5c (Origin, cookie, CSRF)**
> Frontend and BFF are served **same-site in every environment** (dev via the Vite proxy, prod via one origin behind a reverse proxy); the session cookie is `httpOnly; Secure; SameSite=Lax; Path=/`, the generated client uses `credentials: 'same-origin'`, and cross-origin hosting with `SameSite=None` is forbidden in the skeleton. All mutating routes additionally pass one global Nest CSRF guard (custom-header or double-submit check), and sessions are persisted in a Postgres table so a backend restart does not sign out an in-progress Session.

---

## Hole 4 — Interrupted Session has no terminal contract (and lock TTL can never fire) `[HIGH]`

`AD-6` handles force-unlock with an in-progress Session by saying "mark it abandoned/cancelled **per product**" — i.e. undecided — and `AD-6` also states that while `activeSessionId` is set, "idle TTL does **not** expire the lock".

**Builder A** (`sessions`) treats force-unlock as `Session.status = 'abandoned'` and returns the Workout to `pending`: nothing was completed, so nothing happened.

**Builder B** (`workouts`) reasons that Sets exist in the DB, so the workout demonstrably took place: Workout → `attended`, streak +1, macrocycle stage pointer advances, and (at Stage 2) the membership is debited.

**What diverges**

- One event, two opposite outcomes across four derived values: workout status, streak, stage pointer, future membership debit. Whichever module runs second wins, and the client's diary and streak disagree with the trainer's memory.
- `PRD` defines only four statuses (`Ожидание`/`Пришёл`/`Пропущена`/`Отменена`), so "abandoned" has **no legal Workout status** to map onto — a schema-level gap, not a preference.
- **Deadlock:** because an active Session suspends the TTL unconditionally, a trainer who starts a Session and goes home locks that Client **forever**. `EXPERIENCE.md` Flow 4 assumes the opposite («Лена вызывает Админа **или ждёт TTL**») — with an in-progress Session the TTL never arrives, so the only exit is an Admin. The product promise "there is always a one-tap way out" quietly fails when no Admin is around.
- Whether an abandoned Session's Sets remain visible in the Дневник is also unspecified — deleting them contradicts `FR-2a`'s mandatory changelog; showing them unlabeled misrepresents a partial workout as a real one.

**Missing/weak AD:** no AD names the Session state machine, its terminal states, or the fan-out from each terminal state; and `AD-6`'s TTL suspension has no upper bound.

**Proposed rule — AD-8d (Session terminal states)**
> A Session has exactly two terminal states: `completed` (trainer confirms Завершить → Workout `attended`) and `abandoned` (force-unlock or Session-idle expiry → Workout returns to `pending`). An `abandoned` Session and its Sets stay readable in the Дневник flagged as incomplete, and never count toward the streak, never advance the macrocycle stage pointer, and never trigger Stage-2 membership debit.

**Proposed rule — AD-6f (Bounded TTL suspension)**
> An active Session suspends the 30-minute idle TTL only while the Session itself is active: if no Set write and no heartbeat arrive for 60 minutes, the BFF marks the Session `abandoned` and the lock expires on the normal TTL path, so no Client can be locked indefinitely without an Admin.

---

## Hole 5 — Streak: derived-on-read vs stored counter, and the ordering key `[HIGH]`

The conventions table says only "Streak — server-computed from Workout statuses per FR-20". Both builders comply.

**Builder A** (`diary`) computes the streak on read: fold the Client's Workouts, `pending` transparent, `skipped`/`cancelled` → 0, the ≥2-consecutive rule per FR-20.

**Builder B** (`workouts`) maintains a `ClientProfile.streakCount` column updated inside each status transition — cheaper, obviously "server-computed".

**What diverges**

- Two sources of truth for the single gamified number in the skeleton. B's counter drifts permanently the moment anything mutates history out of band: a backdated Workout, a corrected status, a force-unlock rollback (Hole 4), or a seed. A recomputes and self-heals; B cannot, and has no repair path.
- **Ordering is unowned, and Перенести reorders history.** Folding by `scheduledAt` versus by status-transition time gives different answers, and rescheduling a pending Workout to an earlier date changes its position in the chain — so a "streak-neutral" action (`FR-20`: «Перенос не сбрасывает Стрик») can change the streak under one implementation and not the other. `EXPERIENCE.md` also allows past-dated pending Workouts («Дата в прошлом — строка "просрочена"»), which sit in the middle of the chain indefinitely.
- The FR-20 ramp ("first Пришёл shows 0, second consecutive shows 2") is stated once in prose; two independent folds will differ on whether the third gives 3 — and the FE, seeing a number it can also derive, is likely to compute its own for the chip label.

**Missing/weak AD:** no AD fixes the computation site, forbids caching, or names the ordering key.

**Proposed rule — AD-11 (Streak is a derived read)**
> The streak is a pure derived value computed on demand by the `workouts` module from that Client's Workouts ordered by `scheduledAt ASC, id ASC`, folding statuses per FR-20 (`pending` transparent, `skipped`/`cancelled` reset to 0, ramp 0 → 2 → +1). No `streakCount` column, counter, or cache may exist, no other backend module may re-implement the fold, and the frontend renders the returned value verbatim without recomputation.

---

## Hole 6 — No timezone authority for a gym-local product `[HIGH]`

The conventions table says "Dates: ISO-8601 UTC in API; display TZ in FE". Both builders comply, and they still disagree about what day it is.

**Builder A** (BFF `workouts`) returns raw UTC instants and lets the FE bucket them.

**Builder B** (FE `entities/workout`) buckets with the browser timezone via `Intl`.

**What diverges**

- «Количество тренировок в текущем месяце» (FR-19) computed with `date_trunc('month', … )` in UTC versus in the browser's zone disagree for any workout near a month boundary: a 01 Oct 02:00 MSK session is September in UTC. The client's own counter is then wrong depending on which screen renders it.
- «Просрочена» (overdue) flips at a different instant on the BFF and the FE, so a Workout can be actionable on one surface and marked overdue on another.
- Invite «Ссылка живёт 1 сутки» as a wall-clock day versus a 24-hour instant differ under DST; streak day boundaries and calendar grouping inherit the same ambiguity.
- A trainer travelling or a reception desk machine set to another timezone changes the product's answers — unacceptable for a single-gym tool where "this month" is a gym fact, not a device fact.

**Missing/weak AD:** the "display TZ in FE" convention accidentally grants the browser authority over calendar semantics; no gym timezone constant exists anywhere in the spine.

**Proposed rule — AD-12 (Gym timezone)**
> One gym timezone (`Europe/Moscow` unless overridden by a `GYM_TIMEZONE` env var) is the sole calendar authority: instants are stored and transported as UTC ISO-8601, but every calendar-derived value — workouts-this-month, overdue flag, calendar-day grouping, streak boundaries, invite expiry display — is computed on the BFF in that timezone and returned as an explicit field. The frontend must never derive a date bucket or an overdue flag from the browser timezone.

---

## Hole 7 — Error taxonomy: two different 409s, no machine-readable code `[MEDIUM-HIGH]`

The conventions table says "OpenAPI error schema; `409` lock/version conflicts; `401/403` authz" — one status deliberately shared by two unrelated failures.

**Builder A** (`clients-lock`) returns `409 { message: 'Клиент занят', holderTrainerId, expiresAt }`.
**Builder B** (`templates`) returns `409 { error: 'VERSION_CONFLICT', currentVersion }`.

**What diverges**

- Field names and envelope shape differ per module, so the generated client exposes a union the FE cannot discriminate; there is no declared "error schema", only a mention of one.
- The two 409s demand opposite UX — the lock case shows the Занятость banner with a holder name and countdown, the template case must show «Шаблон изменил другой тренер… Сохранить поверх?» — and the FE can only tell them apart by string-matching a Russian message, which breaks the moment copy changes.
- Nothing distinguishes "no lock held" from "lock held by someone else" from "role forbidden", yet `EXPERIENCE.md` prescribes three different treatments. Builders fall back to `403` for all three, and the banner cannot be rendered correctly.

**Missing/weak AD:** no AD defines an error envelope, an exhaustive code enum, or the rule that the FE branches on codes rather than statuses.

**Proposed rule — AD-13 (Error envelope and codes)**
> Every non-2xx BFF response uses one schema `{ code, message, details? }`, where `code` comes from a single exhaustive `ErrorCode` enum declared in `backend/src/common/errors` and published in the OpenAPI file; the frontend branches only on `code`, never on HTTP status or message text. Conflicts must be distinguishable at minimum as `CLIENT_LOCKED` (with `holderTrainerId`, `expiresAt`), `LOCK_REQUIRED`, and `TEMPLATE_VERSION_CONFLICT` (with `currentVersion`).

---

## Hole 8 — Macrocycle stage pointer: representation and single writer `[MEDIUM]`

The conventions table says "Per-client stage pointer; skip/cancel/reschedule do not auto-rewind; after Пришёл advance (trainer may override)". Both builders comply.

**Builder A** stores `MacrocycleAssignment.currentStageIndex: int` — an index into the ordered `MacrocycleItem` list.
**Builder B** stores `currentItemId: uuid` — an FK to the item.

**What diverges**

- Macrocycles are shared, editable gym artifacts with no lock on them (`AD-7`). Reordering or deleting an item silently re-points A's integer index at a different template for **every** client on that macrocycle — a data-corruption class bug with no error and no audit trail; B's FK either follows the item or fails loudly.
- **Who advances is unowned.** `sessions` on complete, `workouts` on the transition to `attended`, and a `macrocycles` command are all defensible readings of "after Пришёл advance". Two of them wired at once double-advance and skip a stage; neither wired leaves the pointer frozen while trainers wonder why "next stage" never changes.
- Advance on a Workout that was **not** built from the current stage (`FR-10` allows an explicit exercise set) is unspecified — so an ad-hoc session can silently consume a macrocycle stage.
- Interaction with Hole 4: an abandoned Session must not advance the pointer, but only an owner rule can guarantee that.

**Missing/weak AD:** no AD fixes the pointer's representation, its behavior under item reorder/delete, or its single writer.

**Proposed rule — AD-7d (Stage pointer)**
> The per-client stage pointer is stored as `currentItemId` (FK to `MacrocycleItem`), never as a bare ordinal index, and any reorder or delete of macrocycle items must explicitly re-point or null it in the same transaction. It advances in exactly one place — the `workouts` transition to `attended`, in that same transaction, and only when the Workout was created from the current stage — plus an explicit trainer-override command; `sessions` and `macrocycles` must never move it.

---

## Also open (below the top 8, still worth an AD line)

| # | Axis | Divergence in one line | Proposed rule (condensed) |
| --- | --- | --- | --- |
| 9 | **Set modifier catalog & color domain** | `PRD` says custom colour «из RGB-матрицы» and conventions say "name+RGB", but `EXPERIENCE.md`/`DESIGN.md` restrict it to 6–8 pre-vetted accessible tokens — so one builder types `color: string` (free hex) and the other an enum; rename/delete semantics for a shared catalog are also unspecified. | Custom modifiers are a gym-scoped catalog whose colour is a **token from a fixed server-side palette** (not free RGB); modifiers are soft-archived, never hard-deleted, so historical Sets keep their label and colour. |
| 10 | **FSD layer import rules** | `AD-10` draws the dependency arrows but nothing enforces them: one builder imports `shared/api` directly from `pages`, another cross-imports slice-to-slice inside `entities`, and both "follow AD-10". | Layer order `app → pages → widgets → features → entities → shared` is machine-enforced (ESLint boundaries/steiger) in CI; cross-imports within a layer are forbidden (compose one level up), and generated `shared/api` may be imported only by `entities` and `features`. |
| 11 | **Soft-delete / deactivation** | `PRD` OQ-3 (archive a Client, disable a Trainer) is unowned: one builder hard-deletes with FK cascade — destroying the Sessions and Sets that `FR-2a`/`FR-18` call the gym's mandatory changelog — while another soft-deletes but forgets to filter login, leaving a fired trainer able to sign in. | Users are never hard-deleted: `deactivatedAt` on User, enforced by one global query filter plus an auth check; archived Clients disappear from the pool but keep a fully readable Дневник, and deactivation immediately invalidates that user's sessions and their held lock. |
| 12 | **OpenAPI dialect and drift gate** | `AD-2` fixes code-first export, but the stack table claims OpenAPI **3.1** while `@nestjs/swagger` emits **3.0.x** — and 3.0 `nullable: true` versus 3.1 `type: [x,'null']` generate different TypeScript, so one builder hand-patches the file (breaking "no hand-edited YAML") and the other commits 3.0. No AD names the CI drift command. | Declare the emitted dialect as whatever `@nestjs/swagger` produces (3.0.x) and generate types from that verbatim; CI runs the export and fails on any diff against the committed `backend/openapi/openapi.yaml`, so the file is never edited by hand. |
| 13 | **Invite reissue & admin password reset** | `EXPERIENCE.md` carries both as `[ASSUMPTION → architecture]`: does reissue invalidate the old token, is there a cap, what happens for an already-registered Client; is an admin reset a temp password or a link, and are the Client's existing sessions killed? | Reissue creates a new hashed token and marks all prior unconsumed invites for that Client consumed (old link dies immediately), and is rejected once the Client has registered; an Admin reset sets a one-time temporary password, forces a change on next login, and invalidates all of that Client's sessions. |

---

## Silent dimensions (no decision exists on either side)

These are not divergences between two readings — they are axes **nobody has written down**, where each builder will invent something and only integration will notice.

1. **Command idempotency beyond Sets** — `start session`, `redeem invite`, `acquire lock`, `assign workout`: double-tap on a flaky gym connection creates duplicates. Only invite redeem has atomicity language today.
2. **First Admin bootstrap** — nothing says how the initial Admin exists (seed script, env credentials, CLI). One builder ships an unreachable app, another a default password in the repo.
3. **Phone normalization and login case-folding** — "login **or** phone + password" requires a canonical stored form (E.164) and a uniqueness rule; raw-string storage makes login-by-phone fail on `+7` vs `8` and permits duplicate accounts.
4. **`sequenceIndex` allocation authority** — FE-assigned indices collide across two tabs; BFF-assigned indices need a defined per-session counter. `AD-8` names the column but not its owner.
5. **Superset group provenance** — does `supersetGroupId` come from the frozen template snapshot or is it formed ad hoc during the Session? Determines whether superset structure is editable mid-session.
6. **Editing a confirmed Set** — `EXPERIENCE.md` allows it («Сохранённые Подходы правятся тапом»); no rule says whether it overwrites the row or appends a revision, nor whether edits are still possible after the Session completes (history immutability vs FR-18).
7. **Pagination: "cursor **or** page+pageSize"** — the convention itself contains the fork; two modules will pick differently and the FE list components will not be reusable.
8. **Auth rate limiting / lockout** — login, invite redeem, and admin reset have no throttling rule despite `FR-33` handling personal data.
9. **Exercise deletion vs history** — deleting a catalogue Exercise referenced by past `SessionExercise` rows: cascade destroys the diary, restrict blocks the trainer. No rule.
10. **Heartbeat endpoint identity** — `AD-6` mandates a ≤60s heartbeat but does not name the endpoint, whether it is idempotent, or whether it doubles as the lock-extend call, so `sessions` and `clients-lock` may each ship one.

---

## What to change in the spine before distilling

1. Adopt **AD-8b** and amend `EXPERIENCE.md` in the same pass — an unresolved contradiction between two "final" artifacts is the single largest divergence risk (Hole 1).
2. Adopt **AD-6d/AD-6e/AD-6f** as a lock lifecycle block, including the atomic acquire statement and bounded TTL suspension (Holes 2, 4).
3. Adopt **AD-5c** and close the cookie/CSRF/origin question — it is a build-time decision, not a deploy-time one (Hole 3).
4. Adopt **AD-8d** Session state machine, then **AD-11** streak and **AD-7d** stage pointer, in that order: both derive from Session terminal states (Holes 4, 5, 8).
5. Adopt **AD-12** timezone and **AD-13** error envelope as conventions with normative force, not table rows (Holes 6, 7).
6. Fold items 9–13 into existing AD text, and resolve the ten silent dimensions with one line each — they are cheap now and expensive after the first story lands.

---

*Adversarial pre-distill pass, 2026-09-29. Complements `reviews/review-adversary.md` (different axes; H1–H8 there are not restated here).*
