# -*- coding: utf-8 -*-
"""Close mock-agent spine gaps without touching encoding."""
from pathlib import Path

path = Path(
    r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\ux-designs\ux-quest-fitness-2026-09-29\DESIGN.md"
)
text = path.read_text(encoding="utf-8")

# Add button-secondary-session after button-secondary block if missing
needle = "  button-secondary:\n"
if "button-secondary-session:" not in text:
    # Insert after button-secondary block (before button-danger)
    old = """  button-secondary:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-control}'
    label-color: '{colors.ink-primary}'
    label-type: '{typography.button}'
    height: '{spacing.control-md}'
    radius: '{rounded.md}'
    padding-x: '{spacing.4}'
    pressed-background: '{colors.surface-sunken}'
    hover-background: '{colors.surface-sunken}'
    hover-media: '(hover: hover)'
  button-danger:"""
    new = """  button-secondary:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-control}'
    label-color: '{colors.ink-primary}'
    label-type: '{typography.button}'
    height: '{spacing.control-md}'
    radius: '{rounded.md}'
    padding-x: '{spacing.4}'
    pressed-background: '{colors.surface-sunken}'
    hover-background: '{colors.surface-sunken}'
    hover-media: '(hover: hover)'
  button-secondary-session:
    background: '{colors.surface-session-sunken}'
    border: '1px solid {colors.border-session}'
    label-color: '{colors.ink-on-session}'
    label-type: '{typography.button}'
    height: '{spacing.control-md}'
    radius: '{rounded.md}'
    padding-x: '{spacing.4}'
    pressed-background: '{colors.surface-session-raised}'
    note: 'Secondary on live Session only — never use light button-secondary on charcoal.'
  button-danger:"""
    if old not in text:
        raise SystemExit("button-secondary block not found exactly")
    text = text.replace(old, new, 1)

# Prose fixes
replacements = [
    (
        "- **`button-secondary`** — белая, граница `{colors.border-control}`, высота `{spacing.control-md}` (48 px). Носит **Пропустить**, **Перенести**, «Копировать ссылку», навигацию назад.",
        "- **`button-secondary`** — белая, граница `{colors.border-control}`, высота `{spacing.control-md}` (48 px). Носит **Пропустить**, **Перенести**, «Копировать ссылку», навигацию назад.\n"
        "- **`button-secondary-session`** — на live-Сессии вместо светлой secondary: фон `{colors.surface-session-sunken}`, граница `{colors.border-session}`, лейбл `{colors.ink-on-session}`. Носит «Завершить» и прочие не-primary действия на угле — белая secondary на Сессии запрещена (читалась бы как второй primary).",
    ),
    (
        "- **`tab-bar`** — нижняя навигация кабинета Клиента: 6 вкладок (Тренировки, Аналитика, Питание, Замеры, Ачивки, Абонемент). Активная — угольный лейбл + красный индикатор 2 px. Вкладки Этапа 2 — лейбл `{colors.ink-soon}` + подпись «Скоро» (без opacity), они нажимаются и ведут на `soon-stub`, а не выключены.",
        "- **`tab-bar`** — нижняя навигация кабинета Клиента: 6 вкладок, паттерн **иконка 24 px + короткий лейбл** (Тренировки, Аналитика, Питание, Замеры, Ачивки, Абонемент), высота бара 64 px. Активная — угольный лейбл + красный индикатор 2 px. Вкладки Этапа 2 — `{colors.ink-soon}` + «Скоро» (без opacity). При 200 % — иконка + подпись без обрезки (см. EXPERIENCE Responsive); равные ячейки только-текстом запрещены.",
    ),
    (
        "с красной рамкой 1 px",
        "с красной рамкой 2 px и текстовым маркером «Подход — сейчас»",
    ),
]

for a, b in replacements:
    if a not in text:
        print("WARN missing:", a[:60])
    else:
        text = text.replace(a, b, 1)
        print("OK:", a[:40])

path.write_text(text, encoding="utf-8", newline="\n")
print("written", path)
print("has secondary-session", "button-secondary-session" in text)
