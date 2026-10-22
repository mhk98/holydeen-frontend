import StorefrontHome from "@/components/StorefrontHome";

// Category view. Links keep using /?menu=...&sub=...&child=...; next.config.ts
// rewrites those requests here so the plain home page can stay static.
export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ menu?: string; sub?: string; child?: string }>;
}) {
  const { menu, sub, child } = await searchParams;
  return <StorefrontHome menu={menu} sub={sub} child={child} />;
}
