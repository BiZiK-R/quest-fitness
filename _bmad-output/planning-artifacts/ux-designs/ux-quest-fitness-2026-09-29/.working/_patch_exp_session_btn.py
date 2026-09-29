# -*- coding: utf-8 -*-
from pathlib import Path

exp = Path(
    r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\ux-designs\ux-quest-fitness-2026-09-29\EXPERIENCE.md"
)
text = exp.read_text(encoding="utf-8")
row = "| `button-secondary-session` | Сессия (рядом с primary) | Только на тёмной Сессии: «Завершить» и др. не-primary. Светлый `button-secondary` на угле запрещён. |\n"
anchor = "| `button-danger` «Освободить» |"
if "button-secondary-session" not in text and anchor in text:
    text = text.replace(anchor, row + anchor, 1)
    exp.write_text(text, encoding="utf-8", newline="\n")
    print("EXPERIENCE patched")
else:
    print("skip", "button-secondary-session" in text)
