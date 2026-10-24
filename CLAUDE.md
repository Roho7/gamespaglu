# Games Paglu — working notes for Claude

`gamespaglu.com`. Phone-as-aid for games played **in person**. Sibling of officepaglu.com.
Specs live in the Obsidian vault (`~/Documents/MAIN/OBSIDIAN/OB_BRAIN/Cards/`): `Games Paglu Spec.md`,
plus one spec per game (`Girgit Spec.md`, `Wavelength Spec.md`), which override the parent spec.

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · no accounts · **offline-first, except rooms**.

Rooms (Girgit) use a Socket.IO server on Fly (`server/`) and Postgres in the shared officepaglu
Supabase project, in a `gp` schema behind a scoped `gp_app` role. Everything else is backendless and
works with no signal.

```bash
npm run dev
npm run check
npx tsc --noEmit && npx eslint src --max-warnings=0 && npx next build
```

---

## Where things live

- `components/` by feature (`home`, `generator`, `girgit`, `wavelength`, `scoreboard`), shared chrome in `layout`,
  stitched motifs in `stitch`, drawn art in `artwork`, primitives in `ui`.
- `lib/deck` is data and draw logic, `lib/wavelength` the Wavelength rules, `lib/hooks` every `use-*` hook, `lib/palettes.ts` the colour
  system. `shared/` holds data and protocol the socket server also reads.
- Import with `@/`, never relative paths. Name files and exports for what they are
  (`CategoryHeroRail`, `HoldToRevealSecret`), not where they sit.

## Code style

- **No inline comments.** No `//`, `/* */` or JSX `{/* */}`. Only `/** */` doc comments on exported
  declarations and tool directives (`eslint-disable`, `@ts-`, `check-tokens-ignore`).
- **Icons come from `lucide-react`**, never text glyphs like `←` `→`. Size them `size-[1em]`; inside
  running text add `inline align-[-0.125em]`, since Tailwind makes every `svg` a block.

## UX invariants

Check every screen against these before calling it done.

1. **Look tells the truth.**
   - Different kinds of thing look different; things that look the same are the same kind.
   - Adjacency claims relatedness. Unrelated items go in separate regions.
   - One entry point per destination per screen.
   - No teasers. Nothing ships that points at a feature that doesn't exist.
2. **Never render a control that does nothing.** Gate controls on a real capability flag
   (`hasRangeFilter`, `hasSpicy`), and derive offered chips from the data (`availableCountries`).
3. **An empty result is never silent.** If a pool filters to zero, the primary action is disabled
   with an explanation. `npm run check:decks` exercises every category × filter and must pass.
4. **Play surfaces are not forms.** One accent field, one huge primary action, at most three small
   controls. Rules and prose live in `src/content/guides.ts` and `/how-to-play`; settings live in the
   briefing or a drawer.
5. **The primary action is reachable by a thumb without scrolling.** Stick it to the bottom.
6. **Verify visually.** Screenshot at **375×812** and look at it. Exercise every category page and
   every drawer, not only the one you changed.

## Design system — 80s poster

**Direction.** Saturated 80s movie-poster prints. Each screen is one loud ink, one pop ink and
near-black. The picture carries the screen: home cards are full-bleed dithered photos in the
category palette, with the band below naming the game. Simple, clean, professional, never cluttered.

### Colour

- A palette is five inks in `src/lib/palettes.ts`, picked by typed `PaletteId`:
  `base` (loud ink, grounds), `highlight` (pop ink, offset under dark type), `secondary` (rules),
  `primary` (dark ink, accents and display), `shadow` (near-black, text and band).
- **Components never name a colour.** Use `--cw-*` or the page tokens. `npm run check:tokens`
  enforces it; `npm run check:contrast` enforces the ink ratios.
- **No dark mode.** The palettes are the theme.
- **Plain pages are printed in one palette, flipped.** `GROUND` in `palettes.ts` (miami) sets the
  ground: its `shadow` is the page, its `base` the type, its `primary` the panels, with a still
  `ink` grain behind everything (root layout). `groundVars()` sets this on `<html>`, so drawers
  inherit it. `npm run check:contrast` checks the ground palette too. Never hardcode a ground.
- **A flipped field uses `flippedVars()`** (the ground, Wavelength's field): the colourway inverts so
  type and rules print light, but `--loud`/`--on-loud` keep the loud ink. Primary buttons and
  square buttons read `--loud`, so they stay the brightest thing on any surface. A flipped field
  must set `color: "var(--cw-shadow)"` in the same `style` object, because children inherit the
  computed colour, not the variable.
- Anything on the ground (secondary buttons, inputs, panels, drawers) takes ink from `--ground-*`.

### Print treatment

- Grain overlay, hard offset shadows, ~0.4° tilt. Nothing else: no aged paper, no worn edges.
- The hard offset shadow is `--cw-highlight`, and goes only on hero display type on a field. Never on
  body or small text.
- One marquee (starburst) per screen, behind artwork only, never behind type.
- Emblems, not emoji, on a field.
- Drawers are opaque `--ground`.
- Never set `--btn-*` inline on a container; it overrides the button recipes.

### Recipes

| Recipe | What it is |
|---|---|
| `.mb-frame` | outer rule + field + dashed inner rule; inner radius is `--dot-radius`, override it on other radii |
| `.mb-label` / `.mb-label-bleed` | a square, borderless card with a hard drop shadow (stitch it with `StitchBorder`); bleed is a full-screen play surface with no shadow |
| `.mb-band` | the near-black band that holds the primary action |
| `.mb-btn` + `.mb-btn-{primary,secondary,tertiary}` | one button; hierarchy is palette only, so it reads in greyscale |
| `.mb-square-btn` | the one corner control: solid square, hard shadow, reads over photos |
| `.mb-display` / `.mb-display-sm` / `.mb-shadow` / `.mb-caps` | type |
| `.rail` | native scroll-snap swipe rail |

**A component doesn't exist until it renders on `/style`.** One screenshot of that route verifies
the system.

### Stickers

- Curated by hand in the vault's `Cards/Gif Collection.md`; `npm run stickers` syncs exactly that
  list into `public/stickers` at the 200px rendition, with manifest and precache list.
- A category without a sticker (or a failed load) falls back to its drawn emblem.

## Layout

- **There is no top bar.** Inner pages render `PageCorners`: a square back button top-left, and
  top-right any page controls plus the scoreboard. Home cards (`HomeGameCard`) carry a square `?` to
  their guide top-right instead.
- **The scoreboard is a bottom sheet behind a square button, not a destination.** `PageCorners`
  shows it on every inner game screen; `/scoreboard` exists only as a deep-link and SEO page.
  Home, the generator and Wavelength have no scoreboard button (Wavelength's score is game state).
- **One control shape.** Corner and drawer controls are all `.mb-square-btn`; icons from
  `lucide-react`, `?` set in display type.
- The generator opens on a briefing (how to play, settings) in stitched panels. Generate starts a
  round; during one the band is Regenerate (60%) and Settings (40%).
- Home is full-screen `HomeGameCard`s snapping vertically, one per game, never a sideways rail.
  The category `.rail` lives on `/who-am-i`. No carousel library.
- **Room screens with no signal say so** and withdraw every action. The service worker precaches
  them, so otherwise they render a plausible frozen board.

## Content and data

- **Popularity over locality.** Curate for how widely the whole room recognises a name. `worldwide`
  is the default; there is no language axis.
- For people and characters, `countries` means "where this is a household name". Movies use origin.
- People filter on two independent axes, `types` and `era`. `era: "evergreen"` matches both Classic
  and Modern. Chips derive from the other active filters, and stranded selections are pruned in
  `savePrefs`.
- **`Entry.spicy`** marks people famous *for* a crime or scandal. Off by default, rendered only where
  `hasSpicy`, never drawn into Girgit grids.
- One curated set, many games. Every `Entry` has a stable slug `id`; games reference ids, and
  `npm run check:grids` fails on a dangling one.
- `scripts/build-data.mjs` writes `*.candidates.json`; a human pass promotes them to
  `shared/data/*.json`.
- `number` has no deck. Entry helpers are total over `CategoryId`; don't cast it away.
- Draws use the shuffle-bag (`src/lib/deck/shuffle-bag.ts`), without replacement, keyed by category
  and filter signature.
- The reveal (`src/components/ui/fit-text.tsx`) breaks only at spaces. Measure text with a `Range`,
  never `scrollWidth`. `absolute inset-0` ignores parent padding, so inset with real values.

## Architecture

- Game logic is pure TS with no React (`src/lib/deck/draw.ts`, the Girgit engine,
  `src/lib/wavelength/engine.ts`), so the server can
  call it.
- Local persistence goes through `src/lib/state-adapter.ts` and is read via `usePersisted`
  (`useSyncExternalStore`). Never copy localStorage into state inside an effect.
- **Every new `gp` table gets an RLS policy in the same migration** (`server/migrations/003_rls.sql`).
  Prove access with a write, not a read.

## SEO

- Ranking content lives in `/how-to-play` guides with `HowTo` + `FAQPage` JSON-LD. Play surfaces are
  not SEO surfaces, and drawer copy doesn't count.
- The opportunity is long-tail filter pages, not head terms (spec §6).
