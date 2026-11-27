import type { Page } from "playwright";

import type { Recording } from "./recording";

const PLAYERS = ["Asha", "Ben", "Kiko"];
const STATE_KEY = "wavelength:game:v3";

type Card = { spectrum: { left: string; right: string }; target: number };

async function currentCard(page: Page): Promise<Card> {
  const card = await page.evaluate((key) => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.endsWith(key)) {
        const game = JSON.parse(localStorage.getItem(k) ?? "null");
        return game?.phase?.card ?? null;
      }
    }
    return null;
  }, STATE_KEY);
  if (!card) throw new Error("no card in persisted wavelength state");
  return card;
}

function clueFor({ spectrum, target }: Card): string {
  if (target < 38) return `More ${spectrum.left.toLowerCase()} than not`;
  if (target > 62) return `Leans ${spectrum.right.toLowerCase()}`;
  return "Right in the middle";
}

async function aimDial(page: Page, to: number, stepDelayMs: number) {
  const slider = page.getByRole("slider");
  await slider.focus();
  const from = Number(await slider.getAttribute("aria-valuenow"));
  const delta = Math.round(to) - from;
  const key = delta > 0 ? "ArrowRight" : "ArrowLeft";
  const big = Math.floor(Math.abs(delta) / 5);
  const small = Math.abs(delta) - big * 5;
  for (let i = 0; i < big; i++) {
    await page.keyboard.press(`Shift+${key}`);
    await page.waitForTimeout(stepDelayMs);
  }
  for (let i = 0; i < small; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(stepDelayMs);
  }
}

const REMAINING_OFFSETS: Record<string, number> = { Asha: 0, Ben: 6, Kiko: 10 };

function offsetFrom(target: number, delta: number) {
  return target + delta > 98 ? target - delta : target + delta;
}

async function playRemainingTurns(page: Page) {
  let turn = 0;
  const next = page.getByRole("button", { name: /^(Next card|Final score)$/ });
  const lock = page.getByRole("button", { name: "Lock it in" });
  for (;;) {
    const label = (await next.textContent())?.trim();
    await next.click();
    if (label === "Final score") return;
    await page.getByRole("button", { name: "Let them guess" }).click();
    const card = await currentCard(page);
    turn += 1;
    for (let i = 1; i < PLAYERS.length; i++) {
      const who = PLAYERS[(turn + i) % PLAYERS.length];
      await aimDial(page, offsetFrom(card.target, REMAINING_OFFSETS[who]), 10);
      await lock.click();
    }
  }
}

export default async function capture({ page, baseUrl, mark, dwell }: Recording) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const playLink = page.getByRole("link", { name: /Play Wavelength/ });
  await playLink.scrollIntoViewIfNeeded();
  await mark("home");
  await dwell(3.5);

  await playLink.click();
  await page.waitForURL("**/wavelength");
  await page.getByRole("tab", { name: /One Psychic/ }).waitFor();
  await mark("briefing");
  await dwell(3.5);

  await mark("modes");
  await page.getByRole("tab", { name: /One Psychic/ }).click();
  await dwell(2);
  await page.getByRole("tab", { name: /Teams/ }).click();
  await dwell(2);
  await mark("modes-other");
  await page.getByRole("tab", { name: /One Guesser/ }).click();
  await dwell(3);
  await page.getByRole("tab", { name: /Teams/ }).click();
  await dwell(2.5);
  await page.getByRole("tab", { name: /One Psychic/ }).click();
  await dwell(2.5);

  await page.getByRole("tab", { name: "Rounds" }).click();
  await page.getByRole("button", { name: "2", exact: true }).click();
  await dwell(1);
  await mark("players");
  await page.getByRole("button", { name: "Add players" }).click();
  const name = page.getByLabel("Player name");
  for (const player of PLAYERS) {
    await name.pressSequentially(player, { delay: 90 });
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await dwell(0.4);
  }
  await dwell(3);

  await page.getByRole("button", { name: "Start game" }).click();
  await page.getByRole("button", { name: "Let them guess" }).waitFor();
  await mark("card");
  await dwell(3.5);

  const card = await currentCard(page);
  const dial = page.getByRole("button", { name: /Press and hold/ });
  const box = await dial.boundingBox();
  if (!box) throw new Error("dial not visible");
  await mark("peek");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
  await page.mouse.down();
  await dwell(3);
  await page.mouse.up();
  await dwell(1);

  await mark("clue");
  await page.getByLabel("Clue").pressSequentially(clueFor(card), { delay: 80 });
  await dwell(2.5);
  await page.getByRole("button", { name: "Let them guess" }).click();

  await page.getByRole("button", { name: "Lock it in" }).waitFor();
  await mark("guess");
  await dwell(1.5);
  await aimDial(page, card.target, 140);
  await dwell(1.5);
  await page.getByRole("button", { name: "Lock it in" }).click();
  await dwell(1.5);
  await aimDial(page, offsetFrom(card.target, 6), 140);
  await dwell(1.5);
  await page.getByRole("button", { name: "Lock it in" }).click();

  await page.getByRole("button", { name: /^(Next card|Final score)$/ }).waitFor();
  await mark("reveal");
  await dwell(4);

  await mark("scoreboard");
  await page.getByRole("button", { name: "Open scoreboard" }).click();
  await dwell(3.5);
  await page.getByRole("button", { name: "Close scoreboard" }).click();
  await dwell(0.8);

  await mark("fast-forward");
  await playRemainingTurns(page);

  await page.getByRole("button", { name: "Play again" }).waitFor();
  await mark("over");
  await dwell(3.5);
  await mark("over-actions");
  await dwell(4);
}
