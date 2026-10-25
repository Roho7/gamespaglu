import { placeName, type PlaceId } from "@shared/protocol";

/**
 * The photo on each Tiktiki card, dithered into the game's inks. Drop a JPEG at the path; until
 * one exists the card shows a grain gradient. PNGs run through `npm run backgrounds`.
 */
export const placeArt = (id: PlaceId) => `/places/${id}.jpg`;

/** The Tiktiki's own card: the lizard on the wall. */
export const TIKTIKI_ART = "/places/tiktiki.jpg";

type Credit = { id: PlaceId | "tiktiki"; author: string; license: string; href: string };

const CREDITS: Credit[] = [
  { id: "laboratory", author: "Yigit Altay", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Engin_Umut_Akkaya_-_In_the_Lab.JPG" },
  { id: "classroom", author: "Marie-Lan Nguyen", license: "CC BY 2.5", href: "https://commons.wikimedia.org/wiki/File:Grande_salle_ENC_n1.jpg" },
  { id: "airport", author: "High Contrast", license: "CC BY 3.0 de", href: "https://commons.wikimedia.org/wiki/File:An_A380_at_Munich_airport,_2012.jpg" },
  { id: "train-station", author: "mattbuck", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Twickenham_railway_station_MMB_03_450550_450558.jpg" },
  { id: "beach", author: "Jebulon", license: "CC0", href: "https://commons.wikimedia.org/wiki/File:Parasols,_Evening,_Beach,_Rincon_de_la_Victoria,_Andalusia,_Spain.jpg" },
  { id: "library", author: "Ralf Roletschek", license: "CC BY 3.0", href: "https://commons.wikimedia.org/wiki/File:13-11-02-olb-by-RalfR-03.jpg" },
  { id: "circus", author: "Velvet", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Lille_chapiteau_champ_de_mars.jpg" },
  { id: "spaceship", author: "Gzzz", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Atlantis_Kennedy_Space_Center_Visitor_Complex_2.jpg" },
  { id: "petrol-pump", author: "Nikhilb239", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:HP_Petrol_Bunk_31102016.jpg" },
  { id: "tiktiki", author: "Basile Morin", license: "CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Common_House_Gecko_with_open_mouth,_in_Laos.jpg" },
  { id: "temple", author: "Joydeep", license: "CC BY-SA 3.0", href: "https://commons.wikimedia.org/wiki/File:Samadhi_Mandir_of_Srila_Prabhupada,_Mayapur_07102013_001.jpg" },
  { id: "wedding", author: "AmanAgrahari01", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Indian_Traditional_Wedding_Images_(40).jpg" },
  { id: "cricket-stadium", author: "Calistemon", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Wicket_of_Jermaine_Blackwood_batting_at_Perth_Stadium,_First_Test_Australia_versus_West_Indies,_2_December_2022.jpg" },
  { id: "swimming-pool", author: "KeepActive Australia from Melbourne, VIC, Australia", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Public_Swimming_Pool_in_Melbourne_VIC_Australia.jpg" },
  { id: "hospital", author: "AnjanBorah", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:A_hospital_ward_in_Assam_in_response_to_the_2020_COVID-19_pandemic.jpg" },
  { id: "cinema", author: "Dllu", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Auditorium_in_the_Frick_Fine_Arts_Building.jpg" },
  { id: "restaurant-kitchen", author: "PattayaPatrol", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:DZ6_0553_Busy_kitchen_staff_prepare_meals_behind_the_counter_as_a_customer_waits_and_watches.jpg" },
  { id: "supermarket", author: "Wilfredor", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Aisle_in_L_Intermarche_supermarket_in_Quebec_City.jpg" },
  { id: "hotel", author: "Basile Morin", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Lobby_hall_with_couches_and_chandelier_at_The_Fullerton_Bay_Hotel_Singapore.jpg" },
  { id: "office", author: "VeronicaTherese", license: "CC BY-SA 3.0", href: "https://commons.wikimedia.org/wiki/File:OpenPlanRedBalloon1.jpg" },
  { id: "pirate-ship", author: "Natasha Jelezkina from Chicago, USA", license: "CC BY-SA 2.0", href: "https://commons.wikimedia.org/wiki/File:EL_GALE%C3%93N_ANDALUC%C3%8DA_Homeport_Sevilla,_Spain_Tall_Ships_Chicago_2016_at_Navy_Pier._(28379675990).jpg" },
];

/** Who took each photo and under what licence, for the guide's credits. Every photo in public/places is listed. */
export const PLACE_CREDITS = CREDITS.map((c) => ({
  label: c.id === "tiktiki" ? "The Tiktiki" : placeName(c.id),
  author: c.author,
  license: c.license,
  href: c.href,
}));
