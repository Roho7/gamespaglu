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

async function aimDial(page: Page, to: number, over?: { totalMs: number }) {
  const slider = page.getByRole("slider");
  await slider.focus();
  const from = Number(await slider.getAttribute("aria-valuenow"));
  const delta = Math.round(to) - from;
  const key = delta > 0 ? "ArrowRight" : "ArrowLeft";
  if (over) {
    const steps = Math.abs(delta);
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(Math.max(10, over.totalMs / steps - 8));
    }
    return;
  }
  const big = Math.floor(Math.abs(delta) / 5);
  for (let i = 0; i < big; i++) await page.keyboard.press(`Shift+${key}`);
  for (let i = 0; i < Math.abs(delta) - big * 5; i++) await page.keyboard.press(key);
}

async function hold(page: Page, ms: number) {
  const dial = page.getByRole("button", { name: /Press and hold/ });
  const box = await dial.boundingBox();
  if (!box) throw new Error("dial not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
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
      await aimDial(page, offsetFrom(card.target, REMAINING_OFFSETS[who]));
      await lock.click();
    }
  }
}

const tab = (page: Page, name: string | RegExp) => page.getByRole("tab", { name });
const button = (page: Page, name: string | RegExp, exact = false) => page.getByRole("button", { name, exact });

async function endGame(page: Page) {
  await button(page, "End game").click();
  await tab(page, /One Psychic/).waitFor();
}

async function chooseRounds(page: Page, rounds: number) {
  await tab(page, "Rounds").click();
  await button(page, String(rounds), true).click();
}

async function typePlayers(page: Page, names: string[], delay: number) {
  const input = page.getByLabel("Player name");
  for (const name of names) {
    await input.pressSequentially(name, { delay });
    await button(page, "Add", true).click();
  }
}

async function playPsychicGame({ page, baseUrl, mark, dwell }: Recording) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const playLink = page.getByRole("link", { name: /Play Wavelength/ });
  await playLink.scrollIntoViewIfNeeded();
  await mark("home");
  await dwell(3.5);

  await playLink.click();
  await page.waitForURL("**/wavelength");
  await tab(page, /One Psychic/).waitFor();
  await mark("briefing");
  await dwell(3);

  await mark("modes-psychic");
  await tab(page, /One Psychic/).click();
  await dwell(2.5);
  await mark("modes-guesser");
  await tab(page, /One Guesser/).click();
  await dwell(2.5);
  await mark("modes-teams");
  await tab(page, /Teams/).click();
  await dwell(2.5);
  await tab(page, /One Psychic/).click();
  await page.waitForTimeout(300);

  await mark("rounds");
  await chooseRounds(page, 2);
  await dwell(3);

  await mark("players");
  await button(page, "Add players").click();
  await typePlayers(page, PLAYERS, 70);
  await dwell(3);

  await button(page, "Start game").click();
  await button(page, "Let them guess").waitFor();
  await mark("card");
  await dwell(3.5);

  const card = await currentCard(page);
  await mark("peek");
  await hold(page, 3500);
  await dwell(0.3);

  await mark("clue");
  await page.getByLabel("Clue").pressSequentially(clueFor(card), { delay: 80 });
  await dwell(2.5);
  await button(page, "Let them guess").click();

  await button(page, "Lock it in").waitFor();
  await mark("guess");
  await dwell(1);
  await aimDial(page, card.target, { totalMs: 2500 });
  await dwell(1);
  await button(page, "Lock it in").click();
  await dwell(1.2);
  await aimDial(page, offsetFrom(card.target, 6), { totalMs: 1800 });
  await dwell(1);
  await button(page, "Lock it in").click();

  await button(page, /^(Next card|Final score)$/).waitFor();
  await mark("reveal");
  await dwell(4);

  await mark("scoreboard");
  await button(page, "Open scoreboard").click();
  await dwell(3.5);
  await button(page, "Close scoreboard").click();
  await page.waitForTimeout(600);

  await mark("fast-forward");
  await playRemainingTurns(page);

  await button(page, "Play again").waitFor();
  await mark("over");
  await dwell(3.5);
  await mark("over-actions");
  await dwell(4);
}

async function playGuesserGame({ page, mark, dwell }: Recording) {
  await endGame(page);
  await tab(page, /One Guesser/).click();
  await chooseRounds(page, 1);
  await button(page, "Add players").click();
  await button(page, "Start game").click();
  await page.getByLabel("Clue").waitFor();
  await mark("guesser-lookaway");
  await dwell(3);

  const card = await currentCard(page);
  await mark("guesser-peek");
  await hold(page, 4500);
  await dwell(0.2);

  await mark("guesser-guess");
  await page.getByLabel("Clue").pressSequentially("Warm, sunny", { delay: 30 });
  await page.waitForTimeout(350);
  await button(page, /^Hand it to/).click();
  await button(page, "Lock it in").waitFor();
  await page.waitForTimeout(400);
  await aimDial(page, card.target, { totalMs: 2300 });
  await page.waitForTimeout(300);
  await button(page, "Lock it in").click();
  await button(page, /^(Next card|Final score)$/).waitFor();
  await mark("guesser-reveal");
  await dwell(4);
}

async function playTeamsGame({ page, mark, dwell }: Recording) {
  await endGame(page);
  await tab(page, /Teams/).click();
  await button(page, "Add players").click();
  await typePlayers(page, ["Mira"], 70);
  await mark("teams-players");
  await dwell(4);

  await button(page, "Start game").click();
  await page.getByLabel("Clue").waitFor();
  await mark("teams-turn");
  await dwell(1.2);
  const card = await currentCard(page);
  await hold(page, 3000);
  await dwell(0.3);

  await page.getByLabel("Clue").pressSequentially(clueFor(card), { delay: 30 });
  await page.waitForTimeout(250);
  await button(page, "Let them guess").click();
  await button(page, "Lock it in").waitFor();
  await mark("teams-guess");
  await page.waitForTimeout(800);
  await aimDial(page, card.target, { totalMs: 2800 });
  await page.waitForTimeout(250);
  await button(page, "Lock it in").click();
  await button(page, /^(Next card|Final score)$/).waitFor();
  await mark("teams-reveal");
  await dwell(4);
}

export default async function capture(rec: Recording) {
  rec.page.on("dialog", (dialog) => void dialog.accept());
  await playPsychicGame(rec);
  await playGuesserGame(rec);
  await playTeamsGame(rec);
}
