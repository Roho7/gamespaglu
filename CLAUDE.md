# Games Paglu — working notes for Claude

`gamespaglu.com`. Phone-as-aid for games played **in person**. Sibling of officepaglu.com.
Full spec: `Cards/Games Paglu Spec.md` in the Obsidian vault (`~/Documents/MAIN/OBSIDIAN/OB_BRAIN/`).

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · no backend · no accounts · offline-first.

```bash
npm run dev
npx tsc --noEmit && npx eslint src --max-warnings=0 && npx next build
```

---

## UX rules — these were learned the hard way, do not relearn them

These are not style preferences. Each one is a mistake that shipped in this repo and had to be
undone. Treat them as invariants and check every screen against them before saying it's done.

### 1. Things that are different must LOOK different. Things that look the same must BE the same.

The worst offence so far: a "How to play" link (live navigation) sat next to a "Rooms coming later"
link (a teaser for an unbuilt feature) — same size, same colour, same underline, side by side. They
read as siblings. They have nothing to do with each other.

Before placing two elements next to each other, ask: *are these the same kind of thing?*

- Same kind, same weight → fine to group and match.
- Different kind → they must differ in weight, colour, shape, or be separated entirely.

This repo now has four deliberately distinct visual classes on the home screen. Keep them distinct:

| Class | Looks like | Means |
|---|---|---|
| Play mode | Solid category accent, dark edge, hard shadow | Tap to play now |
| Tool | Neutral `--paper` card, solid border, accent marker strip | A utility, not a game mode |
| Not built | **Dashed** border, no shadow, reduced opacity, greyscale icon, label says so | Doesn't exist yet |
| Offsite | Brand red `--hot` | Leaves the site |

### 2. Adjacency and identical styling are both claims about relatedness

Placing things side by side says "these belong together". Styling them identically says "these are
peers". Don't make either claim accidentally. Put unrelated items in different regions, with real
separation, and give them different weight.

### 3. An empty deck is an invisible bug — check every category, not one

Animals and objects shipped completely broken: every entry is tagged
`worldwide`, the saved default filter is India+USA, so the pool filtered to zero
and Generate silently did nothing. It looked perfect in a screenshot. I had only
tested celebrity, movie and place.

Two rules follow. **Exercise every category and every filter combination**, not a
representative sample — `npm run check:decks` does this and must pass. And **an
empty result must never be silent**: Generate is disabled with an explanation
when the pool is zero, so the failure is visible instead of feeling broken.

Filters have **two independent axes** for people: `types` (what kind of famous)
and `era` (when). Don't collapse them — a "recent people" bucket would duplicate
every domain. `era: "evergreen"` answers to both Classic and Modern, which is
what stops arguments about whether Batman or Sachin is which.

**Chips are derived from the *other* active filters, not just the data.** There
are no classic internet personalities, so the Internet chip must vanish under
Era: Classic — and a selection stranded by an era change is pruned in
`savePrefs`, never left to empty the deck.

For people and characters, `countries` means **"where this name is a household
name"**, not country of origin: Doraemon is tagged `in` + `jp` because every
Indian kid knows him. Movies still use origin.

Offered filter chips are **derived from the data** (`availableCountries`,
`availableLanguages`), never hardcoded — that is what stops a chip like
"Worldwide" appearing on movies, where no entry carries it.

### 4. Never render a control that does nothing

The Indian-language chips originally appeared on the Place generator, where no entry carries a
language. A control that has no effect is worse than no control: the user taps it, nothing happens,
and they stop trusting the rest of the interface. Gate controls on a real capability flag
(`hasLanguageFilter`, `hasRangeFilter`), never on a guess.

### 5. Never show the same destination twice on one screen

Home had a "?" icon linking to `/how-to-play` in the header *and* a "How to play" text link at the
bottom. Two doors to one room is clutter pretending to be helpfulness. One entry point, properly
labelled — a bare icon is a weak affordance for anything important.

### 6. Unbuilt features must look unbuilt

Never let a planned feature borrow the styling of a working one. Dashed border, muted, and say the
words ("not built yet"). A user who taps something that isn't there loses trust immediately.

### 7. Play surfaces are not forms

The play screen is a wall of one accent, a huge Generate at thumb height, and at most three small
controls. Everything else — settings, rules, explanations, links — goes in a drawer (gear for
config, `?` for words). If you find yourself adding a heading, a paragraph or a filter row to a play
surface, it belongs in a drawer or in `/how-to-play`.

Prose belongs in `src/content/guides.ts`, not on a play screen.

### 8. The primary action must be reachable by a thumb without scrolling

Sticky it to the bottom if the content above can grow. A Generate button that falls below the fold
once filters expand is a broken screen.

### 9. Verify visually before claiming done

Every UI change: run it, screenshot at **375×812**, in **both** colour schemes, and look at it. Four
real defects in this repo — reveal text pinned to the top, words breaking mid-word, Generate below
the fold, cream-on-yellow in dark mode — were all invisible in the code and obvious in a screenshot.

---

## The design system — Indian matchbox

The whole visual system is four colourway tokens plus a handful of recipes in
`@layer components`. Get this right and everything stays consistent for free.

### Colour

- **A colourway is the unit, not a colour.** `src/lib/colourways.ts` holds ~10
  approved sets of `{field, frame, ink, highlight, shadow}`. A real label is 3–4
  spot inks that work together, so nothing picks hues independently.
- **Components must never name a colour.** No hex, no `bg-red-500`. Everything
  comes from `--field`, `--frame`, `--ink-on-field`, `--highlight`, or the page
  tokens `--ground`, `--ground-soft`, `--ground-ink`, `--band`.
  `npm run check:tokens` fails the build otherwise.
- **That guard also catches undefined tokens**, because a `var(--gone)` renders
  as *nothing* — that is how the scorecard sheet shipped fully transparent and
  unreadable after a palette rename.
- **`npm run check:contrast` proves every colourway is readable** at its
  declared roles: ink ≥4.5:1 on field, highlight and frame ≥3:1, and the shadow
  ≥3:1 against the ink. Two colourways failed on the first run; that's the point.
- **Highlight ink is for large bold type only** — small-caps captions and hero
  display. Never body copy.
- **There is no dark mode.** A printed label doesn't have one, and the
  colourways are the theme. Don't reintroduce it.

### Depth and texture

- **The hard offset shadow goes on hero display type sitting on a field.** Never
  on kraft body text (it reads as mud) and never on small text (it reads as
  doubled).
- **The shadow ink is per-colourway (`--shadow-text`).** On the one dark-ink
  colourway a dark shadow vanishes and the glyph looks embossed, so that
  colourway carries a light shadow instead.
- Grain overlay, hard shadows and a ~0.4° tilt are the whole print treatment.
  No aged paper, no worn edges.

### Recipes — use these, don't reinvent them

| Recipe | What it is |
|---|---|
| `.mb-frame` | outer rule + field + dotted inner rule |
| `.mb-label` / `.mb-label-bleed` | a full label; the bleed variant is the play screen and shows no ground at the edges |
| `.mb-band` | the black band that holds the primary action |
| `.mb-btn` + `.mb-btn-{primary,secondary,tertiary}` | one button structure; **hierarchy is palette only**, so it still reads in greyscale |
| `.mb-icon-btn` | round control; no dots, they're too dense at that size |
| `.mb-display` / `.mb-display-sm` / `.mb-shadow` / `.mb-caps` | type |
| `.rail` | scroll-snap swipe rail |

- **One marquee per screen**, behind the hero only, filled from `currentColor`
  (`src/components/mb/marquee.tsx`). It's a stamp, not wallpaper.
- **Emblems, not emoji, on a field.** Emoji are glossy modern artwork that
  always read as pasted onto flat spot ink, and they can't take a colourway.
- **Stickers are curated by hand and served locally.** The set lives in
  `Cards/Gif Collection.md` in the vault; `npm run stickers` imports exactly
  what that note lists into `public/stickers`, rewrites the manifest and the
  service worker precache list, and deletes anything not in the note. Never
  bulk-download from GIPHY search — it is almost entirely clip-art noise, which
  is why the picker approach was abandoned.
- **A category with no sticker falls back to its drawn emblem**, by design. That
  same fallback covers a failed load, so the cards never break offline.
- Stickers are downloaded at the 200px rendition, not the original: the note
  links to files that can be megabytes, and a card renders at ~120px.
- **Drawers must be opaque `--ground`.** A translucent sheet over a saturated
  label is unreadable.
- **Page grounds are scoped classes** (`.ground-navy` on the home screen,
  default kraft elsewhere). Anything that sits on a ground — secondary buttons,
  panels, drawers — must take its ink from `--ground-ink`, never from a
  colourway. The colourway red was invisible once the home ground went navy.
- **Never set button tokens (`--btn-*`) inline on a container.** Inline values
  beat the `.mb-btn-*` recipes and silently break a button's palette.

### Enforcement

`/style` renders every component, state and colourway on one page. **A new
component does not exist until it appears there** — one screenshot of that route
verifies the whole system, which is the only reason the rest of the site stays
consistent.

## Layout rules

- **The scorecard is not a destination.** It is a bottom sheet in `AppBar`, reachable from every
  screen mid-game. Do not add a scoreboard tile or nav entry; `/scoreboard` exists only as a
  deep-link and SEO page.
- **Every screen renders `AppBar`.** That is what guarantees the scorecard is always one tap away —
  by construction, not by remembering.
- The home hero is a swipeable scroll-snap rail (`.rail`), one pastel card per category. Native
  scroll, no carousel library.

## Content and data rules

- **An unrecognisable name kills a round harder than a repeat does.** Curate for fame, not volume.
  Anything pulled by `scripts/build-data.mjs` lands in `*.candidates.json` and needs a human pass
  before it reaches `src/data/*.json`.
- Draws use the shuffle-bag in `src/lib/shuffle-bag.ts` — without replacement, keyed by category +
  filter signature. Pure random visibly repeats and users read that as a bug.
- The reveal (`src/components/fit-text.tsx`) breaks **only at spaces**. Splitting a word across
  lines is unreadable across a room, which is the one thing that screen exists to do.
- **`absolute inset-0` resolves against the padding box**, so a parent's padding
  does not constrain it — the reveal ran edge-to-edge until the insets were made
  explicit. Inset with real values when the text must not touch the screen edge.
- **Measure text with a `Range`, never `scrollWidth`.** A block element's `scrollWidth` is clamped
  to its own width, so overflowing text reports as fitting — "Salaar" rendered at 140px and ran off
  the screen. `range.getBoundingClientRect()` reports the true painted extent.

## Architecture rules (so rooms can land later without a rewrite)

- Games are manifests in `src/lib/games.ts`. Add an entry; don't edit the home page.
- Drawing logic in `src/lib/draw.ts` is pure TS with no React coupling, so a server can call it.
- All state goes through `src/lib/state-adapter.ts`. v1 has only `local`; `remote` (Supabase
  Realtime) implements the same contract later.
- Persistence is read via `usePersisted` / `useSyncExternalStore` — never copy localStorage into
  state inside an effect.

## SEO rules

- Ranking content lives in `/how-to-play` guides (visible pages, `HowTo` + `FAQPage` JSON-LD). Play
  surfaces are not SEO surfaces.
- Drawer copy is crawlable but may be discounted for being visually hidden. Don't rely on it.
- The real opportunity is long-tail filter pages (`/random-bollywood-movie-generator`), not the head
  terms. See §6 of the spec.
