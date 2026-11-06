import Image from "next/image";
import Container from "./Container";
import type { CategoryDetails } from "@/services/menuService";

export default function CategoryBanner({ category }: { category: CategoryDetails }) {
  const { label, bannerImageUrl, bannerTitle } = category;
  if (!bannerImageUrl && !bannerTitle) return null;

  return (
    <section style={{ marginTop: 16 }}>
      <Container>
        {bannerImageUrl && (
          <Image
            src={bannerImageUrl}
            alt={bannerTitle || label}
            width={1920}
            height={1080}
            sizes="90vw"
            priority
            style={{ display: "block", width: "100%", height: "auto", borderRadius: 16 }}
          />
        )}
        {bannerTitle && (
          <div style={{ maxWidth: 900, margin: "28px auto 8px", textAlign: "center" }}>
            <p className="text-gray-400" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              {label}
            </p>
            <h1
              className="text-gray-900"
              style={{ fontSize: "clamp(22px, 4vw, 44px)", fontWeight: 700, lineHeight: 1.25 }}
            >
              {bannerTitle}
            </h1>
          </div>
        )}
      </Container>
    </section>
  );
}
