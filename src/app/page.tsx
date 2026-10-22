import StorefrontHome from "@/components/StorefrontHome";

// Served from the cache and re-rendered at most once a minute, instead of on
// every visit. Query URLs (?menu=, ?landingPageId=) are handled in
// next.config.ts, so this page never reads searchParams.
export const revalidate = 60;

export default function Home() {
  return <StorefrontHome />;
}
