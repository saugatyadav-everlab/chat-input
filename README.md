# Chat Input · Beam Prototype

Vite + React + TypeScript prototype of the Figma **Chat input field** component, with the
[`border-beam`](https://beam.jakubantalik.com/) library driving the glow and
[`dialkit`](https://joshpuckett.me/dialkit) for live tuning.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## What's here

- **White / black background** that follows the OS light/dark preference. Override with the
  ☀/☾ toggle in the top-right of the chip bar.
- **The chat-input component centered on screen**, recreated from the Figma variants.
- **The field is interactive** — `State` is derived from real input, not a chip:
  - empty + not focused → **Rest**
  - focused + empty → **Active**
  - has text → **Filled**
  - submit pressed → **Processing** — the text **clears immediately** and the beam
    runs until it finishes (~`Processing Sec`), then the field resets to Rest.
    The stop button cancels.
- **Recipient** is picked from the in-field pill (opens the Figma dropdown: **Eva** / **Everlab
  Care Team**). The pill reads "Eva" / "Care team"; its width animates on switch, **anchored
  right** (Framer Motion, timed by DialKit's `Switch Transition`).
- **Chips (top bar)**:
  - `Type` — Multi line / Single line
  - `Effect` — how the beam renders:
    - **Full border** — switch flash + processing both use `md` (full border glow)
    - **Sweep + halo** — switch flash uses `line` (bottom sweep), processing uses
      `pulse-outside` (full halo)
- The input container is a fixed **720px**, always centered.
- (Style is always Tertiary; attachment is hidden.)

## The beam (always container-level, Eva-only)

The beam always wraps the container boundary. It appears only for **Eva**:
- **switch to Eva** → a temporary flash that fades on its own (`Eva Signal Sec`)
- **sending an Eva message** → runs through Processing, then goes away on reset

Care team never shows a beam. `Preview` (DialKit) forces it on for tuning.
- **DialKit panel (bottom-right)** tunes the beam in real time:
  - `Placement` — **Auto (by state)** (default), Submit button, Container boundary, Both, None.
    Auto encodes the product rule:
    - Care team → **no halo**
    - Copilot + Rest/Active/Filled → halo on the **submit button**
    - Copilot + Processing → **bottom sweep** on the container boundary
    *(the Figma shows the halo as a static gradient; here it's the real `border-beam`)*
  - `Behavior` — **Static · runs on Processing** (default: a frozen beam that only
    animates while `State = Processing`) or **Always running**
  - `Size` — `md` (full border), `sm`, `line` (bottom sweep), `pulse-inner`, `pulse-outside`
  - `Color Variant` — the 4 `border-beam` palettes (colorful / mono / ocean / sunset)
  - `Hue Shift` — 0–360° rotation of the whole palette (see "Colors" below)
  - `Beam Theme`, `Active`
  - `Strength`, `Duration`, `Brightness`, `Saturation`, `Hue Range`

> DialKit persists its settings to `localStorage`. To reset to defaults, clear site storage.

## Colors

`border-beam` has **no hex-color prop and no per-color hue** — each of its 4 palettes is a
hardcoded array of `rgba()` blobs, and the only color knobs are: which palette, one global
hue rotation (`--beam-hue-base`), and saturation. So a true "N colors, each with its own
hue" model is **not renderable on border-beam** and isn't faked here. Instead:

- `Colors` — the 4 real palettes framed by how many colors each holds
  (Mono grayscale / 2-tone ocean / warm sunset / spectrum colorful)
- `Hue Shift` — one global hue rotation of the whole palette, written to `--beam-hue-base`
  on the beam wrapper ([`src/BeamLayer.tsx`](src/BeamLayer.tsx))

For genuine independent hue-per-color, the beam has to be a custom conic-gradient (not the
library) — see the note at the bottom.

## 1:1 with Figma

Icons are the **exact Figma vectors** ([`src/components/icons.tsx`](src/components/icons.tsx)),
normalised to `currentColor` so they theme correctly; the attachment thumbnail is the real
exported asset (`public/icons/media.png`). Spacing, radii, and type follow the Figma tokens.

## Static vs running

The **Behavior** control decides when the beam animates. In "Static · runs on Processing"
mode the beam is shown but its CSS animations are paused (`.beam-freeze` in
[`src/index.css`](src/index.css)) until `State = Processing`; "Always running" keeps it
animating in every state.

## Where the beam is wired

- **Submit button** — `border-beam` wraps the send button inside
  [`src/components/ChatInput.tsx`](src/components/ChatInput.tsx).
- **Container boundary** — `border-beam` wraps the whole field in
  [`src/App.tsx`](src/App.tsx).

Beam settings flow from the DialKit panel in `App.tsx` → `BeamSettings`
([`src/beam.ts`](src/beam.ts)) → both wrap points.
