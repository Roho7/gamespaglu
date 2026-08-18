# Games Paglu

`gamespaglu.com` — your phone as the aid for games played **in person**. Sibling of
[officepaglu.com](https://officepaglu.com).

Full spec lives in the Obsidian vault: `Cards/Games Paglu Spec.md`.

## What ships in v1

- **Who Am I?** — the phone-on-forehead guessing game (aka Heads Up, Celebrity
  Head). Six categories: celebrity, movie, place, animal, object, number.
  Generate → 3s countdown → the word fills the screen → it stays until the next
  Generate.
- **Scoreboard** — running totals with ± steppers, undo, auto-ranking. Add
  players *or teams*.
- Six standalone generator routes (`/random-number-generator`, …) — the same
  engine, indexable, for search traffic.
- **Scorecard** — the same board as a bottom sheet, reachable from the app bar on
  every screen, because keeping score happens *during* a game.
- Installable offline PWA. Screen Wake Lock while a word is up. Haptics always,
  sound on with a mute in Settings.

Type is **Cabinet Grotesk** by Indian Type Foundry, bundled under the Fontshare
Free Font License — font and licence live in `src/app/fonts/`.

No accounts, no backend, no network needed at play time.

## Run it

```bash
npm run dev
```

## Architecture, and why

Three disciplines exist so that **rooms** (Secret Hitler, imposter games) drop in
later as an additive change rather than a rewrite:

1. `src/lib/games.ts` — every game is a manifest. Home renders from the registry.
2. `src/lib/draw.ts` — drawing logic is pure TS with no React coupling, so a
   server can call the identical functions.
3. `src/lib/state-adapter.ts` — all state goes through one interface. v1 ships
   only the `local` (localStorage) implementation; `remote` (Supabase Realtime)
   satisfies the same contract later.

Other things worth knowing before you edit:

- `src/lib/shuffle-bag.ts` draws **without replacement**, keyed by category +
  filter signature. Pure random visibly repeats and players read that as a bug.
- `src/components/fit-text.tsx` binary-searches the largest font size that fits
  and breaks **only at spaces** — splitting a word across lines is unreadable
  across a room, which is the one thing the reveal screen exists to do.
- `--on-accent` / `--on-hot` are fixed and never invert. The category accents are
  fixed hues, so text on them must not follow the theme, or dark mode gives you
  cream on yellow.
- Dark mode follows the OS preference. There is deliberately no toggle.

## Word lists

`src/data/*.json`, committed and shipped. Flat lists (animals, objects) are plain
strings; filtered lists (places, movies, celebrities) carry `countries`,
`languages`, `year`, `tags`.

To refresh candidates from TMDB + Wikidata:

```bash
TMDB_API_KEY=... node scripts/build-data.mjs movies
node scripts/build-data.mjs celebrities
```

That writes `src/data/<bucket>.candidates.json` — **not** the shipped list. The
human review pass is the step that makes this product good: cut anyone the room
won't recognise, then merge by hand. An unrecognisable name kills a round harder
than a repeat does.

Icons are generated, no image deps: `node scripts/make-icons.mjs`.
