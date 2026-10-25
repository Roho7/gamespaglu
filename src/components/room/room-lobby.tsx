import type { PublicPlayer } from "@shared/protocol";

/** The waiting room: the code to read out, who is in, and how many more the game needs. */
export function RoomLobby({
  code,
  players,
  minPlayers,
  maxPlayers,
  children,
}: {
  code: string;
  players: PublicPlayer[];
  minPlayers: number;
  maxPlayers: number;
  /** A line about what the table will be dealt. */
  children?: React.ReactNode;
}) {
  const short = players.length < minPlayers;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="mb-caps text-sm">Share this with the table</p>
      <p className="mb-display mb-shadow text-7xl tracking-[0.12em]">{code}</p>
      <p className="mb-caps text-sm">
        {players.length} of {maxPlayers} in
        {short ? ` · need ${minPlayers}` : ""}
      </p>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-base font-bold">
        {players.map((p) => (
          <li key={p.id} className={p.connected ? "" : "opacity-40"}>
            {p.name}
            {p.isHost ? " ★" : ""}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
