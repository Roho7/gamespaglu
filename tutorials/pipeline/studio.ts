import { spawn } from "node:child_process";
import { join } from "node:path";

import { gameDir, gameFromArgv, TUTORIALS_DIR } from "./paths";

const game = gameFromArgv();
spawn(
  "npx",
  ["remotion", "studio", join(TUTORIALS_DIR, "remotion/index.ts"), `--public-dir=${gameDir(game)}`],
  { stdio: "inherit", cwd: TUTORIALS_DIR },
).on("exit", (code) => process.exit(code ?? 0));
