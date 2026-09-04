import type { CategoryMenuItem } from "@/services/menuService";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import HorizontalCarousel from "./HorizontalCarousel";

interface Props {
  items?: CategoryMenuItem[];
}

export default function TopCategories({ items }: Props) {
  const categories = items ?? [];

  if (categories.length === 0) return null;

  return (
    <section style={{ padding: "15px 0" }}>
      <Container>
        <h2 style={{ fontSize: 16, fontWeight: 600, textTransform: "uppercase", color: "#222", marginBottom: 15 }}>
          TOP CATEGORIES
        </h2>

        {/* mobile: 3 items | sm: 5 items | lg: 7 items — gap 10px */}
        <HorizontalCarousel
          itemWidthClass="w-[calc(33.333%-7px)] sm:w-[calc(20%-8px)] lg:w-[calc(14.286%-9px)]"
          gap={10}
          autoplay
          interval={5000}
          showArrows={false}
        >
          {categories.map((cat) => (
            <Link key={cat.Id} href={`/?menu=${encodeURIComponent(cat.label)}`} className="group flex flex-col items-center">
              <div
                className="cat-img-box w-full bg-white overflow-hidden hover:shadow-md transition-shadow"
                style={{ borderRadius: 5, border: "1px solid #e5e7eb" }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={cat.imageUrl!}
                    alt={cat.label}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                    draggable={false}
                    unoptimized
                  />
                </div>
              </div>
              <span
                className="group-hover:text-[#C79524] transition-colors text-center mt-1 leading-tight line-clamp-2"
                style={{ fontSize: 12, textTransform: "capitalize", color: "#444" }}
              >
                {cat.label}
              </span>
            </Link>
          ))}
        </HorizontalCarousel>
      </Container>
    </section>
  );
}
