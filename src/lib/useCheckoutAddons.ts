"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/context/CartContext";
import { fetchAddonOffers, type AddonOffer } from "@/services/orderService";
import type { ApiOrderItem } from "@/types/api";

export interface AddonSlot {
  key: string;
  offer: AddonOffer;
  variantId?: number;
}

export interface AddonRemoved {
  offer: AddonOffer;
  keys: string[];
}

type SlotChoice = { variantId?: number; removed?: boolean };

/**
 * Checkout add-ons: each cart item from a category with an add-on offer earns one add-on
 * slot. Slots live here instead of the cart, so they follow the cart automatically and
 * disappear when the qualifying product is removed.
 */
export function useCheckoutAddons(items: CartItem[]) {
  const [offers, setOffers] = useState<AddonOffer[]>([]);
  const [choices, setChoices] = useState<Record<string, SlotChoice>>({});
  const [reloadCount, setReloadCount] = useState(0);

  const productIds = [...new Set(items.map((item) => item.id))].sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (!productIds) return;
    let active = true;
    fetchAddonOffers(productIds)
      .then((result) => { if (active) setOffers(result); })
      // No offer must never stop a normal order.
      .catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, [productIds, reloadCount]);

  const { slots, removed } = useMemo(() => {
    const nextSlots: AddonSlot[] = [];
    const nextRemoved: AddonRemoved[] = [];
    for (const offer of offers) {
      const { variants } = offer.product;
      const entitled = items
        .filter((item) => offer.qualifyingProductIds.includes(item.id))
        .reduce((sum, item) => sum + item.qty, 0);
      const stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
      const removedKeys: string[] = [];
      for (let index = 0; index < Math.min(entitled, stock); index++) {
        const key = `${offer.categoryId}-${index}`;
        const choice = choices[key];
        if (choice?.removed) {
          removedKeys.push(key);
          continue;
        }
        const chosen = variants.some((variant) => variant.id === choice?.variantId)
          ? choice?.variantId
          : undefined;
        nextSlots.push({
          key,
          offer,
          variantId: variants.length === 1 ? variants[0].id : chosen,
        });
      }
      if (removedKeys.length) nextRemoved.push({ offer, keys: removedKeys });
    }
    return { slots: nextSlots, removed: nextRemoved };
  }, [offers, items, choices]);

  const orderItems = useMemo<ApiOrderItem[]>(() => {
    const lines = new Map<string, ApiOrderItem>();
    for (const { offer, variantId } of slots) {
      if (!variantId) continue;
      const lineKey = `${offer.categoryId}-${variantId}`;
      const line = lines.get(lineKey);
      if (line) {
        line.qty += 1;
        continue;
      }
      const variant = offer.product.variants.find((v) => v.id === variantId);
      lines.set(lineKey, {
        id: offer.product.id,
        name: offer.product.name,
        image: offer.product.file || "",
        price: offer.price,
        qty: 1,
        variantId,
        variant: variant?.label || undefined,
        isAddon: true,
        addonCategoryId: offer.categoryId,
      });
    }
    return [...lines.values()];
  }, [slots]);

  const update = useCallback((key: string, change: SlotChoice) => {
    setChoices((prev) => ({ ...prev, [key]: { ...prev[key], ...change } }));
  }, []);

  return {
    slots,
    removed,
    orderItems,
    total: slots.reduce((sum, slot) => sum + slot.offer.price, 0),
    missingVariant: slots.some((slot) => !slot.variantId),
    selectVariant: (key: string, variantId: number | undefined) => update(key, { variantId }),
    removeSlot: (key: string) => update(key, { removed: true }),
    restore: (keys: string[]) => keys.forEach((key) => update(key, { removed: false })),
    refresh: () => setReloadCount((count) => count + 1),
  };
}
