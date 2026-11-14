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
- **Theme with `theme()`, never an inline style.** Spread it onto an element
  (`<div {...theme("jungle")}>`): it sets `data-palette` (and `data-flipped`), and every `--cw-*`
  recipe inside follows. `paletteCss()` generates the CSS for every palette once, in the root
  layout. `theme()` takes a typed `PaletteId`, so a missing palette is a compile error, not a
  silent fallback. A dialog renders outside its page, so theme its `DialogContent` directly.
- **Plain pages are printed in one palette, flipped.** `GROUND` in `palettes.ts` (miami) is set on
  `<html>`: its `shadow` is the page, its `base` the type, with a still `ink` grain behind
  everything. `npm run check:contrast` checks the ground palette too. Never hardcode a ground.
- **A flipped field** (`theme(p, { flipped: true })`: the ground, Wavelength's field) inverts the
  colourway so type and rules print light, while `--loud`/`--on-loud` keep the loud ink. Primary
  and square buttons read `--loud`, so they stay the brightest thing on any surface.
- Fields (`Input`) take their palette's `primary` as fill and `--loud` as type; secondary buttons,
  panels and drawers on the ground take `--ground-*`.

### Print treatment

- Grain overlay, hard offset shadows, ~0.4° tilt. Nothing else: no aged paper, no worn edges.
- **No rounded corners, anywhere.** Every edge is square; the radius tokens are 0 and
  `npm run check:tokens` fails on a `rounded-*` utility or a non-zero `border-radius`.
- The hard offset shadow is `--cw-highlight`, and goes only on hero display type on a field. Never on
  body or small text.
- The bulb `MarqueeBanner` is a sign, not artwork.
- Emblems, not emoji, on a field.
- Drawers are opaque `--ground`.
- Never set `--btn-*` inline on a container; it overrides the button recipes.

### Recipes

| Recipe | What it is |
|---|---|
| `.mb-frame` | outer rule + field + dashed inner rule |
| `.mb-label` / `.mb-label-bleed` | a square, borderless card with a hard drop shadow (stitch it with `StitchBorder`); bleed is a full-screen play surface with no shadow |
| `.mb-band` | the near-black band that holds the primary action |
| `.mb-btn` + `.mb-btn-{primary,secondary,tertiary}` | one button, the same square solid shape and hard shadow as `.mb-square-btn`; hierarchy is palette only, so it reads in greyscale |
| `.mb-square-btn` | the one corner control: solid square, hard shadow, reads over photos |
| `.mb-display` / `.mb-display-sm` / `.mb-shadow` / `.mb-caps` | type |
| `.rail` | native scroll-snap swipe rail |
| `.mb-marquee` + `.mb-marquee-sign` | chasing-bulb sign (`MarqueeBanner`): the one turn instruction on a play surface |

**A component doesn't exist until it renders on `/style`.** One screenshot of that route verifies
the system.

### Mafia role cards and faces

- Each role's card photo lives at `public/roles/{mafia,doctor,villager}.jpg`
  (`src/content/role-art.ts`), dithered into the phase's inks. A missing file falls back to the
  drawn `RoleEmblem`. Drop PNGs in and run `npm run backgrounds`.
- Player faces are DiceBear `adventurer-neutral`, generated on the device from the player's name
  with a transparent background (`PlayerAvatar`), so only the features print over a palette ink.

### Stickers

- Curated by hand in the vault's `Cards/Gif Collection.md`; `npm run stickers` syncs exactly that
  list into `public/stickers` at the 200px rendition, with manifest and precache list.
