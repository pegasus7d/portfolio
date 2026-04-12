/**
 * Canonical origin for Open Graph, sitemap, robots, and JSON-LD.
 * On Vercel: defaults to the .vercel.app deployment URL.
 * When a custom domain is primary, set NEXT_PUBLIC_SITE_URL in project env (e.g. https://debayan.dev).
 */
function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/$/, "");
}

export const siteUrl: string = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return normalizeSiteUrl(fromEnv);
  return "https://debayan.vercel.app";
})();

export const siteUrlObject = new URL(siteUrl);
