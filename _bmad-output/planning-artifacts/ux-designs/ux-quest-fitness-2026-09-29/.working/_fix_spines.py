# -*- coding: utf-8 -*-
from pathlib import Path
import ftfy

ws = Path(r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\ux-designs\ux-quest-fitness-2026-09-29")


def fix_file(path: Path) -> None:
    original = path.read_text(encoding="utf-8-sig")
    backup = path.with_suffix(path.suffix + ".mojibake.bak")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
    fixed = ftfy.fix_text(original)

    if path.name == "DESIGN.md":
        fixed = fixed.replace("ink-soon: '#8A7A7C'", "ink-soon: '#7A6B6D'")
        fixed = fixed.replace("`{colors.ink-soon}` `#8A7A7C`", "`{colors.ink-soon}` `#7A6B6D` (**≈5.06:1**)")
        fixed = fixed.replace(
            "граница `{colors.border-hairline}`, 44 px",
            "граница `{colors.border-control}`, высота `{spacing.control-md}` (48 px)",
        )
        fixed = fixed.replace(
            "красный лейбл, 44 px",
            "красный лейбл, высота `{spacing.control-md}` (48 px)",
        )
        fixed = fixed.replace(
            "приглушённый лейбл (opacity 0.55) и подпись «Скоро»",
            "лейбл `{colors.ink-soon}` + подпись «Скоро» (без opacity)",
        )
        fixed = fixed.replace(
            "**5.84:1** на белом (не 6.2). На креме — **4.96:1**",
            "**≈6.18:1** на белом. На креме — **≈5.25:1**",
        )
        fixed = fixed.replace("status: draft", "status: final", 1)

    if path.name == "EXPERIENCE.md":
        fixed = fixed.replace("status: draft", "status: final", 1)

    path.write_text(fixed, encoding="utf-8", newline="\n")
    print(
        path.name,
        "Гильдия" in fixed,
        "Сессия" in fixed or "Тренер" in fixed,
        "Поток 5" in fixed if path.name == "EXPERIENCE.md" else "n/a",
        "7A6B6D" in fixed if path.name == "DESIGN.md" else "n/a",
    )


for name in ("DESIGN.md", "EXPERIENCE.md"):
    fix_file(ws / name)
