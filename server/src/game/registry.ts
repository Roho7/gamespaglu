import type { GameId } from "../../../shared/protocol";
import { girgitModule } from "../girgit/module";
import type { Grid } from "../girgit/engine";
import { mafiaModule } from "../mafia/module";
import type { AnyGameModule } from "./module";

export type Games = Record<GameId, AnyGameModule>;

/** Every game the room layer can host. The one place each module's state type is erased. */
export function createGames(grids: readonly Grid[]): Games {
  return {
    girgit: girgitModule(grids) as unknown as AnyGameModule,
    mafia: mafiaModule as unknown as AnyGameModule,
  };
}
