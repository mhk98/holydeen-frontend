import { notFound, permanentRedirect } from "next/navigation";
import { fetchLandingPage, landingPath } from "@/services/landingPageService";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Old address (/landing-page/<id>), still used by running ads: send it to the page's
// title URL (holydeen.com/<slug>) with a permanent redirect.
export default async function OldLandingPageUrl({ params }: PageProps) {
  const { id } = await params;
  const page = await fetchLandingPage(id);
  if (!page) notFound();
  permanentRedirect(landingPath(page));
}
