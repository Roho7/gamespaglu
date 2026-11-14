<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Games Paglu — agent working notes

`gamespaglu.com`. Phone-as-aid for games played **in person**. Sibling of officepaglu.com.
Specs live in the Obsidian vault (`~/Documents/MAIN/OBSIDIAN/OB_BRAIN/Cards/`): `Games Paglu Spec.md`,
plus one spec per game (`Girgit Spec.md`, `Wavelength Spec.md`, `Mafia Spec.md`, `Tiktiki Spec.md`), which override the parent spec.

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · no accounts · **offline-first, except rooms**.

Rooms (Girgit, Mafia, Tiktiki) use a Socket.IO server on Fly (`server/`) and Upstash Redis in Singapore.
`server/scripts/drop-gp.sql` removes the old `gp` schema from the shared officepaglu database.
Everything else is backendless and works with no signal.

```bash
npm run dev
```

**Before calling any task done, run both and fix every failure:**

1. `npm run check`
2. `npx tsc --noEmit && npx eslint src --max-warnings=0 && npx next build`

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

Before UI work read `docs/design-system.md`; before deck or data work read `docs/content.md`; before SEO work read `docs/seo.md`.

## Layout

- **There is no top bar.** Inner pages render `PageCorners`: a square back button top-left
  (`BackLink`, always `router.back()`, never a fixed route), and
  top-right any page controls plus the scoreboard. Home cards (`HomeGameCard`) carry a square `?` to
  their guide top-right instead.
- **The scoreboard is a bottom sheet behind a square button, not a destination.** `PageCorners`
  shows it on every inner game screen; `/scoreboard` exists only as a deep-link and SEO page.
  Home and the generator have no scoreboard button. Wavelength keeps score *in* the scoreboard: its
  player setup writes the rows (one per player, or one per team with `members`), and every reveal
  adds its `awards` through `addPoints` (`src/lib/hooks/use-scoreboard.ts`).
- **One control shape.** Corner and drawer controls are all `.mb-square-btn`; icons from
  `lucide-react`, `?` set in display type.
- The generator opens on a briefing (how to play, settings) in stitched panels. Generate starts a
  round; during one the band is Regenerate (60%) and Settings (40%).
- Home is full-screen `HomeGameCard`s snapping vertically, one per game, never a sideways rail.
  The category `.rail` lives on `/who-am-i`. No carousel library.
- **Room screens with no signal say so** and withdraw every action. The service worker precaches
  them, so otherwise they render a plausible frozen board.

## Copy

**Whimsical, never literal.** Every word a player reads is part of the game, written by someone
at the table, not a spec describing the mechanics.

- Talk to the player and tell them what to do, in character. "You are a Villager. Pick who you
  think is a member of the Mafia", never "No power. Your night pick is a hunch, and it shows in the
  replay".
- Errors and empty states too: "They're already out. Pick someone with a pulse", not "Pick someone
  still in the game".
- Big moments draw from a pool, not one fixed string. Keep pools in `src/content/` and pick with
  `whimsy(pool, seed)` (`src/lib/whimsy.ts`), seeded by the room and the moment so every phone at
  the table reads the same line.
- Whimsy never costs clarity: the line still has to say exactly what to do or what just happened.
- They/them for any player, since names don't tell you pronouns.

## Architecture

- Game logic is pure TS with no React (`src/lib/deck/draw.ts`, the Girgit engine,
  `src/lib/wavelength/engine.ts`), so the server can
  call it.
- Local persistence goes through `src/lib/state-adapter.ts` and is read via `usePersisted`
  (`useSyncExternalStore`). Never copy localStorage into state inside an effect.
- Room state is one Redis document per code (`RedisRoomStore`). A new game does not get a table.
