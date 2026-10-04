import {
  EB_Garamond,
  IBM_Plex_Sans,
  Inter,
  Khand,
  Lato,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Montserrat,
  Nunito_Sans,
  Open_Sans,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
  Roboto_Condensed,
  Source_Sans_3,
  Work_Sans,
} from "next/font/google";

/**
 * Every typeface the resume can be set in.
 *
 * These have to be loaded here rather than merely named in CSS: the font
 * picker used to offer Inter, Lato, Poppins and the rest while nothing ever
 * fetched them, so choosing one silently rendered — and printed — in the
 * browser's default sans. A family is only real if something registers an
 * @font-face for it.
 *
 * Loaded through next/font, so the files are served from this origin. That is
 * what keeps the privacy policy's "no third-party font CDN" claim true.
 *
 * Only Khand is preloaded: it dresses the site chrome and is the default. The
 * rest are fetched on demand, when a document actually asks for one, so
 * offering eighteen faces costs a first-time visitor nothing.
 *
 * Every call passes a literal object — next/font reads these at build time and
 * rejects a spread, so the repetition is required rather than careless.
 */
export const khand = Khand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-khand",
  weight: ["300", "400", "500", "600", "700"],
});

// --- Sans (variable weight axes) ---
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});
const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  preload: false,
});
const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  preload: false,
});
const raleway = Raleway({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-raleway",
  preload: false,
});
const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
  preload: false,
});
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito-sans",
  preload: false,
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  preload: false,
});
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
  preload: false,
});

// --- Sans with fixed weights: several have no 500 or 600 at all ---
const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
  weight: ["400", "700"],
  preload: false,
});
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

// --- Serif ---
const merriweather = Merriweather({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-merriweather",
  preload: false,
});
const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  preload: false,
});
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-eb-garamond",
  preload: false,
});
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  preload: false,
});

/** Applied to <body> so every `var(--font-…)` resolves anywhere in the tree. */
export const FONT_VARIABLES = [
  khand,
  inter,
  roboto,
  openSans,
  montserrat,
  raleway,
  workSans,
  nunitoSans,
  sourceSans,
  robotoCondensed,
  lato,
  poppins,
  ibmPlexSans,
  merriweather,
  lora,
  playfair,
  ebGaramond,
  libreBaskerville,
]
  .map((f) => f.variable)
  .join(" ");
