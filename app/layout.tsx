import type { Metadata, Viewport } from "next";
import { inter, jetbrainsMono } from "@/lib/fonts";
import { Navbar, Footer } from "@/components/layout";
import { JourneyRail } from "@/components/journey";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Debayan Biswas — Software Engineer",
    template: "%s | Debayan Biswas",
  },
  description:
    "Backend and systems engineer. Production analytics, agentic runtimes, data pipelines, LLM and MCP integrations.",
  metadataBase: new URL("https://debayan.dev"),
  openGraph: {
    title: "Debayan Biswas — Software Engineer",
    description:
      "Backend and systems engineer. Production analytics, agentic runtimes, data pipelines, LLM and MCP integrations.",
    url: "https://debayan.dev",
    siteName: "Debayan Biswas",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Debayan Biswas — Software Engineer",
    description:
      "Backend and systems engineer. Production analytics, agentic runtimes, data pipelines, LLM and MCP integrations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-background font-sans text-foreground antialiased">
        {/* Ambient background glow */}
        <div className="ambient-glow" aria-hidden="true" />
        <div
          className="pointer-events-none fixed inset-0 -z-[15] overflow-x-hidden"
          aria-hidden="true"
        >
          <div className="gradient-blob gradient-blob--blue" />
          <div className="gradient-blob gradient-blob--purple" />
        </div>

        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="min-w-0 max-w-full overflow-x-hidden pt-16">
          {children}
        </main>
        <JourneyRail />
        <Footer />
      </body>
    </html>
  );
}
