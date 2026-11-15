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
