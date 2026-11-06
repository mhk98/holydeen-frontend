"use client";
import SafeImage from "@/components/SafeImage";
import type { AddonRemoved, AddonSlot } from "@/lib/useCheckoutAddons";
import { IMAGES } from "@/lib/api";

const imageOf = (file: string | null) => {
  if (!file) return null;
  return file.startsWith("http") ? file : `${IMAGES}/${file}`;
};

interface Props {
  slots: AddonSlot[];
  removed: AddonRemoved[];
  showErrors: boolean;
  onSelect: (key: string, variantId: number | undefined) => void;
  onRemove: (key: string) => void;
  onRestore: (keys: string[]) => void;
}

export default function CheckoutAddonRows({ slots, removed, showErrors, onSelect, onRemove, onRestore }: Props) {
  return (
    <>
      {slots.map((slot) => {
        const { product, price } = slot.offer;
        const hasChoice = product.variants.length > 1;
        const missing = showErrors && !slot.variantId;
        const optionNames = Object.keys(product.variants[0]?.options || {}).join("/") || "Option";
        return (
          <div
            key={slot.key}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 96px 72px",
              padding: "14px 18px",
              borderBottom: "1px solid #f5f5f5",
              alignItems: "center",
              minWidth: 320,
              background: "#f0fdf4",
            }}
          >
            <button
              type="button"
              aria-label={`${product.name} সরান`}
              onClick={() => onRemove(slot.key)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#D7262E",
                border: "none",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <SafeImage
                sources={[imageOf(product.file)]}
                alt={product.name}
                width={54}
                height={54}
                style={{ borderRadius: 6, objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333" }}>{product.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                  অফার মূল্য ৳{price.toLocaleString("en-US")}
                </p>
                {hasChoice && (
                  <select
                    value={slot.variantId ?? ""}
                    onChange={(e) => onSelect(slot.key, e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      padding: "4px 6px",
                      borderRadius: 4,
                      background: "#fff",
                      border: `1px solid ${missing ? "#D7262E" : "#ccc"}`,
                    }}
                  >
                    <option value="">{optionNames} বাছাই করুন</option>
                    {product.variants.map((variant) => {
                      const takenByOthers = slots.filter(
                        (other) => other.key !== slot.key && other.variantId === variant.id,
                      ).length;
                      return (
                        <option key={variant.id} value={variant.id} disabled={variant.stock <= takenByOthers}>
                          {Object.values(variant.options).join(", ") || variant.label}
                        </option>
                      );
                    })}
                  </select>
                )}
                {missing && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#D7262E" }}>{optionNames} বাছাই করুন</p>
                )}
              </div>
            </div>

            <span style={{ width: 80, textAlign: "center", fontSize: 14, fontWeight: 600 }}>1</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>৳{price.toLocaleString("en-US")}</span>
          </div>
        );
      })}

      {removed.map(({ offer, keys }) => (
        <div
          key={offer.categoryId}
          style={{ padding: "10px 18px", fontSize: 12, color: "#666", borderBottom: "1px solid #f5f5f5" }}
        >
          {keys.length}টি {offer.product.name} সরানো হয়েছে।{" "}
          <button
            type="button"
            onClick={() => onRestore(keys)}
            style={{ border: "none", background: "none", color: "#16a34a", fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            আবার যোগ করুন
          </button>
        </div>
      ))}
    </>
  );
}
