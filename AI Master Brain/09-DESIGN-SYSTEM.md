# SDDS Design System Contract

This file operationalises the iDWELL-inspired reference. It is not a marketing-site design guide.

## 1. Experience character

- serious;
- calm;
- efficient;
- information-dense without crowding;
- tax-practice specific;
- predictable;
- fast;
- low-noise.

## 2. Layout

- Desktop sidebar: 248px expanded.
- Top utility bar: 60px.
- Desktop content padding: 24px.
- Main panel gap: 16px.
- Compact table row: 48px.
- Comfortable row: 56px.
- Panel padding: 16–20px.
- Stable page width; no nested decorative app frames.

## 3. Visual tokens

Use CSS variables or a central Tailwind token layer.

### Surfaces

- app background: cool neutral;
- panel: white or near-white;
- muted panel: subtle cool neutral;
- selected row/card: low-intensity brand tint;
- borders: visible but restrained.

### Brand

Use one SDDS-owned blue accent family for active navigation, links, focus, and primary actions. Do not use gradients as the primary system language.

Suggested initial tokens, subject to one visual calibration task:

- brand-50 `#EFF6FF`
- brand-100 `#DBEAFE`
- brand-600 `#2563EB`
- brand-700 `#1D4ED8`
- brand-800 `#1E40AF`
- text-primary `#172033`
- text-secondary `#4B5565`
- text-muted `#7A8495`
- border `#DDE3EC`
- surface-app `#F4F6F9`
- surface-panel `#FFFFFF`

Semantic status colours are separate from brand colour and always paired with text/icon labels.

## 4. Typography

- One interface family, preferably the framework-approved local/system option.
- Page title: 24px / strong.
- Section title: 16–18px / semibold.
- Body: 13–14px.
- Metadata: 11–12px.
- Use tabular numerals for money, acknowledgement numbers, and invoice numbers.
- Sentence case labels.

## 5. Shape and depth

- Inputs/buttons: 8px radius.
- Panels: 10–12px radius.
- Status badges: compact pills only.
- Minimal shadow; prefer border and background hierarchy.
- No glassmorphism, glow, floating illustration, or excessive rounded cards.

## 6. Shell

### Sidebar

- SDDS branding only;
- grouped operational navigation;
- one clear route-aware active state;
- account/logout separated at bottom;
- deliberate collapsed state on smaller screens.

### Top utility bar

Priority order:

1. global search;
2. assessment-year selector;
3. Privacy Mode;
4. page primary action;
5. compact account control.

Do not display decorative security/system badges.

## 7. Operational page pattern

1. Compact page header.
2. Context and primary action.
3. Search, filters, and view switcher.
4. Main board/table/list/checklist.
5. Details drawer or full record view.
6. Supporting timeline/history.

## 8. Dashboard pattern

Use:

- compact KPI/attention strip;
- workflow distribution with links;
- urgent work table;
- financial exceptions;
- follow-up queue;
- recent activity.

Avoid decorative charts unless a time-series question is operationally useful and backed by real data.

## 9. States

Every data-driven component has:

- loading skeleton;
- empty state with next action;
- zero state distinct from missing data;
- recoverable error state;
- disabled/pending mutation state;
- success feedback.

## 10. Accessibility and responsiveness

- visible keyboard focus;
- semantic labels and controls;
- non-colour status cues;
- adequate contrast;
- touch targets at least practical mobile size;
- no horizontal page overflow;
- tables may use controlled internal scroll or mobile record cards;
- preserve core actions and status visibility on tablet/mobile.
