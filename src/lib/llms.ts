import { GUIDES, type Guide } from "@/content/guides";
import { CATEGORY_LIST } from "@/lib/deck/categories";
import { SITE } from "@/lib/site-config";

const url = (path: string) => `${SITE.url}${path}`;

const ABOUT = [
  `> ${SITE.description}`,
  "",
  "Games Paglu is a phone aid for party games played in person, around one table. It is not an online multiplayer game: everyone is in the same room, talking out loud, and the phones handle the secrets, the timers and the score.",
  "",
  "- Free, no accounts, no app to install. It is a web app and can be added to the home screen.",
  "- Who Am I?, Wavelength, the random generators and the scoreboard need no room and work with no signal.",
  "- Girgit, Mafia and Tiktiki use a room code, so every player needs a phone and a connection.",
  "- Curated for Indian and international groups: names and titles the whole room will recognise.",
];

function guideLine(guide: Guide) {
  const also = guide.alsoCalled?.length ? ` Also called ${guide.alsoCalled.join(", ")}.` : "";
  return `- [${guide.title}](${url(`/how-to-play/${guide.slug}`)}): ${guide.summary} ${guide.players} players. ${guide.needs}.${also}`;
}

/**
 * The `/llms.txt` index (llmstxt.org): what the site is and a link to every
 * page worth reading, for AI agents and answer engines.
 */
export function llmsIndex() {
  return [
    `# ${SITE.name}`,
    "",
    ...ABOUT,
    "",
    "## How to play",
    "",
    ...GUIDES.map(guideLine),
    "",
    "## Play",
    "",
    ...GUIDES.flatMap((g) =>
      g.playRoute
        ? [`- [${g.title.replace(/^How to (play|use) (the )?/, "")}](${url(g.playRoute)})`]
        : [],
    ),
    "",
    "## Random generators",
    "",
    ...CATEGORY_LIST.map(
      (c) => `- [${c.seoTitle}](${url(`/${c.seoSlug}`)}): ${c.seoDescription}`,
    ),
    "",
    "## Optional",
    "",
    `- [Full rules in one file](${url("/llms-full.txt")}): every guide's steps, variations and FAQ`,
    `- [${SITE.sibling.name}](${SITE.sibling.url}): ${SITE.sibling.pitch}`,
    "",
  ].join("\n");
}

function guideSection(guide: Guide) {
  return [
    `## ${guide.title}`,
    "",
    `Source: ${url(`/how-to-play/${guide.slug}`)}`,
    guide.playRoute ? `Play: ${url(guide.playRoute)}` : null,
    `Players: ${guide.players}. Time: ${guide.time}. Needs: ${guide.needs}.`,
    guide.alsoCalled?.length ? `Also called: ${guide.alsoCalled.join(", ")}.` : null,
    "",
    ...guide.intro.flatMap((p) => [p, ""]),
    "### Steps",
    "",
    ...guide.steps.map((s, i) => `${i + 1}. **${s.title}.** ${s.body}`),
    "",
    ...(guide.variations?.length
      ? ["### Variations", "", ...guide.variations.map((v) => `- **${v.title}.** ${v.body}`), ""]
      : []),
    ...(guide.faq?.length
      ? ["### FAQ", "", ...guide.faq.flatMap((f) => [`**${f.q}**`, "", f.a, ""])]
      : []),
  ].filter((line) => line !== null);
}

/** The `/llms-full.txt` companion: every guide in full, in one file. */
export function llmsFull() {
  return [
    `# ${SITE.name}: full rules`,
    "",
    ...ABOUT,
    "",
    ...GUIDES.flatMap(guideSection),
  ].join("\n");
}
