import type { Metadata } from "next";
import { AppBar } from "@/components/app-bar";
import { Emblem } from "@/components/mb/emblems";
import { Label } from "@/components/mb/label";
import { Marquee } from "@/components/mb/marquee";
import { Chip, IconButton, Panel } from "@/components/mb/ui";
import { RotateHint } from "@/components/mb/rotate-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_LIST } from "@/lib/categories";
import { COLOURWAYS, colourwayVars } from "@/lib/colourways";

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

function Row({ title, children }: { title: string; children: React.ReactNode }) {
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
      <AppBar back="/" title={<span className="mb-display-sm text-lg">Style</span>} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 pb-16">
        <p className="text-sm font-medium opacity-75">
          Indian matchbox system. Every colour here comes from four colourway
          tokens — <code>--field</code>, <code>--frame</code>,{" "}
          <code>--ink-on-field</code>, <code>--highlight</code>. Components never
          name a colour; <code>npm run check:tokens</code> enforces it and{" "}
          <code>npm run check:contrast</code> proves each colourway is readable.
        </p>

        <Row title="Colourways">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOURWAYS.map((cw) => (
              <div
                key={cw.id}
                style={colourwayVars(cw)}
                className="mb-frame rounded-[var(--radius-lg)] p-4"
              >
                <p className="mb-display-sm text-lg">{cw.name}</p>
                <p className="mb-caps mt-1 text-[0.55rem] opacity-80">
                  {cw.id}
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="size-5 rounded-full border-[var(--rule-thin)] border-current bg-[var(--frame)]" />
                  <span className="size-5 rounded-full border-[var(--rule-thin)] border-current bg-[var(--highlight)]" />
                  <span className="size-5 rounded-full border-[var(--rule-thin)] border-current bg-[var(--ink-on-field)]" />
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
              Body copy, Cabinet Grotesk regular. Readable at length, never
              set in the highlight ink.
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

        <Row title="Controls">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton>?</IconButton>
            <IconButton>⚙</IconButton>
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
            <div className="mb-frame rounded-[var(--radius-lg)] p-4">
              <p className="text-sm font-semibold">
                Frame recipe: outer rule, field, dotted inner rule.
              </p>
            </div>
          </div>
        </Row>

        <Row title="Marquee — one per screen, behind the hero only">
          <div className="mb-frame relative flex h-48 items-center justify-center rounded-[var(--radius-lg)]">
            <Marquee className="absolute size-40 text-[var(--highlight)]" />
            <span className="mb-display relative text-4xl">Hero</span>
          </div>
        </Row>

        <Row title="Emblems">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORY_LIST.map((c) => (
              <div
                key={c.id}
                style={colourwayVars({
                  ...COLOURWAYS[0],
                })}
                className="mb-frame flex flex-col items-center gap-2 rounded-[var(--radius-md)] p-3"
              >
                <Emblem category={c.id} className="size-14" />
                <span className="mb-caps text-[0.5rem]">{c.label}</span>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Label — the play surface, with band">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label
              colourway="pillar"
              tilt="left"
              className="h-72"
              band={<Button size="hero" className="max-w-xs">Generate</Button>}
            >
              <div className="relative flex h-full flex-col items-center justify-center gap-2">
                <Marquee className="absolute size-44 text-[var(--highlight)]" />
                <span className="mb-display relative text-5xl">67</span>
              </div>
            </Label>
            <Label
              colourway="bottle"
              tilt="right"
              className="h-72"
              band={<RotateHint />}
            >
              <div className="relative flex h-full items-center justify-center">
                <Marquee className="absolute size-44 text-[var(--highlight)]" />
                <Emblem category="animal" className="relative size-28" />
              </div>
            </Label>
          </div>
        </Row>
      </main>
    </>
  );
}
