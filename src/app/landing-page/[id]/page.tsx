import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import { IMAGES } from "@/lib/api";
import { fetchLandingPage, LandingPageData, LandingProductOption } from "@/services/landingPageService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import LandingOrderForm, { LandingOrderOption } from "./LandingOrderForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

const stripHtml = (value?: string | null) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

const parseObject = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const toNumber = (value: unknown, fallback = 0) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : fallback;
};

const formatMoney = (value: number) => value.toLocaleString("en-US");

function toImageUrl(file?: string | null) {
  const value = String(file || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("/images/")) return `${IMAGES}${value.slice("/images".length)}`;
  if (value.startsWith("/")) return value;
  return `${IMAGES}/${value.replace(/^images\//, "")}`;
}

const splitLines = (value: string) => {
  const lines = stripHtml(value)
    .split(/\n|•|✅|▪️|-/)
    .map((item) => item.trim())
    .filter(Boolean);
  return lines;
};

function buildProductOptions(page: LandingPageData, image: string): LandingOrderOption[] {
  const regularData = parseObject(page.regularData);
  const configured = Array.isArray(regularData.productOptions)
    ? (regularData.productOptions as LandingProductOption[])
    : [];
  const options = configured
    .map((item, index) => ({
      id: String(item.productId || item.id || index),
      productId: item.productId || item.id || page.productId || page.Id,
      name: String(item.name || page.product || page.title || "Landing Product"),
      price: toNumber(item.price, toNumber(page.price, 1899)),
      originalPrice: toNumber(item.originalPrice, toNumber(page.originalPrice, 2500)),
      image: toImageUrl(String(item.image || page.bannerImageUrl || image)),
    }))
    .filter((item) => item.name && item.price > 0);

  if (options.length) return options;

  return [
    {
      id: String(page.productId || page.Id),
      productId: page.productId || page.Id,
      name: page.product || page.title || "Product",
      price: toNumber(page.price, 0),
      originalPrice: toNumber(page.originalPrice, 0),
      image: toImageUrl(image),
    },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const page = await fetchLandingPage(id);
  if (!page) return { title: "Landing Page - Holy Deen" };
  return {
    title: `${page.title} - Holy Deen`,
    description: stripHtml(page.shortDescription || page.description || page.subTitle || ""),
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { id } = await params;
  const [page, settings] = await Promise.all([
    fetchLandingPage(id),
    fetchSiteSettings().catch(() => ({} as Partial<SiteSetting>)),
  ]);
  if (!page) notFound();

  const regularData = parseObject(page.regularData);
  const colors = parseObject(regularData.colors);
  const price = toNumber(page.price, 0);
  const heroImage = toImageUrl(page.bannerImageUrl || "");
  const productOptions = buildProductOptions(page, heroImage);
  const carouselItems = buildCarouselItems(regularData.carouselItems, productOptions);
  const phone = page.phone || settings.phone || "";
  const problemItems = splitLines(page.shortDescription || "");
  const whyItems = splitLines(page.whyChooseUs || "");
  const descriptionItems = splitLines(page.description || "");
  const ctaText = String(regularData.ctaText || "অর্ডার করতে ক্লিক করুন");
  const orderTitle = String(regularData.orderTitle || "অর্ডার করতে আপনার সঠিক তথ্য দিয়ে নিচের ফর্মটি সম্পূর্ণ পূরণ করুন।");
  const priceLine = String(regularData.priceLine || "");
  const pricePrefix = String(regularData.pricePrefix || "মাত্র");
  const priceSuffix = String(regularData.priceSuffix || "টাকায়");
  const sizeTitle = String(regularData.sizeTitle || "");
  const introText = String(regularData.introText || "");
  const offerImageTitle = String(regularData.offerImageTitle || "");
  const deliveryInside = toNumber(regularData.deliveryInside, 70);
  const deliveryOutside = toNumber(regularData.deliveryOutside, 130);
  const headingItems = buildHeadingItems(regularData.headings);
  const featureImages = buildFeatureImages(regularData.images || regularData.featureImages);
  const heroBg = String(colors.heroBg || "#e8f7e4");
  const accentColor = String(colors.accent || "#8d1f5f");

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <TopStrip phone={phone} />

      <section className="px-4 pb-14 pt-6 text-center" style={{ backgroundColor: heroBg }}>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black leading-tight md:text-6xl" style={{ color: accentColor }}>
            {page.title}
          </h1>
          {page.subTitle ? (
            <p className="mt-3 text-2xl font-black leading-tight text-black md:text-4xl">
              {page.subTitle}
            </p>
          ) : null}
          {heroImage ? (
            <img
              src={heroImage}
              alt={page.product || page.title}
              className="mx-auto mt-8 w-full max-w-5xl rounded-md object-contain shadow-sm"
            />
          ) : null}
          <a
            href="#order-now"
            className="mt-8 inline-flex rounded-full border-4 border-white bg-[#05a925] px-8 py-3 text-xl font-black text-white shadow-md transition hover:bg-[#068c22]"
          >
            🛒 {ctaText}
          </a>
        </div>
      </section>

      {headingItems.length ? (
        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
            {headingItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-md border border-slate-100 bg-white p-6 text-center shadow-sm">
                <h3 className="text-2xl font-black leading-tight" style={{ color: accentColor }}>
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-4 text-base font-bold leading-7 text-slate-950">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(page.descriptionTitle || page.shortDescription) ? (
        <InfoSection
          title={page.descriptionTitle || "কেন টক ঝালের আচার কষা আপনার জন্য?"}
          lines={textLines(page.shortDescription || "")}
          accentColor={accentColor}
        />
      ) : null}

      {(page.whyChooseTitle || whyItems.length > 0) ? (
        <section className="px-4 py-16" style={{ backgroundColor: heroBg }}>
          <div className="mx-auto max-w-4xl text-center">
            {page.whyChooseTitle ? (
              <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ color: accentColor }}>
                {page.whyChooseTitle}
              </h2>
            ) : null}
            <Paragraphs lines={whyItems} />
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="mt-10 inline-flex rounded-full border-4 border-white bg-[#05a925] px-8 py-3 text-xl font-black text-white shadow-md"
              >
                📞 {phone}
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {descriptionItems.length > 0 ? (
        <InfoSection title={sizeTitle} lines={descriptionItems} accentColor={accentColor} />
      ) : null}

      {featureImages.length ? (
        <section className="bg-white px-4 py-12">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
            {featureImages.map((item, index) => (
              <div key={`${item.image}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <img src={item.image} alt={item.alt || page.title} className="aspect-square w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <LandingOrderForm
        landingId={page.Id}
        title={page.title}
        options={productOptions}
        phone={phone}
        deliveryInside={deliveryInside}
        deliveryOutside={deliveryOutside}
        orderTitle={orderTitle}
        ctaText={ctaText}
        orderForm={parseObject(regularData.orderForm)}
      />

      <Footer settings={settings} />
    </main>
  );
}

function TopStrip({ phone }: { phone: string }) {
  return (
    <div className="bg-[#1d1d1b] px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm font-black">
        <span>Need any help? Call {phone || "01779263501"}</span>
        <div className="flex items-center gap-5 text-[#ffb000]">
          <a href="/track-order">Track your order</a>
          <span>f</span>
          <span>▶</span>
          <span>♪</span>
          <span>◎</span>
        </div>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  lines,
  accentColor,
}: {
  title?: string;
  lines: string[];
  accentColor: string;
}) {
  if (!title && !lines.length) return null;
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        {title ? (
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ color: accentColor }}>
            {title}
          </h2>
        ) : null}
        <Paragraphs lines={lines} />
      </div>
    </section>
  );
}

function Paragraphs({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="mt-8 space-y-4 text-lg font-medium leading-9 text-slate-950">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function textLines(value?: string | null) {
  return stripHtml(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildHeadingItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        title: String(row.title || "").trim(),
        description: stripHtml(String(row.description || "")),
      };
    })
    .filter((item) => item.title || item.description);
}

function buildFeatureImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { image: toImageUrl(item), alt: "" };
      const row = item as Record<string, unknown>;
      return {
        image: toImageUrl(String(row.image || row.imageUrl || row.url || "")),
        alt: String(row.alt || row.title || ""),
      };
    })
    .filter((item) => item.image);
}

function DynamicList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mx-auto mt-6 max-w-4xl space-y-3 text-left text-lg font-bold text-gray-600">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-1 h-4 w-4 rounded-full bg-yellow-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProductCardCarousel({
  options,
}: {
  options: CarouselItem[];
}) {
  const carouselItems =
    options.length >= 4
      ? options
      : Array.from({ length: 4 }, (_, index) => options[index % options.length]).filter(
          (item): item is CarouselItem => Boolean(item),
        );
  const repeatedItems = [...carouselItems, ...carouselItems];

  return (
    <div className="mx-auto max-w-[1140px] overflow-hidden">
      <style>{`
        @keyframes murda-product-slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .murda-product-track {
          animation: murda-product-slide 22s linear infinite;
        }
        .murda-product-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="murda-product-track flex w-max gap-4">
        {repeatedItems.map((option, index) => (
          <div
            key={`${option.id}-${index}`}
            className="w-[82vw] max-w-[270px] flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-white shadow-sm sm:w-[45vw] lg:w-[270px]"
          >
            <div className="aspect-square overflow-hidden bg-slate-50">
              <img
                src={option.image || ""}
                alt={option.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type CarouselItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
};

function buildCarouselItems(value: unknown, fallback: LandingOrderOption[]): CarouselItem[] {
  const configured = Array.isArray(value) ? value : [];
  const items = configured
    .map((item, index) => {
      const card = item as Record<string, unknown>;
      return {
        id: String(card.id || card.productId || `carousel-${index}`),
        name: String(card.name || ""),
        price: toNumber(card.price, 0),
        originalPrice: toNumber(card.originalPrice, 0),
        image: String(card.image || ""),
      };
    })
    .filter((item) => item.name || item.image);

  if (items.length) return items;

  return fallback.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.image,
  }));
}

function IntroText({ value }: { value: string }) {
  const lines = stripHtml(value)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="mb-6 text-center text-2xl font-black leading-9 text-neutral-950">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
