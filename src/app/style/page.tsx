import type { Metadata } from "next";
import { ArrowLeft, Settings } from "lucide-react";
import { PageCorners } from "@/components/layout/page-corners";
import { PickableGridDemo, VotingBoardDemo } from "@/app/style/girgit-demo";
import { ToastDemo } from "@/app/style/toast-demo";
import { CategoryEmblem } from "@/components/artwork/category-emblem";
import { Starburst } from "@/components/artwork/starburst";
import { Chip, Panel } from "@/components/ui/controls";
import { ClueBoard, type ClueSlip } from "@/components/girgit/clue-board";
import { GirgitGrid } from "@/components/girgit/girgit-grid";
import { HoldToRevealSecret } from "@/components/girgit/hold-to-reveal-secret";
import { WavelengthDial } from "@/components/wavelength/wavelength-dial";
import { MarqueeBanner } from "@/components/layout/marquee-banner";
import { Scoreboard } from "@/components/scoreboard/scoreboard";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { RotatePhoneHint } from "@/components/generator/rotate-phone-hint";
import { VineMarquee } from "@/components/stitch/vine-marquee";
import { Button } from "@/components/ui/button";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { Input } from "@/components/ui/input";
import { CATEGORY_LIST } from "@/lib/deck/categories";
import { paletteById, PALETTES, theme } from "@/lib/palettes";

/**
 * The living style guide, and the contract every screen is built against.
 *
 * Rule: a new component does not exist until it appears here. One screenshot of
 * this page verifies the whole system, which is the only reason the rest of the
 * site stays consistent.
 */
export const metadata: Metadata = {
  title: "Style",
  robots: { index: false, follow: false },
};

/**
 * The worst case on purpose: the longest labels in the real deck.
 * A style guide that shows comfortable content proves nothing about the
 * cell that actually breaks.
 */
const DEMO_SLIPS: ClueSlip[] = [
  { id: "you", name: "Roho", you: true, clue: "Penalty" },
  { id: "asha", name: "Asha", clue: "Iconic" },
  { id: "bunty", name: "Bunty", clue: null },
  { id: "chiku", name: "Chiku", clue: null, note: "timed out", dim: true },
];

const DEMO_CELLS = [
  "Cristiano Ronaldo",
  "Lionel Messi",
  "Usain Bolt",
  "Roger Federer",
  "Serena Williams",
  "Michael Jordan",
  "LeBron James",
  "Muhammad Ali",
  "David Beckham",
  "Neymar",
  "Kobe Bryant",
  "Tiger Woods",
  "Rafael Nadal",
  "Tom Brady",
  "Lewis Hamilton",
  "Pelé",
];

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="mb-caps text-[0.65rem] opacity-60">{title}</h2>
      {children}
    </section>
  );
}

export default function StylePage() {
  return (
    <>
      <PageCorners />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 pt-20 pb-16">
        <h1 className="mb-display text-4xl">Style</h1>
        <p className="text-sm font-medium opacity-75">
          Muted print system. Every colour here comes from five palette tokens —{" "}
          <code>--cw-base</code>, <code>--cw-highlight</code>,{" "}
          <code>--cw-secondary</code>, <code>--cw-primary</code>,{" "}
          <code>--cw-shadow</code>. Components never name a colour;{" "}
          <code>npm run check:tokens</code> enforces it and{" "}
          <code>npm run check:contrast</code> proves each palette is readable.
        </p>

        <Row title="Palettes">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PALETTES.map((cw) => (
              <div
                key={cw.id}
                {...theme(cw)}
                className="mb-frame p-4"
              >
                <p className="mb-display-sm text-lg">{cw.name}</p>
                <p className="mb-caps mt-1 text-[0.55rem] opacity-80">
                  {cw.id}
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="size-5 border-[length:var(--rule-thin)] border-current bg-[var(--cw-secondary)]" />
                  <span className="size-5 border-[length:var(--rule-thin)] border-current bg-[var(--cw-primary)]" />
                  <span className="size-5 border-[length:var(--rule-thin)] border-current bg-[var(--cw-shadow)]" />
                </div>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Type">
          <div className="space-y-2">
            <p className="mb-display text-5xl">Display, hard shadow</p>
            <p className="mb-display-sm text-2xl">Display small</p>
            <p className="mb-caps text-xs">Tracked small caps caption</p>
            <p className="text-base font-medium">
              Body copy, Montserrat regular. Readable at length, never set in
              the highlight ink.
            </p>
          </div>
        </Row>

        <Row title="Buttons — one structure, hierarchy by palette">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="max-w-sm">
            <Button size="hero">Hero</Button>
          </div>
        </Row>

        <Row title="Toast — errors and confirmations, from sonner">
          <ToastDemo />
        </Row>

        <Row title="Controls">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mb-square-btn mb-display-sm text-2xl">?</span>
            <span className="mb-square-btn">
              <Settings className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="mb-square-btn">
              <ArrowLeft className="size-5" strokeWidth={3} aria-hidden />
            </span>
            <Chip active>Selected</Chip>
            <Chip>Unselected</Chip>
            <div className="w-40">
              <Input placeholder="Add player or team" />
            </div>
          </div>
        </Row>

        <Row title="Panels and frames">
          <div className="grid gap-3 sm:grid-cols-2">
            <Panel>
              <p className="text-sm font-semibold">
                Kraft panel, for reading surfaces.
              </p>
            </Panel>
            <div className="mb-frame p-4">
              <p className="text-sm font-semibold">
                Frame recipe: outer rule, field, dotted inner rule.
              </p>
            </div>
          </div>
        </Row>

        <Row title="Marquee — one per screen, behind the hero only">
          <div className="mb-frame relative flex h-48 items-center justify-center">
            <Starburst className="absolute size-40 text-[var(--cw-primary)]" />
            <span className="mb-display relative text-4xl">Hero</span>
          </div>
        </Row>

        <Row title="Vine marquee — either direction, blooms in and out at the edges">
          <div className="mb-frame space-y-3 p-4 text-[var(--cw-primary)]">
            <VineMarquee className="h-12" />
            <VineMarquee direction="right" className="h-12" />
          </div>
        </Row>

        <Row title="Stitch border — frames a band or panel, follows its ink">
          <div className="mb-band relative h-28 px-4 font-extrabold">
            <StitchBorder className="inset-3" />
            Framed band
          </div>
        </Row>

        <Row title="Rotate hint — sits in the band during a countdown">
          <div className="mb-band p-4">
            <RotatePhoneHint />
          </div>
        </Row>

        <Row title="Emblems">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORY_LIST.map((c) => (
              <div
                key={c.id}
                {...theme(PALETTES[0])}
                className="mb-frame flex flex-col items-center gap-2 p-3"
              >
                <CategoryEmblem category={c.id} className="size-14" />
                <span className="mb-caps text-[0.5rem]">{c.label}</span>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Girgit — the grid. Never marks the secret">
          <div className="grid gap-4 sm:grid-cols-2">
            <div {...theme("neon", { flipped: true })} className="mb-label p-3">
              <div className="space-y-2 p-1">
                <p className="mb-caps text-[0.55rem] opacity-70">In play</p>
                <GirgitGrid cells={DEMO_CELLS} />
                <p className="text-[0.65rem] opacity-70">
                  No cell is marked. A lit cell is readable by position from
                  across a table without reading a word.
                </p>
              </div>
            </div>
            <div
              {...theme("tangerine", { flipped: true })}
              className="mb-label p-3"
            >
              <div className="space-y-2 p-1">
                <p className="mb-caps text-[0.55rem] opacity-70">
                  The caught Girgit&apos;s guess, then the reveal
                </p>
                <PickableGridDemo cells={DEMO_CELLS} />
                <GirgitGrid cells={DEMO_CELLS} markIndex={5} guessIndex={2} />
                <p className="text-[0.65rem] opacity-70">
                  Only tappable tiles take the loud rule and shadow. The secret
                  prints loud; a wrong guess is struck through.
                </p>
              </div>
            </div>
          </div>
        </Row>

        <Row title="Girgit — the clue board">
          <div className="grid gap-4 sm:grid-cols-2">
            <div {...theme("jungle", { flipped: true })} className="mb-label p-3">
              <div className="space-y-2 p-1">
                <p className="mb-caps text-[0.55rem] opacity-70">
                  Clues landing, then the vote
                </p>
                <ClueBoard slips={DEMO_SLIPS} />
                <VotingBoardDemo
                  slips={DEMO_SLIPS.map((s, i) => ({
                    ...s,
                    badge: i === 1 ? "2" : null,
                  }))}
                />
              </div>
            </div>
            <div {...theme("jungle", { flipped: true })} className="mb-label p-3">
              <div className="space-y-2 p-1">
                <p className="mb-caps text-[0.55rem] opacity-70">The reveal</p>
                <ClueBoard
                  slips={DEMO_SLIPS.map((s, i) => ({
                    ...s,
                    clue: s.clue ?? "Loud",
                    dim: false,
                    marked: i === 1,
                    badge: i === 1 ? null : "+1",
                    note: i === 1 ? "Girgit · 0 pts" : "1 pt",
                  }))}
                />
                <p className="text-[0.65rem] opacity-70">
                  Outlined, never filled, so a clue never reads as one of the
                  sixteen words. Dashed until it lands.
                </p>
              </div>
            </div>
          </div>
        </Row>

        <Row title="Girgit — hold to reveal. Identical shape for both roles">
          <div className="grid gap-4 sm:grid-cols-2">
            <div {...theme("jungle")} className="mb-label p-3">
              <div className="p-2">
                <HoldToRevealSecret word="Boarding pass" isGirgit={false} />
              </div>
            </div>
            <div {...theme("jungle")} className="mb-label p-3">
              <div className="p-2">
                <HoldToRevealSecret word={null} isGirgit />
              </div>
            </div>
          </div>
          <p className="text-sm opacity-75">
            Hold either one. The word and the Girgit line land in the same fixed
            slot, at the same size — so a neighbour watching someone press and
            hold learns nothing from the shape of what appears.
          </p>
        </Row>
        <Row title="Scoreboard — the live board, shared with the sheet and /scoreboard">
          <div className="max-w-xl">
            <Scoreboard />
          </div>
        </Row>

        <Row title="Marquee banner — the one instruction on a play surface">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["cherry", "jungle"] as const).map((id) => (
              <div
                key={id}
                {...theme(id, { flipped: true })}
                className="mb-label p-4"
              >
                <MarqueeBanner
                  headline="Pass the phone to Ana"
                  detail="Ana is the Psychic. Everyone else, look away."
                />
              </div>
            ))}
          </div>
        </Row>

        <Row title="Wavelength — the dial. Covered, guessing, revealed, on grain">
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["miami", null, null],
                ["lemon", 38, null],
                ["cherry", 38, 44],
              ] as const
            ).map(([id, dial, target], i) => (
              <div key={i} {...theme(id)} className="mb-label p-4">
                <PaletteGrain
                  palette={paletteById(id)}
                  tone="field"
                  className="absolute inset-0"
                />
                <WavelengthDial
                  dial={dial}
                  target={target}
                  label="Cold to Hot"
                  palette={paletteById(id)}
                />
              </div>
            ))}
          </div>
          <p className="text-sm opacity-75">
            A covered dial draws no wedge at all, so it looks the same for every
            card and nothing about the target leaks before the reveal.
          </p>
        </Row>
      </main>
    </>
  );
}
