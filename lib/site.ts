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
    "Oracle is a visual thinking and synthesis workspace for product work. Turn messy inputs into connected insights, decisions, and artifacts on a shared canvas.",
  url: siteUrl,
  ogImage: "/opengraph-image",
  ogImageAlt:
    "Oracle visual thinking canvas for product research, synthesis, and artifact creation.",
  creator: "murabcd",
  keywords: [
    "Oracle",
    "product thinking workspace",
    "product synthesis canvas",
    "research synthesis",
    "AI canvas for product managers",
    "visual workspace for product work",
  ],
} as const;
