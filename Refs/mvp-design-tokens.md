# MVP Design Tokens

Last updated: 2026-03-25
Status: active

This token set translates the Luminous Ops brief into a light-only product UI for the MVP.

## Intent

- technical and operational, not friendly HR SaaS
- industrial light surfaces with disciplined contrast
- restrained luminous accents, used as signal not decoration
- reusable across recruiter and candidate routes

## Color

- `--background`, `--surface-0`, `--surface-1`, `--surface-2`: layered off-white and steel-tinted neutrals for app canvas and product surfaces
- `--foreground`: dark steel ink for dense operational reading
- `--primary`: deep system navy for main actions and shell anchors
- `--highlight`, `--highlight-soft`: cool cyan luminous accent for focus, active states, and subtle glow
- `--destructive`: warm industrial warning red, reserved for blocking or failing states
- `--panel-line`, `--panel-strong`, `--grid-line`: structural lines for shells, cards, side panels, and system dividers

## Surface model

- `ops-shell`: framed product container with glass-light industrial treatment
- `ops-panel`: default card/panel surface
- `ops-panel-strong`: higher emphasis card/panel surface
- `bg-ops-canvas`: reusable light canvas fill
- `bg-ops-grid`: low-contrast system grid for shell and background layers

## Radius

- base radius stays at `1rem`
- large product surfaces should prefer `rounded-3xl` or nearby values
- pills and badges stay fully rounded to preserve scanability

## Shadow

- `--shadow-panel`: default elevation for working surfaces
- `--shadow-panel-strong`: emphasized cards and side panels
- `--shadow-shell`: app frame elevation

## Type

- `--font-manrope`: high-density product copy and headings
- `--font-ibm-plex-mono`: metadata, labels, and operational badges
- `ops-kicker`: mono metadata utility for section labels and system markers

## Usage rules

- keep luminous treatments subtle and repeatable
- avoid full-surface saturated color blocks except for primary action emphasis
- prefer structural contrast from line, depth, and density before adding more color
- reuse the same surface and badge logic across recruiter and public apply routes
