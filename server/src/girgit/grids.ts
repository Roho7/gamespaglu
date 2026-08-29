import { GRID_SIZE } from "../../../shared/protocol";
import type { Grid } from "./engine";

/**
 * PROVISIONAL — M5 replaces this wholesale.
 *
 * The real deck is ~40 hand-authored sets whose cells are *entry ids* resolved
 * against the shared pools, so one fame bar covers Who Am I? and Girgit and
 * `check:grids` fails on a dangling id. These three exist only so M3 has
 * something to deal; they are literal strings and are not curated.
 *
 * A good grid is not 16 words on a topic — it is 16 with internal clusters, so
 * that one clue plausibly covers four of them and tells you almost nothing.
 * That is authored, never sampled.
 */
export const GRIDS: Grid[] = [
  {
    id: "provisional-kitchen",
    theme: "In the kitchen",
    cells: [
      "Kettle", "Fridge", "Spoon", "Chopping board",
      "Microwave", "Sink", "Toaster", "Frying pan",
      "Blender", "Oven", "Colander", "Whisk",
      "Rolling pin", "Grater", "Ladle", "Peeler",
    ],
  },
  {
    id: "provisional-airport",
    theme: "At the airport",
    cells: [
      "Boarding pass", "Duty free", "Baggage belt", "Runway",
      "Passport", "Gate", "Security", "Check-in",
      "Lounge", "Trolley", "Departures", "Customs",
      "Window seat", "Tarmac", "Cockpit", "Layover",
    ],
  },
  {
    id: "provisional-weather",
    theme: "Weather",
    cells: [
      "Drizzle", "Monsoon", "Heatwave", "Fog",
      "Thunder", "Hailstorm", "Blizzard", "Humidity",
      "Sunshine", "Frost", "Cyclone", "Overcast",
      "Breeze", "Lightning", "Sleet", "Drought",
    ],
  },
];

for (const g of GRIDS) {
  if (g.cells.length !== GRID_SIZE) {
    throw new Error(`Grid ${g.id} has ${g.cells.length} cells, expected ${GRID_SIZE}`);
  }
}
