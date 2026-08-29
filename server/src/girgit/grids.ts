import { GRID_SIZE } from "../../../shared/protocol";
import type { Grid } from "./engine";

import gridsRaw from "../../../shared/data/grids.json";
import movies from "../../../shared/data/movies.json";
import celebrities from "../../../shared/data/celebrities.json";
import tv from "../../../shared/data/tv.json";
import companies from "../../../shared/data/companies.json";
import places from "../../../shared/data/places.json";
import animals from "../../../shared/data/animals.json";
import objects from "../../../shared/data/objects.json";
import everyday from "../../../shared/data/everyday.json";

/**
 * Grids are authored as sets of entry IDS, not labels, and resolved here.
 *
 * That indirection is the whole point of "one curated set, many games": a name
 * clears the fame bar once, in a shared pool, and both Who Am I? and Girgit draw
 * from it. `npm run check:grids` fails on any id that stops resolving, so a
 * renamed label cannot silently orphan a cell.
 *
 * The deck never leaves this process. Clients receive the sixteen words they
 * were dealt and nothing else, so it cannot be scraped to pre-empt a round.
 */
const slug = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Row = { label: string };

const LABEL_BY_ID = new Map<string, string>();
for (const rows of [movies, celebrities, tv, companies, places] as Row[][]) {
  for (const r of rows) LABEL_BY_ID.set(slug(r.label), r.label);
}
for (const list of [animals, objects, everyday] as string[][]) {
  for (const label of list) LABEL_BY_ID.set(slug(label), label);
}

type RawGrid = { id: string; theme: string; pack: string; cells: string[] };

export const GRIDS: Grid[] = (gridsRaw as RawGrid[]).map((g) => {
  const cells = g.cells.map((id) => {
    const label = LABEL_BY_ID.get(id);
    // check:grids catches this in CI; this is the belt for a bad deploy, and it
    // fails at boot rather than dealing a grid with a hole in it.
    if (!label) throw new Error(`Grid ${g.id}: no entry for id "${id}"`);
    return label;
  });
  if (cells.length !== GRID_SIZE) {
    throw new Error(`Grid ${g.id} has ${cells.length} cells, expected ${GRID_SIZE}`);
  }
  return { id: g.id, theme: g.theme, pack: g.pack, cells };
});

export const GRID_BY_ID = new Map(GRIDS.map((g) => [g.id, g]));
