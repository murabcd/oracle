const normalizeSiteUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
};

const siteUrl =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL) ??
  normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeSiteUrl(process.env.VERCEL_URL) ??
  "https://oracle-oss.vercel.app";

export const siteConfig = {
  name: "Oracle",
  description:
    "Oracle is a visual AI playground for building node-based text, image, and reasoning workflows with OpenAI models.",
  url: siteUrl,
  ogImage: "/opengraph-image",
  ogImageAlt:
    "Oracle visual AI workflow canvas with connected nodes and reasoning output.",
  creator: "murabcd",
  keywords: [
    "Oracle",
    "AI workflow builder",
    "visual AI playground",
    "Next.js",
    "OpenAI",
    "node-based editor",
  ],
} as const;
