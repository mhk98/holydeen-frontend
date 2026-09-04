"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface OrderModalProps {
  product: Product;
  onClose: () => void;
}

const formatPrice = (v: number) => v.toLocaleString("en-US");

export default function OrderModal({ product, onClose }: OrderModalProps) {
  const colors = product.colors ?? [];
  const sizes  = product.sizes  ?? [];

  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize,  setSelectedSize]  = useState(sizes[0]  ?? "");
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleOrder = () => {
    addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
    onClose();
    router.push("/checkout");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[680px] mx-3 sm:mx-0">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 flex items-center justify-center text-white font-bold"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#D7262E", fontSize: 20, lineHeight: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          ×
        </button>

        {/* Header */}
        <div
          className="flex items-center"
          style={{
            background: "#071B52", borderRadius: "8px 8px 0 0",
            height: 58, paddingLeft: 28, paddingRight: 28,
          }}
        >
          <span className="text-white font-semibold text-lg tracking-wide">
            Select Variation
          </span>
        </div>

        {/* Body */}
        <div className="bg-white" style={{ borderRadius: "0 0 8px 8px", padding: "clamp(16px, 4vw, 28px)" }}>
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">

            {/* Product image */}
            <div className="relative shrink-0 self-start border border-gray-200 overflow-hidden rounded"
              style={{ width: "clamp(110px, 35vw, 200px)", height: "clamp(110px, 35vw, 200px)" }}
            >
              <Image
                src={product.image} alt={product.name}
                fill
                className="object-cover" unoptimized
              />
            </div>

            {/* Right side */}
            <div className="flex flex-col gap-4 sm:gap-5 flex-1">

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-gray-400 line-through text-base">
                  ৳{formatPrice(product.originalPrice)}
                </span>
                <span className="font-extrabold text-3xl text-gray-900">
                  ৳{formatPrice(product.discountedPrice)}
                </span>
              </div>

              {/* Color */}
              {colors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Select Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className="font-semibold transition-colors text-sm"
                        style={{
                          height: 36, padding: "0 14px",
                          border: `1.5px solid ${selectedColor === c ? "#071B52" : "#ccc"}`,
                          borderRadius: 4,
                          background: selectedColor === c ? "#071B52" : "#fff",
                          color: selectedColor === c ? "#fff" : "#444",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              {sizes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Select Size</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className="font-semibold transition-colors text-sm"
                        style={{
                          width: 44, height: 36,
                          border: `1.5px solid ${selectedSize === s ? "#071B52" : "#ccc"}`,
                          borderRadius: 4,
                          background: selectedSize === s ? "#071B52" : "#fff",
                          color: selectedSize === s ? "#fff" : "#444",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Order Now */}
              <div className="flex items-center gap-4 mt-1">
                {/* Qty control */}
                <div
                  className="flex items-center"
                  style={{ border: "1.5px solid #ccc", borderRadius: 4, overflow: "hidden" }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
                    style={{ width: 42, height: 42 }}
                  >−</button>
                  <span
                    className="text-center font-bold text-base select-none"
                    style={{ width: 42, borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc", lineHeight: "42px" }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
                    style={{ width: 42, height: 42 }}
                  >+</button>
                </div>

                {/* Order Now button */}
                <button
                  onClick={handleOrder}
                  className="flex-1 text-white font-bold tracking-wide transition-opacity hover:opacity-90"
                  style={{ background: "#071B52", borderRadius: 4, height: 42, fontSize: 15 }}
                >
                  + ORDER NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
