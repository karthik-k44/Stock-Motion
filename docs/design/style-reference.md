# StockMotion marketing style

The landing and pricing pages follow the reference below: a white canvas, one orange accent that only marks the primary action, compressed Inter type, 12px radii, hairline borders instead of shadows, and dark bands only for full-bleed sections and the footer.

## How StockMotion adapts it

| Reference | StockMotion | Why |
|---|---|---|
| Ember `#ff5900` | Brand orange `#ff7900` (`--color-primary`) in the same role | The brand colour chosen for the product |
| White text on Ember buttons | Near-black text (`--color-primary-foreground`) on orange | White on `#ff7900` is 2.6:1 — below WCAG AA |
| Flecha display face | Inter 600 with the reference's tracking | Flecha isn't licensed; the reference's own prompt guide uses Inter 600 for heroes |
| Customer logo band on Fog | Use-case band on Fog | No customer logos to show yet — none are invented |
| Abyss footer | Abyss footer in the Watts layout (huge cropped wordmark) | Requested footer layout, reference colours |
| Plain white hero | White hero with a very soft warm glow | Requested light gradient, kept subtle |

Scope: these tokens are applied under `.landing` (see `src/frontend/styles/landing.css`), so the signed-in app keeps its own warm palette. Text sizes come from the `Text` component's landing variants.

---

# Brex — Style Reference
> White concrete, single ember — a clinical financial instrument where one orange spark does all the talking.

**Theme:** light

Brex is a white concrete financial workbench lit by a single orange ember. The interface lives on a near-pure white canvas with tight, almost compressed Inter type and a custom Flecha display face, and the only chromatic voice in the system is #ff5900 — a vivid ember that marks every primary action, link, and tab indicator without ever becoming decorative. Dark surfaces (#000710 footer, #15191e announcement bar) frame the bright body, creating a hard light/dark bookend that makes the white sections feel taller. Components are flat with a 12px radius, minimal shadows, hairline borders, and generous 48px section gaps.

## Tokens — Colors

| Name | Value | Role |
|------|-------|------|
| Ember | `#ff5900` | The single accent: primary actions, links, tab indicators |
| Abyss | `#000710` | Footer and full-bleed dark sections — near-black with a faint blue cast |
| Carbon | `#15191e` | Announcement bar, elevated dark chrome |
| Ink | `#000000` | Headings, body text, heavy borders |
| Paper | `#ffffff` | Page background, card surfaces |
| Fog | `#f3f3f7` | Secondary surface, inputs, banded sections |
| Mist | `#b9bbc6` | Hairline borders, dividers, disabled states |
| Steel | `#8b8d98` | Muted icons, placeholders, secondary nav text |
| Pewter | `#6f737b` | Captions, helper text |
| Graphite | `#60646c` | Secondary body text, subhead descriptions |

## Typography

**Inter** — the universal workhorse: body, navigation, buttons, inputs, labels, links. Aggressive negative tracking at every size (−0.01em at 24px and below, −0.02em at 36px, −0.025em at 48px, −0.03em at 72px). Weight 500 for UI chrome, 600 for emphasis. Features: `"calt" 0, "liga" 0, "ss03", "cv01", "cv05" 0, "cv10", "ss01" 0, "zero" 0`.

**Flecha** — display face for hero-level statements only (500, 1.11 leading). Inter handles all sub-headings.

| Role | Size | Line height | Tracking |
|------|------|-------------|----------|
| caption | 12px | 1.5 | −0.01em |
| body-sm | 14px | 1.43 | −0.01em |
| body | 16px | 1.5 | −0.01em |
| subheading | 20px | 1.4 | −0.01em |
| heading-sm | 24px | 1.33 | −0.01em |
| heading | 36px | 1.21 | −0.02em |
| heading-lg | 48px | 1.2 | −0.025em |
| display | 72px | 1 | −0.03em |

## Spacing, shapes, layout

- Base unit 8px: 8 · 16 · 24 · 32 · 48 · 72 · 80 · 160.
- Radius: 12px for buttons, inputs and cards; 6px for tags and chips. Never mix within a component group.
- Page max-width 1200px; section gaps 48–80px; card padding 24–32px; element gaps 8–16px.

## Components

- **Announcement bar** — full-bleed Carbon, centred 12px/500 white text with an inline Ember link.
- **Navigation** — white; wordmark in Ink; 14px/500 items; "Sign in" as a plain link; "Get started" as a filled Ember button (12px radius, 8×16 padding, 14px/600).
- **Ember CTA** — the single primary action. **Ghost link** — Ink text, 14px/500, with a small Ember icon.
- **Email capture** — white input, 1px Mist border, 12px radius, Steel placeholder, Ember button beside it.
- **Feature card** — white, 12px radius, 24–32px padding, no border; 20–24px/600 heading, 14–16px Graphite body.
- **Logo band** — Fog section, centred 36px/600 heading, monochrome logos.
- **Dark footer** — Abyss, wordmark in Paper, 14px link columns with 600 headers.

## Do

- Use the accent for exactly one purpose per region: the primary action.
- Apply Inter's negative tracking at every size.
- 12px radius on all interactive surfaces; 6px only for tags and chips.
- Section gaps 48–80px, card padding 24–32px.
- Paper canvas with Fog for section contrast; Abyss and Carbon only for dark frames.
- Graphite for paragraphs, Pewter for helper text; never Steel for anything longer than a label.

## Don't

- Introduce a second accent colour.
- Use shadows for card elevation — use Paper/Fog contrast and 1px Mist borders. Floating UI (menus, dialogs) is the only exception.
- Use the display face below 48px.
- Centre body paragraphs (headlines may be centred).
- Use the accent for inline text links — inline links are Ink with an underline.
- Mix radius values within a component group.

## Surfaces

| Level | Name | Value |
|-------|------|-------|
| 0 | Paper canvas | `#ffffff` |
| 1 | Fog section | `#f3f3f7` |
| 2 | Card surface | `#ffffff` |
| 3 | Dark chrome | `#15191e` |
| 4 | Abyss footer | `#000710` |
