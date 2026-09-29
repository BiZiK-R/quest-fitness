# Adversarial Architecture Review — Quest Fitness Spine

**Artifact:** `ARCHITECTURE-SPINE.md` (draft, 2026-09-29)  
**Reviewer lens:** adversarial (compliant-but-incompatible sibling units)  
**PRD:** `prd-quest-fitness-2026-09-29/prd.md` + addendum (high-level spot check)

---

## Executive verdict

**CONDITIONAL — spine is directionally PRD-aligned, but several ADs are under-specified at module boundaries.** Two independent implementers can each cite AD-1…AD-10 verbatim and still ship a system that violates FR-2b, FR-9/18, or FR-13 at integration time. Close the holes below with **tightened AD text or new AD-11+** (ownership, ordering, lifecycle hooks), not with informal README notes.

---

## Method

For each finding: two **one-level-down** units (Nest modules and/or FSD slices) that **individually satisfy** the cited ADs, yet **jointly** produce clashing data shapes, dual ownership, or divergent mutation paths. Each pair implies a **specific AD amendment**.

---

## PRD alignment (high level)

| PRD topic | Spine (AD) | Alignment | Gap |
| --- | --- | --- | --- |
| Invite TTL **1 day** | AD-5 | **Match** (explicit 1 day, hashed token, single-use) | No canonical field (`expiresAt` vs `createdAt+24h`); no timezone for “сутки”; reissue vs extend semantics absent |
| Client exclusive lock, **30 min idle**, session extends, release rules | AD-6 | **Match** on numbers and intent | “Active session extends lock” not tied to a **single lifecycle owner**; “leave card” vs open session is FE-defined |
| Template **LWW** + warn on conflict; lock **not** on templates | AD-7 | **Match** | **When** snapshot is taken (start vs complete) unspecified → FR-9 assumption break |
| Live sets **persist per confirm**; reload safe | AD-8 | **Match** | Set **ordering** for supersets not owned → diary vs session disagree |
| Timers: **client `endsAt`**, survive tab background | AD-8 + PRD NFR | **Match** | No rule that session **duration timer** is non-authoritative (OK) vs accidental server persistence split across FE features |
| Stage 2 **not deep** | AD-9 | **Match** | Stubs + placeholders OK; **risk:** placeholder columns wired into skeleton queries without AD guard |
| Membership debit Stage 2 | AD-9 + PRD FR-11 | **Match** (no-op hooks) | No AD saying **where** hook lives → double debit or skip |

Overall PRD skeleton scope (§6.1) is reflected in capability map and out-of-scope list. Misalignment risk is **integration semantics**, not missing features.

---

## Adversarial pairs (holes)

### Hole 1 — Lock extension vs session lifecycle (AD-6 × AD-8)

**Units:** `backend/modules/clients-lock` vs `backend/modules/sessions`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **clients-lock** | AD-6: row per `clientId`, heartbeat on `lastActivityAt`, “active Session extends lock” | Extends TTL only when `ClientLock.activeSessionId` is set **and** heartbeat endpoint is called. “Release on leave card” clears lock when SPA navigates away from client route (heartbeat stops). |
| **sessions** | AD-8: Session + Sets in Postgres; AD-10: domain on backend | `POST /sessions/start` creates `Session` in `in_progress` and writes sets; assumes lock was acquired earlier; **does not** write `activeSessionId` on lock (lock module’s job). |

**Clash:** Trainer starts session, then switches browser tab to another client (or SPA unmounts client layout). Lock module releases on “leave card”; session module still has `in_progress` Session and accepts set writes. Trainer B acquires lock and starts a second session or mutates program — **two mutation paths on one Client**, violating FR-2b while both modules “follow” AD-6/AD-8.

**Root cause:** AD-6 names `activeSessionId` but does not state **which module must set/clear it**, nor that **in_progress Session without matching lock holder** is a forbidden state.

**Suggested AD tightening (AD-6b or AD-11):**  
- **Single writer:** only `sessions` (or only `clients-lock` via session callbacks — pick one) may set/clear `activeSessionId`.  
- **Invariant:** any mutating command on Client program/session requires `lock.holderTrainerId === actor` **and** `(no in_progress Session) OR (Session.id === lock.activeSessionId)`.  
- **Release rule:** “leave card” must **not** release if `activeSessionId` points to `in_progress` Session; release on session terminal state only.

---

### Hole 2 — Session snapshot timing (AD-7 × AD-7)

**Units:** `backend/modules/templates` (+ `sessions` read path) vs `backend/modules/sessions` (write/complete path)

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **templates** | AD-7: LWW on `WorkoutTemplate.version`; completed Session has immutable snapshot | Interprets “snapshot” as **pointer**: `SessionExercise` stores `exerciseId` + planned reps/weight copied **at session start** from template/workout assignment. |
| **sessions** | AD-7: “Completed Session persists immutable snapshot” | Materializes `SessionExercise` rows **at complete** from **current** template version or live workout assignment. |

**Clash:** Mid-session template edit (allowed — no lock on templates) changes exercise list/order. Trainer logs sets against UI built from start-time plan; complete path persists different exercise list. Diary/history (FR-18) shows exercises/sets that **do not match** what was performed; FR-9 “изменение Шаблона не ломает завершённые Сессии” fails for in-flight sessions in subtle ways.

**Root cause:** AD-7 mandates immutability **after complete** but not **snapshot boundary** (start vs first set vs complete).

**Suggested AD tightening (AD-7b):**  
- On `Session` transition to `in_progress`, **freeze** `SessionExercise` graph (copy from assignment/template at start); subsequent template edits never alter rows for that session id.  
- Set rows always reference frozen `SessionExercise.id`, not live template lines.

---

### Hole 3 — Invite TTL and consumption (AD-5)

**Units:** `backend/modules/invites` vs `backend/modules/auth`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **invites** | AD-5: opaque token hashed in DB, TTL 1 day, single-use | Stores `tokenHash`, validates expiry as `createdAt + interval '1 day'` in SQL; marks invite `consumedAt` on success. |
| **auth** | AD-5: registration via invite; passwords argon2id | Registration DTO validates `expiresAt` from invite row; issues session; **creates User first**, then calls invites to consume (async/event). |

**Clash A (shape):** OpenAPI exposes invite metadata with only `createdAt` — FE shows wrong expiry.  
**Clash B (ownership):** Double-submit registration: two requests pass TTL check before `consumedAt` set → **two users** or one user + orphan Client slot; “single-use” broken despite both modules citing AD-5.

**Root cause:** AD-5 does not require **one transaction** (validate + consume + create user) nor canonical **`expiresAt` UTC** column.

**Suggested AD tightening (AD-5b):**  
- Persist `expiresAt` (server-set at issue, default now+24h).  
- Registration endpoint owns atomicity: `SELECT … FOR UPDATE` on invite row or unique partial index on `consumedAt IS NULL`.

---

### Hole 4 — Set ordering and superset semantics (AD-8 × conventions table)

**Units:** `backend/modules/sessions` vs `backend/modules/diary`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **sessions** | AD-8: each confirmed Set written immediately; superset rest is client UX over **server-ordered set log** | Orders sets by `createdAt` only; no superset group id in schema. |
| **diary** | AD-8 + “Diary = read model over Session + Sets” | Reconstructs rounds using `sequenceIndex` + `supersetGroupId` on Set (added in diary DTO mapper assumptions). |

**Clash:** Same DB rows sort differently in live session replay vs diary history → FR-15 “полный круг суперсета” and FR-18 “полная история … порядок” disagree across screens after reload.

**Root cause:** AD-8 mandates persistence but not **canonical ordering key** for logged sets.

**Suggested AD tightening (AD-8b):**  
- Every Set has stable `ordinal` (session-wide or per-exercise) and optional `supersetGroupId`; writes reject gaps on confirm.  
- Diary and sessions **read the same columns**, no divergent reconstruction.

---

### Hole 5 — “Mutating program” without lock scope (AD-6 × capability map)

**Units:** `backend/modules/workouts` vs `backend/modules/macrocycles`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **workouts** | AD-6: mutating session requires lock; schedule actions in `workouts` | `reschedule`, `skip`, `cancel` do not require lock (interpreted as calendar ops, not “program”). |
| **macrocycles** | AD-6 + conventions: stage pointer per client | `PATCH` stage pointer / assignment is “program edit” → requires lock. |

**Clash:** Trainer A holds lock, runs session. Trainer B (no lock) uses workouts to **cancel/reschedule** the same pending workout or manipulates assignment via macrocycles if any endpoint is exposed without guard consistency. Partial program state changes while A logs sets — not simultaneous editors on same UI, but **concurrent mutation paths** on shared Client aggregates.

**Root cause:** AD-6 lists “mutating client program/session” without enumerating **which commands** in `workouts` vs `macrocycles` vs `templates` require lock vs not.

**Suggested AD tightening (AD-6c):**  
- Table: command → lock required (yes/no). At minimum: any change to **MacrocycleAssignment**, workout’s exercise source, or in-flight assignment while `in_progress` Session exists → **403** without lock.  
- Reschedule/cancel on **pending** workout only when no `in_progress` Session for that client (or holder matches).

---

### Hole 6 — Template LWW conflict UX split (AD-7 × AD-2)

**Units:** `frontend/src/features/edit-template` vs `backend/modules/templates`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **templates (BE)** | AD-7: 409 on version conflict | Returns 409 + body `{ currentVersion, serverPayload }`. |
| **edit-template (FE)** | AD-2/AD-10: no invented DTOs; mirror UX | On 409, shows generic toast; retry sends **same** client payload without merge (interprets LWW as “retry overwrites” without explicit user confirm). |

**Clash:** PRD requires **predupреждение** before last-write-wins. Backend is compliant; FE is compliant with AD-10 (“mirror UX”) but product behavior is silent overwrite — not a runtime corruption, but **spec hole** if QA tests FR-8 against UI.

**Suggested AD tightening (AD-7c):**  
- 409 response schema mandatory fields + FE **must** block retry until explicit “Overwrite” action (contract test).

---

### Hole 7 — Stage-2 stub leakage (AD-9 × AD-3)

**Units:** `backend/modules/memberships` (stub) vs `backend/modules/workouts`

| Unit | Literal AD compliance | Behavior |
| --- | --- | --- |
| **memberships (stub)** | AD-9: hooks no-op until Stage 2 | Exposes `MembershipDebitPort.debitOnAttended()` implemented as log-only no-op. |
| **workouts** | AD-9 + FR-11: statuses without membership module | Calls debit port on **attended**; also calls duplicate inline “analytics hook” placeholder updating a `membership_ledger` table from AD-9 “schema placeholder”. |

**Clash:** Skeleton writes to placeholder ledger or double-invokes hooks → Stage-2 migration pain; violates “do not change skeleton behavior.”

**Root cause:** AD-9 allows placeholders but not **forbidden writes** or **single hook registry**.

**Suggested AD tightening (AD-9b):**  
- Placeholder tables **must not** be written in skeleton code paths.  
- Exactly one `WorkoutLifecycleHook` interface registered in `workouts` / `sessions` complete pipeline.

---

## Frontend / backend boundary (secondary)

### Hole 8 — Dual timer state (AD-8 × FSD)

**Units:** `frontend/src/features/live-session` vs `frontend/src/widgets/session-timer`

Both use client-only `endsAt` per AD-8. One persists to `sessionStorage` keyed by `sessionId`, the other keeps React state only. **AD-8 satisfied per feature**, but reload shows workout timer reset while rest timer survives — PRD NFR “таймер тренировки … переживает уход вкладки” partially broken.

**Suggested AD tightening (AD-8c):** One shared `sessionTimerStore` in `entities/session` (or explicit: both timers use same persistence policy keyed by `sessionId`).

---

## OpenAPI pipeline (AD-2 ambiguity)

Spine open question #3: hand YAML vs codegen from Nest. Two teams:

- **Team API:** Nest decorators → generated YAML into `backend/openapi/openapi.yaml`  
- **Team FE:** edits `backend/openapi/openapi.yaml` by hand for speed  

Both claim AD-2. **Clash:** duplicate routes, drift on error schemas (`409` lock vs version). **Tighten AD-2:** one pipeline, CI diff fails if decorator export ≠ committed YAML.

---

## Positive observations (non-exhaustive)

- Modular monolith module list matches PRD skeleton capabilities.  
- AD-4 correctly kills responsible-trainer model.  
- Diary as read model (no separate write aggregate) reduces duplicate Set ownership.  
- Online-required set writes align with PRD assumption deferring offline queue.

---

## Recommended next actions

1. Add **AD-11 Integration invariants** (lock ↔ session ↔ mutation matrix) — highest priority for FR-2b.  
2. Freeze **snapshot at session start** in AD-7.  
3. Atomic **invite registration** + `expiresAt` in AD-5.  
4. **Set ordinal + supersetGroupId** in AD-8.  
5. Resolve OpenAPI **single pipeline** in AD-2 (close open question #3 as decision, not question).  
6. AD-9 **no writes to placeholder tables** in skeleton.

---

## Summary table

| ID | Severity (integration) | Units | Missing AD |
| --- | --- | --- | --- |
| H1 | Critical | clients-lock ↔ sessions | Lock/session lifecycle owner |
| H2 | High | templates ↔ sessions | Snapshot boundary |
| H3 | High | invites ↔ auth | TTL field + atomic consume |
| H4 | Medium | sessions ↔ diary | Set ordering schema |
| H5 | Medium | workouts ↔ macrocycles | Lock-required command matrix |
| H6 | Low (UX/spec) | edit-template ↔ templates | 409 + explicit LWW confirm |
| H7 | Medium (future) | memberships ↔ workouts | Stub write prohibition |
| H8 | Low | live-session ↔ session-timer | Timer persistence policy |

---

*Review generated: adversarial architecture pass, 2026-09-29.*
