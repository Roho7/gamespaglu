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

### 3. Never render a control that does nothing

The Indian-language chips originally appeared on the Place generator, where no entry carries a
language. A control that has no effect is worse than no control: the user taps it, nothing happens,
and they stop trusting the rest of the interface. Gate controls on a real capability flag
(`hasLanguageFilter`, `hasRangeFilter`), never on a guess.

### 4. Never show the same destination twice on one screen

Home had a "?" icon linking to `/how-to-play` in the header *and* a "How to play" text link at the
bottom. Two doors to one room is clutter pretending to be helpfulness. One entry point, properly
labelled — a bare icon is a weak affordance for anything important.

### 5. Unbuilt features must look unbuilt

Never let a planned feature borrow the styling of a working one. Dashed border, muted, and say the
words ("not built yet"). A user who taps something that isn't there loses trust immediately.

### 6. Play surfaces are not forms

The play screen is a wall of one accent, a huge Generate at thumb height, and at most three small
controls. Everything else — settings, rules, explanations, links — goes in a drawer (gear for
config, `?` for words). If you find yourself adding a heading, a paragraph or a filter row to a play
surface, it belongs in a drawer or in `/how-to-play`.

Prose belongs in `src/content/guides.ts`, not on a play screen.

### 7. The primary action must be reachable by a thumb without scrolling

Sticky it to the bottom if the content above can grow. A Generate button that falls below the fold
once filters expand is a broken screen.

### 8. Verify visually before claiming done

Every UI change: run it, screenshot at **375×812**, in **both** colour schemes, and look at it. Four
real defects in this repo — reveal text pinned to the top, words breaking mid-word, Generate below
the fold, cream-on-yellow in dark mode — were all invisible in the code and obvious in a screenshot.

---

## Theme rules

- **Never derive a border or shadow colour from the text colour.** Doing that made every dark-mode
  shadow a glowing near-white slab. `--line` and `--shadow-color` are independent tokens.
- **Text on an accent uses `--on-accent`** (or `--on-hot`), which never inverts. The six category
  accents are fixed hues; theme-following text on them gives you cream on yellow.
- **One accent per screen.** The only exception is the home picker, where showing all six *is* the
  wayfinding.
- Dark is the default canvas; light follows the OS. There is no in-app toggle, on purpose.
- Radius is 0 everywhere. Motion is hard-eased and respects `prefers-reduced-motion`.

## Content and data rules

- **An unrecognisable name kills a round harder than a repeat does.** Curate for fame, not volume.
  Anything pulled by `scripts/build-data.mjs` lands in `*.candidates.json` and needs a human pass
  before it reaches `src/data/*.json`.
- Draws use the shuffle-bag in `src/lib/shuffle-bag.ts` — without replacement, keyed by category +
  filter signature. Pure random visibly repeats and users read that as a bug.
- The reveal (`src/components/fit-text.tsx`) breaks **only at spaces**. Splitting a word across
  lines is unreadable across a room, which is the one thing that screen exists to do.

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
