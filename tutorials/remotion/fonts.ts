import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const bebas = loadBebas("normal", { weights: ["400"], subsets: ["latin"] });
const montserrat = loadMontserrat("normal", { weights: ["500", "700"], subsets: ["latin"] });

export const DISPLAY = bebas.fontFamily;
export const BODY = montserrat.fontFamily;
