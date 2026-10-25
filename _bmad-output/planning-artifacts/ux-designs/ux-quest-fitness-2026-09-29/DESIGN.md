---
name: Quest Fitness — Гильдия
description: Визуальная система внутреннего инструмента зала Quest Fitness. Mobile-first web. Тёплый светлый продукт, тёмная live-Сессия, один красный акцент в кадре.
status: final
project: quest-fitness
updated: 2026-09-29
document_output_language: Russian
sources:
  - ../../prds/prd-quest-fitness-2026-09-29/prd.md
  - ../../prds/prd-quest-fitness-2026-09-29/design-brief-guild.md
  - ../../../../docs/project-spec.md
  - imports/Quest-Fitness-Rebranding.pptx
colors:
  # Dark brutal override 2026-10-09 (PO: чёрный брутализм, wow; один красный сохранён)
  surface-app: '#0A0909'
  surface-card: '#141212'
  surface-cream: '#1C1919'
  surface-sunken: '#050404'
  surface-raised: '#1C1919'
  ink-primary: '#F5F0EB'
  ink-muted: '#9A908C'
  ink-soon: '#7A726E'
  ink-inverse: '#0A0909'
  accent-red: '#C33F46'
  accent-red-pressed: '#A7333A'
  accent-apricot: '#C9895A'
  ink-error: '#E8A0A4'
  border-hairline: '#2A2424'
  border-control: '#5A5250'
  border-subtle: '#2A2424'
  border-strong: '#F5F0EB'
  surface-session: '#050404'
  surface-session-raised: '#141212'
  surface-session-sunken: '#000000'
  ink-on-session: '#F5F0EB'
  ink-on-session-muted: '#9A908C'
  border-session: '#3A3333'
typography:
  display:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: '-0.2px'
  title:
    fontFamily: Rubik
    fontSize: 20px
    fontWeight: 700
    lineHeight: 26px
  body:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  meta:
    fontFamily: Rubik
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: '0.2px'
  button:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: 600
    lineHeight: 20px
  numeric:
    fontFamily: Rubik
    fontSize: 32px
    fontWeight: 700
    lineHeight: 36px
    note: 'tabular-nums — вес, повторения, таймеры, тоннаж'
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter: 16px
  margin-mobile: 16px
  margin-wide: 24px
  touch-min: 48px
  control-md: 48px
  control-lg: 56px
  bottom-cta-zone: 64px
  content-max: 640px
  breakpoint-md: 768px
  viewport-min-width: 360px
  viewport-min-height: 640px
components:
  button-primary:
    background: '{colors.accent-red}'
    label-color: '{colors.ink-inverse}'
    label-type: '{typography.button}'
    height: '{spacing.control-lg}'
    radius: '{rounded.md}'
    padding-x: '{spacing.5}'
    pressed-background: '{colors.accent-red-pressed}'
    hover-background: '{colors.accent-red-pressed}'
    hover-media: '(hover: hover)'
    disabled-background: '{colors.border-subtle}'
    disabled-label: '{colors.ink-muted}'
  button-secondary:
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
  button-danger:
    background: transparent
    border: '1px solid {colors.accent-red}'
    label-color: '{colors.accent-red}'
    label-type: '{typography.button}'
    height: '{spacing.control-md}'
    radius: '{rounded.md}'
    padding-x: '{spacing.4}'
    pressed-background: '{colors.surface-cream}'
    hover-background: '{colors.surface-cream}'
    hover-media: '(hover: hover)'
  focus-ring:
    width: 2px
    offset: 2px
    light-inner: '{colors.ink-inverse}'
    light-outer: '{colors.ink-primary}'
    session-inner: '{colors.ink-primary}'
    session-outer: '{colors.ink-on-session}'
    note: 'Global :focus-visible only — components do not invent their own rings.'
  bottom-cta:
    container-background: '{colors.surface-card}'
    container-background-session: '{colors.surface-session-raised}'
    border-top: '1px solid {colors.border-subtle}'
    border-top-session: '1px solid {colors.border-session}'
    padding: '{spacing.3} {spacing.4}'
    button-height: '{spacing.control-lg}'
    button-width: '100%'
    column-max: '{spacing.content-max}'
    note: 'Fixed strip centers with content column; button = 100% of column not viewport. Optional full-bleed bar background only.'
    safe-area: 'env(safe-area-inset-bottom)'
  client-row:
    background: '{colors.surface-card}'
    min-height: '{spacing.control-lg}'
    padding: '{spacing.3} {spacing.4}'
    radius: '{rounded.md}'
    gap: '{spacing.3}'
    name-type: '{typography.body}'
    meta-type: '{typography.meta}'
    meta-color: '{colors.ink-muted}'
    divider: '1px solid {colors.border-subtle}'
    hover-background: '{colors.surface-sunken}'
    hover-media: '(hover: hover)'
    cursor: pointer
  lock-badge:
    background: '{colors.surface-cream}'
    border: '1px solid {colors.border-control}'
    label-color: '{colors.ink-primary}'
    label-type: '{typography.meta}'
    icon-color: '{colors.ink-muted}'
    icon-size: 16px
    height: 24px
    hit-area: '{spacing.touch-min}'
    radius: '{rounded.full}'
    padding-x: '{spacing.2}'
    note: 'In client-row — decorative only. Interactive hit ≥48px only in Client card header.'
  streak-chip:
    background: '{colors.accent-apricot}'
    label-color: '{colors.ink-primary}'
    number-type: '{typography.title}'
    label-type: '{typography.meta}'
    radius: '{rounded.md}'
    padding: '{spacing.3} {spacing.4}'
    zero-background: '{colors.surface-cream}'
    zero-label-color: '{colors.ink-muted}'
  tab-bar:
    background: '{colors.surface-card}'
    border-top: '1px solid {colors.border-subtle}'
    height: 64px
    label-type: '{typography.meta}'
    label-color: '{colors.ink-muted}'
    active-label-color: '{colors.ink-primary}'
    active-indicator: '2px solid {colors.accent-red}'
    soon-label-color: '{colors.ink-soon}'
    soon-caption: 'Скоро'
    icon-size: 24px
    pattern: 'icon + short label'
    labels: 'Тренировки / Аналитика / Питание / Замеры / Ачивки / Абонемент'
    column-max: '{spacing.content-max}'
    note: 'Icon above label; no truncation. No opacity on soon tabs.'
  status-pill:
    height: 24px
    radius: '{rounded.full}'
    label-type: '{typography.meta}'
    waiting-bg: '{colors.surface-sunken}'
    waiting-ink: '{colors.ink-primary}'
    arrived-bg: '{colors.accent-apricot}'
    arrived-ink: '{colors.ink-primary}'
    missed-bg: '{colors.surface-cream}'
    missed-ink: '{colors.ink-muted}'
    cancelled-bg: '{colors.surface-cream}'
    cancelled-ink: '{colors.ink-muted}'
    note: 'Word is the differentiator; background is secondary cue — never red for status.'
  input:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-control}'
    focus-border: '1px solid {colors.ink-primary}'
    error-border: '1px solid {colors.ink-error}'
    height: '{spacing.control-lg}'
    radius: '{rounded.sm}'
    padding-x: '{spacing.4}'
    value-type: '{typography.body}'
    value-color: '{colors.ink-primary}'
    placeholder-color: '{colors.ink-muted}'
  field-error:
    color: '{colors.ink-error}'
    type: '{typography.meta}'
    placement: 'below field'
  bottom-sheet:
    background: '{colors.surface-card}'
    background-session: '{colors.surface-session-raised}'
    radius: '{rounded.lg}'
    handle-color: '{colors.border-control}'
    max-height: '85vh'
    padding: '{spacing.4}'
  confirm-dialog:
    background: '{colors.surface-card}'
    radius: '{rounded.lg}'
    padding: '{spacing.5}'
    title-type: '{typography.title}'
    body-type: '{typography.body}'
    layout: 'primary confirm + secondary alternative (Перенести when streak at risk)'
  trainer-menu:
    trigger: 'header icon button'
    pattern: 'bottom-sheet'
    background: '{colors.surface-card}'
    radius: '{rounded.lg}'
    row-height: '{spacing.control-lg}'
    row-type: '{typography.body}'
    row-color: '{colors.ink-primary}'
    divider: '1px solid {colors.border-subtle}'
    note: 'Same sheet on all widths — never becomes sidebar, top-nav, or hover dropdown.'
  soon-stub:
    background: '{colors.surface-cream}'
    radius: '{rounded.lg}'
    padding: '{spacing.6} {spacing.5}'
    title-type: '{typography.title}'
    title-color: '{colors.ink-primary}'
    body-type: '{typography.body}'
    body-color: '{colors.ink-muted}'
    sign-size: 32px
    sign-color: '{colors.border-hairline}'
  session-set-logger:
    background: '{colors.surface-session-raised}'
    active-border: '2px solid {colors.accent-red}'
    active-marker: 'Подход — сейчас'
    idle-border: '1px solid {colors.border-session}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
    value-type: '{typography.numeric}'
    value-color: '{colors.ink-on-session}'
    field-label-type: '{typography.meta}'
    field-label-color: '{colors.ink-on-session-muted}'
    stepper-size: '{spacing.touch-min}'
    logged-row-background: '{colors.surface-session-sunken}'
    modifier-dot-size: 10px
    note: 'Active set: 2px red + text marker (red alone is 2.92:1 on raised — not sole cue).'
  rest-timer:
    background: '{colors.surface-session-sunken}'
    track-color: '{colors.border-session}'
    progress-color: '{colors.accent-red}'
    value-type: '{typography.numeric}'
    value-color: '{colors.ink-on-session}'
    caption-type: '{typography.meta}'
    caption-color: '{colors.ink-on-session-muted}'
    radius: '{rounded.md}'
    height: '{spacing.7}'
  invite-share:
    background: '{colors.surface-cream}'
    radius: '{rounded.lg}'
    padding: '{spacing.5} {spacing.4}'
    url-background: '{colors.surface-card}'
    url-border: '1px dashed {colors.border-control}'
    url-type: '{typography.meta}'
    url-color: '{colors.ink-muted}'
    ttl-type: '{typography.meta}'
    ttl-color: '{colors.ink-muted}'
    action-height: '{spacing.control-lg}'
---

# Quest Fitness — DESIGN (Гильдия)

## Brand & Style

Quest Fitness — не витрина и не SaaS-лендинг, а рабочий инструмент одного зала. Тренер держит телефон мокрой рукой между подходами, клиент открывает кабинет раз в неделю посмотреть, что было. Всё, что не помогает в этот момент, — лишнее.

Отсюда посадка: тёплая бумажная светлая поверхность в «кабинетной» части продукта (пул, шаблоны, карточка клиента, кабинет клиента) и глубокий угольный экран в live-Сессии, где важны читаемость на свету зала и отсутствие визуального шума. Один красный акцент в кадре — он всегда означает «вот сюда» или «вот сейчас».

Гильдия живёт в продукте тремя вещами: знак (гиря с драконом) как иконка приложения и монохромная метка 24–32 px в шапке; квестовый язык в заголовках, пустых состояниях и «Скоро»-заглушках; тёплая палитра. Никаких фэнтези-иллюстраций, свитков и рамок внутри продуктовых экранов — метафора несётся словами и цветом, не декором.

Кнопки действий говорят по-человечески: **Начать**, **Пропустить**, **Отменить**, **Перенести**, **Освободить**. Квестовые формулировки на кнопках запрещены.

## Colors

Палитра — подписанный свотч ребрендинга плюс минимум рабочих производных.

- **Уголь `#241C20`** (`{colors.ink-primary}` / `{colors.surface-session}`) — основной текст на светлом и основная поверхность live-Сессии. Один и тот же цвет держит обе роли: продукт и Сессия ощущаются как одна система, вывернутая наизнанку.
- **Продуктовый фон `#FAF7F4`** (`{colors.surface-app}`) — фон всех светлых экранов. Карточки и строки — **белые** `{colors.surface-card}`, за счёт этого список читается без теней.
- **Крем `#F6EBDD`** (`{colors.surface-cream}`) — моменты «до и после работы»: онбординг, регистрация по приглашению, пустые состояния, «Скоро»-заглушки, итог Сессии. Крем не используется как фон рабочих списков — он сигнализирует паузу.
- **Красный `#C33F46`** (`{colors.accent-red}`) — **канон, единственный красный**. Один активный акцент в видимой области: primary CTA, текущий подход/упражнение в Сессии, прогресс таймера отдыха, активная вкладка. Красный не раскрашивает статусы в списках и не используется как фон больших областей. `#B33743` из рабочих слайдов — не канон, в продукт не попадает.
- **Абрикос `#EFB68C`** (`{colors.accent-apricot}`) — бейджи и дорожки прогресса: чип Стрика, статус «Пришёл», заполнение шкал. **Никогда не текст**: на белом абрикос даёт контраст 1.8:1 и нечитаем.
- **Приглушённый текст `#6E5D60`** (`{colors.ink-muted}`) — подписи, мета, вторичные значения. **≈6.18:1** на белом. На креме — **≈5.25:1**. Для «Скоро»-вкладок — отдельный `{colors.ink-soon}` `#7A6B6D` (**≈5.06:1**) (**≥ 4.5:1** на белой карточке); **opacity для вкладок не используем**.
- **Границы:** `{colors.border-control}` `#8F8083` — интерактивные контролы (≥ 3:1 на белом). `{colors.border-hairline}` `#BFAFB1` — только чипы/декор, не единственный аффорданс кнопки. `{colors.border-subtle}` `#E3D9D5` — разделители списков.
- **Красный на Сессии:** на `{colors.surface-session}` ≈ 3.26:1 (нетестовый OK); на `{colors.surface-session-raised}` ≈ **2.92:1** — поэтому активный Подход всегда дублируется текстом «Подход — сейчас» и рамкой 2 px, не одной красной линией.

Тёмные токены Сессии: `{colors.surface-session-raised}` `#302428` для карточек логгера, `{colors.surface-session-sunken}` `#1B1416` для уже записанных подходов и подложки таймера, `{colors.ink-on-session}` `#F6EBDD` для основного текста (высокий контраст к углю), `{colors.ink-on-session-muted}` `#BFAFB1` для подписей (7.9:1), `{colors.border-session}` `#3D2E32` для разделителей. Красный на угле даёт 3.3:1 — его роль на тёмном только нетекстовая: рамка активного подхода, заливка прогресса, точка «идёт запись». Текст на красной заливке — белый (5.1:1).

Запрещено: любые градиенты, полупрозрачные «стеклянные» слои, фиолетовый и неон, свечения, цветовое кодирование статусов за пределами описанного набора.

## Typography

**Rubik** — весь интерфейс. Bold (700) — заголовки, Regular (400) — текст, Medium/SemiBold (500/600) — мета и кнопки. Никакой второй гарнитуры; леттеринг логотипа живёт отдельно от UI и в продукт не попадает.

Роли:

| Роль | Размер / вес | Где |
|---|---|---|
| `{typography.display}` | 28/34, 700 | Квестовые заголовки экранов-моментов: регистрация, итог Сессии, пустые состояния |
| `{typography.title}` | 20/26, 700 | Заголовки экранов и карточек, имя Клиента, название Упражнения в Сессии |
| `{typography.body}` | 16/24, 400 | Основной текст, значения полей, строки списков |
| `{typography.meta}` | 13/18, 500 | Статусы, даты, подписи полей, TTL, автор Сессии |
| `{typography.button}` | 16/20, 600 | Все кнопки |
| `{typography.numeric}` | 32/36, 700, tabular | Вес, повторения, RPE, таймеры, тоннаж |

Правила: без капса, без разрядки заголовков, без курсива. Цифры в Сессии и в истории — только табличные, чтобы значения не «прыгали» при инкременте. Минимальный размер текста в продукте — 13 px; подписи мельче не рисуем.

## Layout & Spacing

Шкала 4 / 8 / 12 / 16 / 24 / 32 / 48 px. **Mobile-first:** одна колонка всегда — канонический макет зала. `{spacing.content-max}` (640 px) + авто-центрирование действуют **на всех ширинах** (не только ≥ `{spacing.breakpoint-md}`): колонка физически не шире 640 px. Боковые поля: `{spacing.margin-mobile}` 16 px ниже `{spacing.breakpoint-md}` (768 px); `{spacing.margin-wide}` 24 px на ≥ breakpoint. Фон вокруг колонки на ≥ `{spacing.breakpoint-md}` — `{colors.surface-sunken}`, колонка на `{colors.surface-app}` с hairline-рамкой 1 px `{colors.border-hairline}` и радиусом `{rounded.lg}`, внешний отступ 24 px («телефон на столе», без тени); ниже breakpoint колонка = экран на `{colors.surface-app}`. Закреплённые `bottom-cta` и `tab-bar` выравниваются по той же колонке (кнопка/вкладки = 100 % колонки, не вьюпорта). Минимум вьюпорта: `{spacing.viewport-min-width}` × `{spacing.viewport-min-height}`. Приёмка — по мобильному кадру. Без сайдбаров и многоколоночных дашбордов.

Вертикальный ритм: `{spacing.5}` между смысловыми блоками экрана, `{spacing.3}` внутри блока, `{spacing.2}` между меткой и значением. Строки списков не сжимаются ради количества — минимальная высота строки `{spacing.control-lg}` 56 px.

Нижняя зона действия: экраны с одним главным действием (Ожидание, Сессия, регистрация, приглашение) отдают низ под закреплённый `bottom-cta` высотой 56 px в контейнере `{spacing.bottom-cta-zone}` + safe-area. Контент скроллится под ним, CTA не уезжает. Один экран — одна работа: на Сессии в кадре одно упражнение и один подход.

Тач-зоны — не меньше `{spacing.touch-min}` 48 px, степперы веса/повторов — ровно 48 px и разнесены, чтобы попадать большим пальцем одной рукой.

## Elevation & Depth

Теней в продукте нет. Иерархия строится тоном: `{colors.surface-app}` → `{colors.surface-card}` для карточек, `{colors.surface-session}` → `{colors.surface-session-raised}` в Сессии. Разделители — hairline 1 px.

Единственное исключение — закреплённый `bottom-cta` и шторки (bottom sheet): у них верхняя граница 1 px и, при скролле контента под ними, тень `0 -1px 0 {colors.border-subtle}` — ровно настолько, чтобы читалось «поверх», без мягкого ореола.

Модальные слои — не глубже одного уровня. В Сессии модалок нет вовсе: выбор Модификатора, замена упражнения и завершение открываются шторкой снизу, не перекрывая текущий подход полностью.

## Shapes

`{rounded.sm}` 8 px — поля ввода, степперы, мелкие чипы. `{rounded.md}` 12 px — кнопки, строки-карточки, блок логгера. `{rounded.lg}` 16 px — крупные «моментные» блоки: крем-панели, «Скоро»-заглушка, итог Сессии. `{rounded.full}` — только для бейджей-пилюль (`lock-badge`, статусы) и аватарных кружков.

Логика: чем крупнее поверхность, тем мягче угол; интерактив держится на 12 px, чтобы кнопка не выглядела ни планшетом iOS, ни прямоугольником админки. Иконки — линейные, 1.5 px штрих, 24 px сетка. Эмодзи вместо иконок запрещены. Знак Гильдии — только иконка приложения, шапка (24–32 px, монохром `{colors.ink-primary}` или `{colors.ink-on-session}`) и деликатный водяной знак в «Скоро»-заглушке цветом `{colors.border-hairline}`.

## Components

- **`button-primary`** — красная заливка `{colors.accent-red}`, белый лейбл, 56 px, радиус 12 px, ширина 100 % в нижней зоне. В кадре допустима **одна** такая кнопка. Нажатие — `{colors.accent-red-pressed}`, без сдвига и без масштаба. Disabled — серо-бежевая заливка `{colors.border-subtle}` и приглушённый лейбл.
- **`button-secondary`** — белая, граница `{colors.border-control}`, высота `{spacing.control-md}` (48 px). Носит **Пропустить**, **Перенести**, «Копировать ссылку», навигацию назад.
- **`button-secondary-session`** — на live-Сессии вместо светлой secondary: фон `{colors.surface-session-sunken}`, граница `{colors.border-session}`, лейбл `{colors.ink-on-session}`. Носит «Завершить» и прочие не-primary действия на угле — белая secondary на Сессии запрещена (читалась бы как второй primary).
- **`button-danger`** — прозрачная, красная граница и красный лейбл, высота `{spacing.control-md}` (48 px). Носит **Отменить** и **Освободить**. Выделяется формой, а не заливкой: правило «один красный фон в кадре» остаётся в силе.
- **`bottom-cta`** — закреплённая нижняя полоса: белая в продукте, `{colors.surface-session-raised}` в Сессии, верхний hairline, паддинг 12/16, safe-area снизу. Максимум один primary + один secondary в ряд (60/40), иначе — только primary.
- **`client-row`** — строка Пула клиентов: имя `{typography.body}`, справа мета `{typography.meta}` (статус ближайшей Тренировки, дата), при занятости — `lock-badge` в правом верхнем углу строки. Занятая строка не серая и не выключенная: она открывается на чтение, блокируется только правка.
- **`lock-badge`** — пилюля 24 px: иконка замка 16 px + имя занявшего Тренера, крем-фон, hairline. В карточке Клиента разворачивается в строку с таймером TTL 30 мин и кнопкой **Освободить** (`button-danger`).
- **`streak-chip`** — абрикосовый блок с крупным числом `{typography.title}` и подписью `{typography.meta}` углём. При Стрике 0 — крем-фон и приглушённый текст: обнулённый стрик не кричит красным.
- **`tab-bar`** — нижняя навигация кабинета Клиента: 6 вкладок, паттерн **иконка 24 px + короткий лейбл** (Тренировки, Аналитика, Питание, Замеры, Ачивки, Абонемент), высота бара 64 px. Активная — угольный лейбл + красный индикатор 2 px. Вкладки Этапа 2 — `{colors.ink-soon}` + «Скоро» (без opacity). При 200 % — иконка + подпись без обрезки (см. EXPERIENCE Responsive); равные ячейки только-текстом запрещены.
- **`soon-stub`** — крем-панель 16 px: квестовый заголовок, одна строка объяснения приглушённым текстом, водяной знак Гильдии 32 px. Никаких заглушечных графиков, скелетонов и «демо-данных».
- **`session-set-logger`** — карточка текущего подхода на `{colors.surface-session-raised}` с красной рамкой 2 px и текстовым маркером «Подход — сейчас». Три поля (вес / повторения / RPE) крупными табличными цифрами, степперы 48 px по бокам значения. Записанные подходы уходят в компактную ленту на `{colors.surface-session-sunken}`; Модификатор виден точкой 10 px его цвета слева от строки. Суперсет отображается как связка со сплошной левой линейкой `{colors.border-session}`; таймер отдыха внутри связки не запускается.
- **`rest-timer`** — горизонтальная полоса 48 px под логгером: трек `{colors.border-session}`, заливка `{colors.accent-red}`, крупное значение, подпись «Отдых». Истечение — смена цифры и вибрация, без полноэкранного перехвата.
- **`invite-share`** — крем-панель с URL в белом поле с пунктирной рамкой, крупной кнопкой копирования 56 px и строкой TTL («ссылка живёт 1 сутки»). URL усечён по середине и не переносится на три строки.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Один красный акцент в видимой области | Красить красным статусы, бейджи и заголовки |
| Абрикос — только бейджи и дорожки прогресса | Абрикосовый текст (1.8:1 на белом) |
| Тёмный уголь как фон live-Сессии по умолчанию | Светлая Сессия «для единообразия» |
| Квестовый язык в заголовках, пустых и «Скоро»-состояниях | Квестовый язык на кнопках действий |
| Знак Гильдии 24–32 px, монохром, шапка и иконка | Фэнтези-иллюстрации, свитки, драконы внутри экранов |
| Иерархия тоном и hairline-границами | Тени, «стекло», mesh-градиенты, свечения |
| Линейные иконки 24 px, штрих 1.5 px | Эмодзи вместо иконок |
| Нижняя закреплённая CTA 56 px, одна работа на экран | Сетки крупных «hero»-карточек и модалки поверх Сессии |
| Табличные цифры в логгере и истории | Пропорциональные цифры в счётчиках и таймерах |
| Одна колонка, поля 16 px, контент ≤ 640 px | Многоколоночные дашборды на мобильном |
