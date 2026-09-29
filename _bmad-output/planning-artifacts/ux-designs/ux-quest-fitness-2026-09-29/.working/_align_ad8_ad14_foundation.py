# -*- coding: utf-8 -*-
from pathlib import Path

# --- EXPERIENCE Foundation note ---
exp = Path(
    r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\ux-designs\ux-quest-fitness-2026-09-29\EXPERIENCE.md"
)
text = exp.read_text(encoding="utf-8")
old = "Главный контрапункт — **SM-C1**:"
new = (
    "Запись Подходов — **online-required** (architecture **AD-8** / **AD-14**): "
    "сеть обязательна; индикатор `сохранено` · `сохраняется` · `не сохранилось, повторить`; "
    "клиентской offline-очереди, sessionStorage-буфера и фонового flush нет.\n\n"
    + old
)
if "online-required" not in text:
    if old not in text:
        raise SystemExit("Foundation marker missing")
    text = text.replace(old, new, 1)
    exp.write_text(text, encoding="utf-8", newline="\n")
    print("EXPERIENCE Foundation note added")
else:
    print("EXPERIENCE Foundation already has online-required")

# --- ARCHITECTURE: mark deferred done + soften AD-14 precedence ---
arch = Path(
    r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\architecture\architecture-quest-fitness-2026-09-29\ARCHITECTURE-SPINE.md"
)
a = arch.read_text(encoding="utf-8")
a2 = a.replace(
    "- **Rule (приоритет артефактов):** Текст `EXPERIENCE.md` про offline-очередь Подходов («уйдут сами», «N подходов в очереди») **не является нормативным** относительно этого spine — при расхождении побеждает spine (AD-8 + AD-14). UX-артефакт подлежит правке отдельным проходом (см. Deferred / Open Questions); реализация ведётся по spine.",
    "- **Rule (приоритет артефактов):** Норматив — этот spine (AD-8 + AD-14). `EXPERIENCE.md` согласован (2026-09-29): offline-очередь убрана; индикатор `сохранено` · `сохраняется` · `не сохранилось, повторить`. При будущем расхождении побеждает spine.",
)
a2 = a2.replace(
    "| Правка `EXPERIENCE.md` под AD-8/AD-14 (убрать «уйдут сами» / очередь) | Spine нормативен; UX правится отдельным пассом до story FR-13 |",
    "| Правка `EXPERIENCE.md` под AD-8/AD-14 (убрать «уйдут сами» / очередь) | **Done** 2026-09-29 — UX согласован; story FR-13 может резаться |",
)
# Open questions item 4
a2 = a2.replace(
    "4. Поправить `EXPERIENCE.md`: убрать offline-очередь (AD-8/AD-14); UX-копирайт для «Взять клиента», незавершённой Сессии, индикатора сохранения.",
    "4. ~~Поправить `EXPERIENCE.md`: offline-очередь / индикатор сохранения (AD-8/AD-14)~~ **Done** 2026-09-29. Остаётся: UX-копирайт для «Взять клиента», незавершённой Сессии — если ещё открыто.",
)
if a2 != a:
    arch.write_text(a2, encoding="utf-8", newline="\n")
    print("ARCHITECTURE updated")
else:
    print("ARCHITECTURE no change (patterns miss?)")
