# -*- coding: utf-8 -*-
from pathlib import Path

ws = Path(r"C:\Users\mrspy\Desktop\AIBot\quest-fitness\_bmad-output\planning-artifacts\ux-designs\ux-quest-fitness-2026-09-29")
raw = (ws / "DESIGN.md").read_bytes()
# find Brand
idx = raw.find(b"## Brand")
chunk = raw[idx : idx + 120]
(ws / ".working" / "_hex.txt").write_text(
    " ".join(f"{b:02x}" for b in chunk) + "\n" + repr(chunk),
    encoding="utf-8",
)

# Try ftfy
try:
    import ftfy
    text = (ws / "DESIGN.md").read_text(encoding="utf-8-sig")
    fixed = ftfy.fix_text(text)
    (ws / ".working" / "_ftfy-sample.txt").write_text(
        f"guild={'Гильдия' in fixed}\n" + fixed[idx if False else fixed.find('## Brand'): fixed.find('## Brand')+300],
        encoding="utf-8",
    )
    print("ftfy ok", "Гильдия" in fixed)
except Exception as e:
    print("ftfy", type(e).__name__, e)
