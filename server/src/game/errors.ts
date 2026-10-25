import type { Err, ErrorCode } from "../../../shared/protocol";

/** A refusal the player should read: a rule, a full room, a wrong code. Never a server fault. */
export class GameError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }

  get err(): Err {
    return { code: this.code, message: this.message };
  }
}

export const reject = (code: ErrorCode, message: string): never => {
  throw new GameError(code, message);
};
