import type { Locator, Page } from "playwright";

import type { Recording } from "./recording";

const REVEAL_MS = 3400;

const button = (page: Page, name: string | RegExp, exact = false) => page.getByRole("button", { name, exact });

const nameOnScreen = (page: Page) => page.locator(".animate-stamp");

const label = (target: Locator) => target.locator("span.mb-display-sm");

const nameText = (page: Page) => nameOnScreen(page).locator("span").first();

async function generate(page: Page, action: "Generate" | "Regenerate") {
  await button(page, action, true).click();
  await page.waitForTimeout(REVEAL_MS);
  await nameOnScreen(page).waitFor();
}

async function openSettings(page: Page) {
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.waitForTimeout(400);
}

async function rail({ page, baseUrl, mark, dwell, focus }: Recording) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const play = page.getByRole("link", { name: /Play Who Am I/ });
  await play.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await mark("home");
  await dwell(4);

  await play.click();
  await page.waitForURL("**/who-am-i");
  await page.waitForLoadState("networkidle");
  await mark("rail-celebrity");
  await dwell(3);

  for (const deck of ["movie", "place", "animal", "object", "number"]) {
    await button(page, /^Next:/).click();
    await page.waitForTimeout(650);
    await mark(`rail-${deck}`);
    await dwell(1.4);
  }

  await mark("rail-back");
  for (let i = 0; i < 5; i++) {
    await button(page, /^Previous:/).click();
    await page.waitForTimeout(260);
  }
  await page.waitForTimeout(700);
  const pick = page.getByRole("link", { name: /Celebrity/ }).first();
  await focus("rail-pick", label(pick));
  await dwell(2.5);
  await pick.click();
  await page.waitForURL("**/who-am-i/celebrity");
}

async function asha({ page, mark, dwell, focus }: Recording) {
  await button(page, "Generate", true).waitFor();
  await page.waitForTimeout(500);
  await focus("generate", label(button(page, "Generate", true)));
  await mark("briefing");
  await dwell(2.5);

  await button(page, "Generate", true).click();
  await page.waitForTimeout(150);
  await mark("countdown");
  await focus("countdown-hint", page.getByText("Turn sideways"));
  await page.waitForTimeout(REVEAL_MS - 150);
  await nameOnScreen(page).waitFor();
  await page.waitForTimeout(400);
  await focus("name", nameText(page));
  await focus("regenerate", label(button(page, "Regenerate", true)));
  await mark("reveal");
  await dwell(3);
  for (const shot of ["ask-1", "ask-2", "ask-3", "ask-4", "ask-5", "stays"]) {
    await mark(shot);
    await dwell(3.5);
  }

  await mark("regenerated");
  await generate(page, "Regenerate");
  await dwell(5);
}

async function celebritySettings({ page, mark, dwell, focus }: Recording) {
  await page.reload({ waitUntil: "networkidle" });
  await openSettings(page);
  const cartoon = button(page, "Cartoon", true);
  await focus("chip-cartoon", cartoon);
  await mark("settings");
  await dwell(2);
  await cartoon.click();
  await mark("cartoon");
  await dwell(2.5);

  const india = button(page, "India");
  await india.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await focus("chip-india", india);
  await mark("where-from");
  await dwell(2.5);
  await india.click();
  await mark("india-off");
  await dwell(2.5);

  const historical = page.getByRole("checkbox", { name: /historical/ });
  await historical.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await focus("historical-toggle", historical);
  await mark("historical");
  await dwell(3);
  await historical.click();
  await mark("historical-on");
  await dwell(3);
}

async function otherDecks({ page, baseUrl, mark, dwell, focus }: Recording) {
  const open = async (deck: string) => {
    await page.goto(`${baseUrl}/who-am-i/${deck}`, { waitUntil: "networkidle" });
    await button(page, "Generate", true).waitFor();
  };

  await open("movie");
  await generate(page, "Generate");
  const year = page.locator("p.mb-caps").filter({ hasText: /^\d{4}$/ });
  await year.waitFor();
  await page.waitForTimeout(300);
  await focus("movie-year", year);
  await mark("movie-reveal");
  await dwell(6);

  await open("number");
  await openSettings(page);
  const range = page.getByRole("button", { name: "1–100", exact: true });
  await focus("range-chips", range.locator(".."));
  await mark("number-range");
  await dwell(1.5);
  await page.getByRole("button", { name: "1–50", exact: true }).click();
  await page.waitForTimeout(500);
  await range.click();
  await dwell(1.5);
  await generate(page, "Generate");
  await page.waitForTimeout(300);
  await focus("number-label", nameText(page));
  await mark("number-reveal");
  await dwell(5);

  for (const deck of ["place", "animal", "object"]) {
    await open(deck);
    await generate(page, "Generate");
    await page.waitForTimeout(300);
    await mark(`${deck}-reveal`);
    await dwell(3);
  }
}

async function goAgain({ page, baseUrl, mark, dwell }: Recording) {
  await page.goto(`${baseUrl}/who-am-i/celebrity`, { waitUntil: "networkidle" });
  await openSettings(page);
  await button(page, "All", true).click();
  await page.getByRole("tab", { name: "How to play" }).click();
  await generate(page, "Generate");
  await page.waitForTimeout(300);
  await mark("win");
  await dwell(4.5);
  await mark("win-next");
  await generate(page, "Regenerate");
  await dwell(3);
}

export default async function capture(rec: Recording) {
  await rail(rec);
  await asha(rec);
  await celebritySettings(rec);
  await otherDecks(rec);
  await goAgain(rec);
}
