# Adversarial Final Pass — New Holes Only

**Artifact:** `ARCHITECTURE-SPINE.md` after AD-5…AD-18  
**Lens:** two agent builders, each citing adopted ADs literally, still diverge  
**Scope:** **only** gaps **not** already closed by AD-5…AD-18 (prior H1–H8 / pre-distill holes treated as closed)  
**Max findings:** 5

---

## Verdict

**PASS with residual risks.**

AD-5…AD-18 close the previous critical integration axes (lock lifecycle, cookie/CSRF/origin, set idempotency + online-only, session terminals, streak fold, gym TZ, snapshot/pointer, error codes, TDD). No new **blocking** sibling-unit clash remains. Residual risks below are thin ownership/silent-dimension gaps — worth one-liners before stories, not a spine rewrite.

---

## Residual risks (≤5, not covered by AD-5…AD-18)

### R1 — Who writes `Workout.status` on Session complete `[MEDIUM]`

AD-15 says `completed` → Workout `attended`; AD-7 says only `workouts` advances the stage pointer on that transition. Neither names the **orchestrator**: `sessions.complete` calling into `workouts`, vs both modules writing `Workout.status`. Dual writers → double stage advance or `attended` without pointer move.

### R2 — AD-3 “no foreign tables” vs `diary` read-model `[MEDIUM]`

AD-3 forbids modules reading other domains’ tables; Structural Seed defines Diary as a read-model over `Session`/`Set`. Builder A injects `SessionsService`; Builder B uses Prisma on session tables “because it’s a read-model.” Same data, different module boundaries and future extractability.

### R3 — `sequenceIndex` assignment authority `[LOW-MEDIUM]`

AD-8 requires `sequenceIndex` + client `setId` upsert, but not **who allocates** the index. FE-assigned indices collide across two tabs; BFF-assigned needs a per-session counter. Ordering can still diverge under concurrent confirms despite idempotent `setId`.

### R4 — Phone/login canonical form `[LOW-MEDIUM]`

AD-5 allows “login **or** phone + password” without E.164 / case-fold / uniqueness rules. `+7…` vs `8…` and case variants → duplicate accounts or failed login-by-phone while both builders “follow AD-5.”

### R5 — Command idempotency beyond Sets `[LOW]`

Sets are covered (AD-8). `start session`, `acquire lock`, `assign workout` lack client idempotency keys. Double-tap on flaky gym Wi‑Fi → `SESSION_ALREADY_ACTIVE` / duplicate workouts depending on race timing. Error codes exist; request-level idempotency does not.

---

## Explicitly not re-opened

Lock acquire/TTL/release, cookie/CSRF/same-site, invite consume+`expiresAt`, snapshot-at-start, LWW+409, abandoned/completed fan-out for streak/membership, streak-as-derived, gym TZ, online-only sets, OpenAPI single pipeline — treated as **closed** by current AD-5…AD-18 text.

---

## Recommendation

Ship spine as build-substrate. Optionally fold R1–R5 into conventions / one AD footnote before FR-13 / FR-11 stories; no new AD number required unless R1 is left ambiguous into implementation.
