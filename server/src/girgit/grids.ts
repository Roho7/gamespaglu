import { GRID_SIZE, type PackId } from "../../../shared/protocol";
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

const slug = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Row = { label: string };
type RawGrid = { id: string; theme: string; pack: PackId; cells: string[] };

const LABEL_BY_ID = new Map<string, string>();
for (const rows of [movies, celebrities, tv, companies, places] as Row[][]) {
  for (const r of rows) LABEL_BY_ID.set(slug(r.label), r.label);
}
for (const list of [animals, objects, everyday] as string[][]) {
  for (const label of list) LABEL_BY_ID.set(slug(label), label);
}

/**
 * Grids are authored as entry ids and resolved here, so one curated set feeds every game. A dangling
 * id fails at boot rather than dealing a grid with a hole in it; `check:grids` catches it first in CI.
 * The deck never leaves the server: clients receive only the sixteen words they were dealt.
 */
export const GRIDS: Grid[] = (gridsRaw as RawGrid[]).map((g) => {
  const cells = g.cells.map((id) => {
    const label = LABEL_BY_ID.get(id);
    if (!label) throw new Error(`Grid ${g.id}: no entry for id "${id}"`);
    return label;
  });
  if (cells.length !== GRID_SIZE) {
    throw new Error(`Grid ${g.id} has ${cells.length} cells, expected ${GRID_SIZE}`);
  }
  return { id: g.id, theme: g.theme, pack: g.pack, cells };
});

export const GRID_BY_ID = new Map(GRIDS.map((g) => [g.id, g]));
