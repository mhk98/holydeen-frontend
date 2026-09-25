import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import { IMAGES } from "@/lib/api";
import {
  fetchLandingHeader,
  fetchLandingPage,
  LandingHeaderData,
  LandingPageData,
  LandingProductOption,
} from "@/services/landingPageService";
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
  if (typeof value === "object" && !Array.isArray(value))
    return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
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
  if (value.startsWith("/images/"))
    return `${IMAGES}${value.slice("/images".length)}`;
  if (value.startsWith("/")) return value;
  return `${IMAGES}/${value.replace(/^images\//, "")}`;
}


function buildProductOptions(
  page: LandingPageData,
  image: string,
): LandingOrderOption[] {
  const regularData = parseObject(page.regularData);
  const configured = Array.isArray(regularData.productOptions)
    ? (regularData.productOptions as LandingProductOption[])
    : [];
  const options = configured
    .map((item, index) => ({
      id: String(item.productId || item.id || index),
      productId: item.productId || item.id || page.productId || page.Id,
      name: String(
        item.name || page.product || page.title || "Landing Product",
      ),
      price: toNumber(item.price, toNumber(page.price, 1899)),
      originalPrice: toNumber(
        item.originalPrice,
        toNumber(page.originalPrice, 2500),
      ),
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
    description: stripHtml(
      page.shortDescription || page.description || page.subTitle || "",
    ),
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { id } = await params;
  const [page, settings, header] = await Promise.all([
    fetchLandingPage(id),
    fetchSiteSettings().catch(() => ({}) as Partial<SiteSetting>),
    fetchLandingHeader(),
  ]);
  if (!page) notFound();

  const regularData = parseObject(page.regularData);
  const colors = {
    ...DEFAULT_COLORS,
    ...parseObject(regularData.colors),
  } as Record<keyof typeof DEFAULT_COLORS, string>;
  const heroImage = toImageUrl(page.bannerImageUrl || "");
  const productOptions = buildProductOptions(page, heroImage);
  const phone = String(
    page.phone || header?.supportPhone || settings.phone || "",
  ).trim();
  const whyLines = textLines(page.whyChooseUs || "");
  const descriptionLines = textLines(
    page.description || page.shortDescription || "",
  );
  const videoEmbedUrl = getVideoEmbedUrl(page.video);
  const ctaText = String(regularData.ctaText || "অর্ডার করতে ক্লিক করুন");
  const orderTitle = String(
    regularData.orderTitle ||
      "অর্ডার করতে আপনার সঠিক তথ্য দিয়ে নিচের ফর্মটি সম্পূর্ণ পূরণ করুন।",
  );
  const deliveryInside = toNumber(regularData.deliveryInside, 70);
  const deliveryOutside = toNumber(regularData.deliveryOutside, 130);
  const headingItems = buildHeadingItems(regularData.headings);
  const featureSectionTitle = String(regularData.featureSectionTitle || "");
  const featureImages = buildFeatureImages(
    regularData.images || regularData.featureImages,
  );
  const reviewHeading = String(page.reviewTitle || "");
  const reviewSubHeading = String(regularData.reviewSubTitle || "");
  const reviewRegularPriceLabel = String(
    regularData.reviewRegularPriceLabel || "",
  );
  const reviewOfferPriceLabel = String(regularData.reviewOfferPriceLabel || "");
  const reviewButtonText = String(regularData.reviewButtonText || "");
  // Page-level prices win; otherwise show the first checkout product's prices.
  const reviewOfferPrice =
    toNumber(page.price, 0) || toNumber(productOptions[0]?.price, 0);
  const reviewRegularPrice =
    toNumber(page.originalPrice, 0) ||
    toNumber(productOptions[0]?.originalPrice, 0);
  const hasReviewSection = Boolean(
    reviewHeading ||
      reviewSubHeading ||
      reviewRegularPriceLabel ||
      reviewOfferPriceLabel ||
      reviewButtonText,
  );
  const buttonStyle = {
    backgroundColor: colors.buttonColor,
    color: colors.buttonTextColor,
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="landing-root">
        <TopStrip phone={phone} header={header} />

        <section className="bg-[#e4f3df] px-4 pb-14 pt-8 text-center">
          <div className="mx-auto max-w-5xl">
            {header?.status !== false && header?.logoUrl ? (
              <img
                src={toImageUrl(header.logoUrl)}
                alt={header.logoAlt || "Website logo"}
                className="mx-auto mb-5 h-20 max-w-64 object-contain"
              />
            ) : null}
            <h1
              className="text-3xl font-black leading-tight md:text-5xl"
              style={{ color: colors.titleColor }}
            >
              {page.title}
            </h1>
            {page.subTitle ? (
              <p
                className="mt-4 text-xl font-black leading-snug md:text-3xl"
                style={{ color: colors.subTitleColor }}
              >
                {page.subTitle}
              </p>
            ) : null}
            {heroImage ? (
              <div className="mx-auto mt-7 overflow-hidden rounded-md bg-white shadow-sm">
                <img
                  src={heroImage}
                  alt={page.product || page.title}
                  className="w-full object-cover"
                />
              </div>
            ) : null}
            <LandingButton href="#order-now" style={buttonStyle}>
              🛒 {ctaText}
            </LandingButton>
          </div>
        </section>

        {headingItems.length ? (
          <section className="px-4 py-12">
            <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4">
              {headingItems.map((item, index) => (
                <div
                  key={`heading-${index}`}
                  className="w-full rounded-lg px-5 py-6 text-center shadow-sm sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                  style={{ backgroundColor: item.backgroundColor || "#ffffff" }}
                >
                  {item.title ? (
                    <h3
                      className="text-xl font-black leading-snug"
                      style={{ color: colors.headingColor }}
                    >
                      {item.title}
                    </h3>
                  ) : null}
                  {item.subtitle ? (
                    <p
                      className="mt-3 text-sm font-semibold leading-6"
                      style={{ color: colors.fontColor }}
                    >
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {hasReviewSection ? (
          <section
            className="px-4 py-14 text-center"
            style={{ backgroundColor: colors.sectionBgColor }}
          >
            {reviewHeading ? (
              <h2
                className="text-3xl font-black leading-tight md:text-5xl"
                style={{ color: colors.headingColor }}
              >
                {reviewHeading}
              </h2>
            ) : null}
            {reviewSubHeading ? (
              <p
                className="mt-3 text-sm font-semibold"
                style={{ color: colors.fontColor }}
              >
                {reviewSubHeading}
              </p>
            ) : null}
            {reviewRegularPriceLabel && reviewRegularPrice > 0 ? (
              <p className="mt-12 text-2xl font-black text-slate-600">
                {reviewRegularPriceLabel}{" "}
                <span className="line-through">
                  {formatMoney(reviewRegularPrice)}/- টাকা
                </span>
              </p>
            ) : null}
            {reviewOfferPriceLabel && reviewOfferPrice > 0 ? (
              <p
                className="mt-5 text-3xl font-black md:text-5xl"
                style={{ color: colors.headingColor }}
              >
                {reviewOfferPriceLabel}{" "}
                <span className="text-green-600">
                  {formatMoney(reviewOfferPrice)}/- টাকা
                </span>
              </p>
            ) : null}
            {reviewButtonText ? (
              <LandingButton href="#order-now" style={buttonStyle}>
                {reviewButtonText}
              </LandingButton>
            ) : null}
          </section>
        ) : null}

        {page.descriptionTitle || descriptionLines.length || videoEmbedUrl ? (
          <section className="px-4 py-16 text-center">
            <div className="mx-auto max-w-5xl">
              {page.descriptionTitle ? (
                <h2
                  className="text-3xl font-black leading-tight md:text-5xl"
                  style={{ color: colors.headingColor }}
                >
                  {page.descriptionTitle}
                </h2>
              ) : null}
              <Paragraphs
                lines={descriptionLines}
                color={colors.fontColor}
                className="mx-auto mt-6 max-w-4xl"
              />
              {videoEmbedUrl ? (
                <div className="mx-auto mt-8 aspect-video max-w-3xl overflow-hidden rounded-lg bg-black shadow-sm">
                  <iframe
                    src={videoEmbedUrl}
                    title={page.title || "Campaign video"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : null}
              <LandingButton href="#order-now" style={buttonStyle}>
                📞 অর্ডার করতে চাই
              </LandingButton>
            </div>
          </section>
        ) : null}

        {featureImages.length ? (
          <section
            className="px-4 py-16"
            style={{ backgroundColor: colors.sectionBgColor }}
          >
            <div className="mx-auto max-w-5xl">
              {featureSectionTitle ? (
                <h2
                  className="text-center text-3xl font-black leading-tight md:text-5xl"
                  style={{ color: colors.headingColor }}
                >
                  {featureSectionTitle}
                </h2>
              ) : null}
              <div className="mt-10 flex flex-wrap justify-center gap-5">
                {featureImages.map((item, index) => (
                  <div
                    key={`${item.image}-${index}`}
                    className="w-full overflow-hidden rounded-lg bg-white text-center shadow-sm sm:w-[calc(50%-0.625rem)] lg:w-[calc(20%-1rem)]"
                  >
                    <img
                      src={item.image}
                      alt={item.alt || `Feature ${index + 1}`}
                      className="h-36 w-full object-cover"
                    />
                    {item.alt ? (
                      <p
                        className="px-3 py-4 text-base font-black"
                        style={{ color: colors.headingColor }}
                      >
                        {item.alt}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.whyChooseTitle || whyLines.length || phone ? (
          <section
            className="px-4 py-16"
            style={{ backgroundColor: colors.sectionBgColor }}
          >
            <div className="mx-auto max-w-5xl text-center">
              {page.whyChooseTitle ? (
                <h2
                  className="text-3xl font-black leading-tight md:text-5xl"
                  style={{ color: colors.headingColor }}
                >
                  {page.whyChooseTitle}
                </h2>
              ) : null}
              <Paragraphs
                lines={whyLines}
                color={colors.fontColor}
                className="mx-auto mt-6 max-w-4xl font-semibold"
              />
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="mt-12 inline-flex items-center justify-center rounded-full border-4 border-white px-8 py-3 text-xl font-black shadow"
                  style={buttonStyle}
                >
                  📞 {phone}
                </a>
              ) : null}
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
      </div>

      <Footer settings={settings} />
    </main>
  );
}

const DEFAULT_COLORS = {
  titleColor: "#7b2457",
  subTitleColor: "#111111",
  headingColor: "#7b2457",
  fontColor: "#333333",
  buttonColor: "#078f12",
  buttonTextColor: "#ffffff",
  sectionBgColor: "#e4f3df",
};

function getVideoEmbedUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) return raw;
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : raw;
    }
  } catch {
    return raw;
  }
  return raw;
}

function LandingButton({
  href,
  style,
  children,
}: {
  href: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="mt-7 inline-flex items-center justify-center rounded-full border-4 border-white px-8 py-3 text-lg font-black shadow"
      style={style}
    >
      {children}
    </a>
  );
}

function TopStrip({
  phone,
  header,
}: {
  phone: string;
  header: LandingHeaderData | null;
}) {
  if (header?.status === false) return null;
  const supportPhone = header?.supportPhone || phone;
  const socialLinks = (header?.socialLinks || []).filter((item) => item.url);
  const accent = header?.accentColor || "#fbbf24";
  return (
    <div
      style={{
        backgroundColor: header?.backgroundColor || "#1d1d1b",
        color: header?.textColor || "#ffffff",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-2 px-5 py-2.5 text-sm">
        <p className="min-w-0 break-words">
          {header?.helpText || "Need any help? Call"}{" "}
          {supportPhone ? (
            <a
              href={`tel:${supportPhone.replace(/\s+/g, "")}`}
              className="font-semibold"
            >
              {supportPhone}
            </a>
          ) : null}
          {header?.supportText ? (
            <>
              {" or "}
              {header.supportUrl ? (
                <a href={header.supportUrl} style={{ color: accent }}>
                  {header.supportText}
                </a>
              ) : (
                <span style={{ color: accent }}>{header.supportText}</span>
              )}
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-5">
          <a
            href="/track-order"
            className="font-semibold"
            style={{ color: accent }}
          >
            {header?.trackOrderText || "🚚 Track your order"}
          </a>
          {socialLinks.length ? (
            <span className="flex items-center gap-3">
              <span>{header?.followUsText || "Follow us:"}</span>
              {socialLinks.map((item) => (
                <a
                  key={`${item.platform}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: accent }}
                >
                  {item.label || item.platform}
                </a>
              ))}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Paragraphs({
  lines,
  color,
  className = "mt-8",
}: {
  lines: string[];
  color?: string;
  className?: string;
}) {
  if (!lines.length) return null;
  return (
    <div
      className={`space-y-3 text-base leading-8 ${className}`}
      style={{ color }}
    >
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
        subtitle: stripHtml(String(row.subtitle || row.description || "")),
        backgroundColor: String(row.backgroundColor || ""),
      };
    })
    .filter((item) => item.title || item.subtitle);
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

function ProductCardCarousel({ options }: { options: CarouselItem[] }) {
  const carouselItems =
    options.length >= 4
      ? options
      : Array.from(
          { length: 4 },
          (_, index) => options[index % options.length],
        ).filter((item): item is CarouselItem => Boolean(item));
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

function buildCarouselItems(
  value: unknown,
  fallback: LandingOrderOption[],
): CarouselItem[] {
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
