import { Inter, JetBrains_Mono } from "next/font/google";

/** Limit weights to what the UI uses (400–700) to shrink the font payload. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
  adjustFontFallback: true,
});
