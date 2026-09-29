# Version / Pin Intentionality Check

**Artifact:** `ARCHITECTURE-SPINE.md` (Stack + AD-12/13/Deferred)  
**Lens:** do the named pins look deliberate vs accidental / invented?  
**Checked:** npm registry, 2026-09-29

---

## Verdict

**PASS — pins are intentional.**

All five named pins exist on npm and match a coherent policy: **pin current stable of each line; refuse Prisma 8 RC.** No fabricated versions.

| Pin | npm today | Intentional? |
| --- | --- | --- |
| `@nestjs/core` **12.1.1** | `latest` = 12.1.1 | Yes — current Nest 12 stable |
| Prisma / `@prisma/client` **7.10.0** | `prisma@latest` = **8.0.0-rc.19** | Yes — explicit anti-RC pin; Deferred + Stack note match reality |
| React **19.3.0** | `latest` = 19.3.0 | Yes — current React 19 |
| Vite **8.3.1** | `latest` = 8.3.1 | Yes — current Vite 8 (engines: `^20.19 \|\| >=22.12`) |
| `openapi-typescript` **7.13.0** | `latest` = 7.13.0 | Yes — current codegen; pairs with pinned `openapi-fetch` 0.17.0 |

---

## Flags (non-blocking)

1. **`npx prisma` trap (HIGH if ignored at deploy)** — spine correctly pins 7.10.0, but AD-13 wording `prisma migrate deploy` can still pull CLI 8 RC via unpinned `npx`. Prefer `npm exec prisma@7` / local `devDependency` binary. Already hinted in Deferred; deserve one AD-13 sentence.
2. **TypeScript `5.9.x` while npm `typescript` latest is 7.x** — caution toward TS 7 is written; leaving 5.9 without a spike result vs Nest-12 defaults (often TS 6) is the softest pin in the table.
3. **Node 22 Maintenance LTS** — compatible with Nest 12 / Vite 8; Active LTS 24 is Deferred — OK if conscious, not “forgot to upgrade.”
4. **Satellite deps unpinned** — router, Vitest, `@nestjs/swagger`, argon2 lib, static proxy image: AD-12 says “pin exactly,” Stack only covers the spine. Scaffold risk, not a false pin.

---

## Bottom line

Named Stack pins are real, current (or deliberately behind an RC), and internally consistent. Only operational follow-up: harden Prisma CLI invocation so the anti-8-RC decision cannot be undone by `npx`.
