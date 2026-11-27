import { record,type Recording } from "../capture/recording";
import { gameFromArgv } from "./paths";

async function main() {
  const game = gameFromArgv();
  const mod = (await import(`../capture/${game}.ts`)) as {
    default: (rec: Recording) => Promise<void>;
  };
  const markers = await record(game, mod.default);
  for (const [shot, sec] of Object.entries(markers.shots).sort((a, b) => a[1] - b[1])) {
    console.log(`${sec.toFixed(2).padStart(7)}s  ${shot}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
