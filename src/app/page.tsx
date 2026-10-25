import { HomeGameCard } from "@/components/home/home-game-card";
import { HomeRail } from "@/components/home/home-rail";


export default function Home() {
  return (
    <>
      <HomeRail>
        <HomeGameCard
          more
          href="/wavelength"
          help="/how-to-play/wavelength"
          palette="miami"
          title="Play Wavelength"
          tagline="Do you share the same vibe?"
          image="/backgrounds/wavelength.jpg"
          rows={[
            { text: "Wave", kind: "title" },
            { text: "Length", kind: "title" },
          ]}
        />

        <HomeGameCard
          more
          href="/who-am-i"
          help="/how-to-play/who-am-i"
          palette="tangerine"
          title="Play Who Am I?"
          tagline="Phone on forehead. Guess who you are."
          image="/backgrounds/who-am-i.jpg"
          rows={[
            { text: "Who", kind: "title" },
            { text: "Am I?", kind: "title" },
            { text: "(Heads up)", kind: "subtitle" },
          ]}
          originY={0.2}
        />

        <HomeGameCard
          more
          href="/girgit/new"
          help="/how-to-play/girgit"
          palette="jungle"
          title="Play Girgit"
          tagline="Find the imposter who doesn't know the word."
          image="/backgrounds/chameleon.jpg"
          rows={[
            { text: "Girgit", kind: "title" },
            { text: "(Chameleon)", kind: "subtitle" },
          ]}
          originY={0.4}
        />

        <HomeGameCard
          more
          href="/mafia/new"
          help="/how-to-play/mafia"
          palette="cherry"
          title="Play Mafia"
          tagline="Secret roles. No narrator. Trust nobody."
          image="/backgrounds/mafia-1.jpg"
          rows={[{ text: "Mafia", kind: "title" }]}
        />

        <HomeGameCard
          href="/tiktiki/new"
          help="/how-to-play/tiktiki"
          palette="arcade"
          title="Play Tiktiki"
          tagline="Find the spy who doesn't know the word"
          image="/backgrounds/tiktiki.jpg"
          rows={[
            { text: "Tiktiki", kind: "title" },
            { text: "(Spyfall)", kind: "subtitle" },
          ]}
        />
      </HomeRail>
    </>
  );
}
