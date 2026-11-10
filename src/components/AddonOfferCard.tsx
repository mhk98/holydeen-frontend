"use client";
import type { AddonRemoved, AddonSlot } from "@/lib/useCheckoutAddons";
import type { AddonOffer } from "@/services/orderService";
import { IMAGES } from "@/lib/api";

/** Element id of the card, to scroll to it when a size is missing. */
export const ADDON_OFFER_ANCHOR = "addon-offer";

const formatMoney = (value: number) => value.toLocaleString("en-US");

/** "ফ্রি" for a zero price, otherwise the amount in taka. */
export const addonPriceText = (price: number) => (price > 0 ? `${formatMoney(price)}৳` : "ফ্রি");

const imageOf = (file: string | null) => {
  if (!file) return "/placeholder.jpg";
  return /^(https?:|data:|\/)/i.test(file) ? file : `${IMAGES}/${file}`;
};

const variantName = (options: Record<string, string>, label: string) =>
  Object.values(options).join(", ") || label;

/** Card texts (editable per landing page); "{product}" is replaced with a product name. */
export interface AddonOfferTexts {
  title: string;
  checkboxText: string;
  noteText: string;
}

export const DEFAULT_ADDON_TEXTS: AddonOfferTexts = {
  title: "🎁 বিশেষ অফার",
  checkboxText: "হ্যাঁ, আমি {product} নিতে চাই",
  noteText: "প্রতিটি {product}-এর সাথে ১টি",
};

const fillProduct = (text: string, name: string) => text.split("{product}").join(name);

interface Props {
  texts?: AddonOfferTexts;
  /** 2: half width on desktop, next to a product card (landing); 1: full width (checkout). */
  columns?: 1 | 2;
  slots: AddonSlot[];
  removed: AddonRemoved[];
  showErrors: boolean;
  /** Name of the qualifying product, for "প্রতিটি <name>-এর সাথে ১টি". */
  qualifyingName?: string;
  onSelect: (key: string, variantId: number | undefined) => void;
  onRemove: (key: string) => void;
  onRestore: (keys: string[]) => void;
}

/**
 * "Order bump" card used by checkout and landing pages: the add-on an order earns,
 * ticked by default. Unticking removes it (and its price); ticking brings it back.
 */
export default function AddonOfferCard({
  texts = DEFAULT_ADDON_TEXTS,
  columns = 2,
  slots,
  removed,
  showErrors,
  qualifyingName,
  onSelect,
  onRemove,
  onRestore,
}: Props) {
  // One card per offer, whether its add-ons are currently in the order or removed.
  const offers = new Map<number, AddonOffer>();
  for (const { offer } of [...slots, ...removed]) offers.set(offer.categoryId, offer);
  if (!offers.size) return null;

  return (
    // Same two-column grid as the product options above, so the card lines up with them.
    <div id={ADDON_OFFER_ANCHOR} className={`mt-4 grid gap-4 scroll-mt-24 ${columns === 2 ? "md:grid-cols-2" : ""}`}>
      {[...offers.values()].map((offer) => {
        const offerSlots = slots.filter((slot) => slot.offer.categoryId === offer.categoryId);
        const removedKeys = removed.find((entry) => entry.offer.categoryId === offer.categoryId)?.keys || [];
        const checked = offerSlots.length > 0;
        const { product, price } = offer;
        const regular = Math.max(0, ...product.variants.map((variant) => variant.regularPrice || 0));
        const hasChoice = product.variants.length > 1;
        const optionName = Object.keys(product.variants[0]?.options || {}).join("/") || "Size";
        const missing = showErrors && offerSlots.some((slot) => !slot.variantId);

        const toggle = () => {
          if (checked) offerSlots.forEach((slot) => onRemove(slot.key));
          else onRestore(removedKeys);
        };

        return (
          <div
            key={offer.categoryId}
            className={`rounded-md border-2 border-dashed p-4 transition ${
              missing
                ? "border-red-500 bg-red-50"
                : checked
                  ? "border-[#C59B27] bg-[#FAF4E6]/70"
                  : "border-slate-300 bg-white"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wide text-[#A87F18]">{texts.title}</p>

            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-black text-slate-800">
              <input
                type="checkbox"
                checked={checked}
                onChange={toggle}
                className="h-5 w-5 shrink-0 accent-[#0B1B4F]"
              />
              {fillProduct(texts.checkboxText, product.name)}
            </label>

            <div className="mt-3 grid grid-cols-[64px_1fr] gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageOf(product.file)}
                alt={product.name}
                className={`h-16 w-16 rounded object-cover ${checked ? "" : "opacity-50"}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800">{product.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {regular > price ? (
                    <span className="text-gray-400 line-through">{formatMoney(regular)}৳</span>
                  ) : null}
                  <span className="rounded bg-[#0B1B4F] px-2 py-0.5 text-xs font-black text-white">
                    {addonPriceText(price)}
                  </span>
                </p>
                {qualifyingName && texts.noteText ? (
                  <p className="mt-1 text-xs text-slate-500">{fillProduct(texts.noteText, qualifyingName)}</p>
                ) : null}
              </div>
            </div>

            {checked && hasChoice
              ? offerSlots.map((slot, index) => (
                  <div key={slot.key} className="mt-3">
                    <p className="mb-1.5 text-xs font-bold text-slate-700">
                      {offerSlots.length > 1 ? `${index + 1} নং ${product.name}-এর ` : ""}
                      {optionName} বাছাই করুন *
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => {
                        const taken = offerSlots.filter(
                          (other) => other.key !== slot.key && other.variantId === variant.id,
                        ).length;
                        const active = slot.variantId === variant.id;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={!active && variant.stock <= taken}
                            onClick={() => onSelect(slot.key, active ? undefined : variant.id)}
                            className={`min-w-11 rounded border px-3 py-1.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              active
                                ? "border-[#0B1B4F] bg-[#0B1B4F] text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-[#0B1B4F]"
                            }`}
                          >
                            {variantName(variant.options, variant.label)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              : null}

            {missing ? (
              <p className="mt-2 text-xs font-bold text-red-600">
                {optionName} বাছাই করুন, অথবা টিক তুলে অফারটি বাদ দিন।
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
