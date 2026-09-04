"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarqueeBanner from "@/components/MarqueeBanner";
import { apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { useCustomer } from "@/context/CustomerContext";

const PRIMARY = "#071B52";
const SECONDARY = "#C79524";

interface OrderItem { name: string; image?: string; qty: number; price: number; size?: string; color?: string; }
interface Order {
  Id: number; invoiceId?: string; status: string; total: number; subtotal: number;
  deliveryCharge: number; paymentMethod: string; paymentStatus?: string;
  items: OrderItem[] | string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#c2410c", processing: "#2563eb", shipped: "#7c3aed",
  delivered: "#16a34a", cancelled: "#dc2626",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "অপেক্ষমাণ", processing: "প্রক্রিয়াধীন", shipped: "শিপমেন্ট",
  delivered: "ডেলিভারি হয়েছে", cancelled: "বাতিল",
};

function parseItems(items: OrderItem[] | string): OrderItem[] {
  if (Array.isArray(items)) return items;
  try { const p = JSON.parse(items); return Array.isArray(p) ? p : []; } catch { return []; }
}

function fmt(v: number | string) { return Number(v || 0).toLocaleString("en-US"); }
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountPage() {
  const router = useRouter();
  const { customer, token, logout, isLoggedIn } = useCustomer();

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [tab,        setTab]        = useState<"orders" | "password">("orders");

  // Password change form
  const [oldPw,    setOldPw]    = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw,setConfirmPw]= useState("");
  const [pwLoading,setPwLoading]= useState(false);
  const [pwError,  setPwError]  = useState("");
  const [pwSuccess,setPwSuccess]= useState("");

  useEffect(() => {
    if (!isLoggedIn) { router.replace("/login"); return; }
    if (!token) return;
    apiFetch<ApiResponse<Order[]>>("/customer/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [isLoggedIn, token, router]);

  const handleLogout = () => { logout(); router.push("/"); };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!oldPw) { setPwError("পুরনো পাসওয়ার্ড দিন"); return; }
    if (newPw.length < 6) { setPwError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"); return; }
    if (newPw !== confirmPw) { setPwError("নতুন পাসওয়ার্ড মিলছে না"); return; }
    setPwLoading(true);
    try {
      await apiFetch<ApiResponse<null>>("/customer/change-password", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      setPwSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "পাসওয়ার্ড পরিবর্তন হয়নি");
    } finally {
      setPwLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 24px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14,
    cursor: "pointer", background: active ? SECONDARY : "#f3f4f6",
    color: active ? "#fff" : "#555", transition: "all 0.15s",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 44, border: "1px solid #ddd", borderRadius: 8,
    padding: "0 14px", fontSize: 14, outline: "none", background: "#fafafa", color: "#111",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F8F6F0" }}>
      <MarqueeBanner />
      <Header />

      <main style={{ flex: 1, padding: "32px 16px 48px" }}>
        <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>

          {/* Profile header */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${SECONDARY}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" fill="none" stroke={SECONDARY} strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>{customer?.name}</h1>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#666" }}>{customer?.phone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button style={tabStyle(tab === "orders")} onClick={() => setTab("orders")}>আমার অর্ডার</button>
            <button style={tabStyle(tab === "password")} onClick={() => setTab("password")}>পাসওয়ার্ড পরিবর্তন</button>
          </div>

          {/* Orders tab */}
          {tab === "orders" && (
            <>
              {ordersLoading ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#999" }}>লোড হচ্ছে...</div>
              ) : orders.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>কোনো অর্ডার নেই</p>
                  <Link href="/" style={{ color: SECONDARY, fontWeight: 700, fontSize: 14 }}>এখনই কিনুন →</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {orders.map((order) => {
                    const items = parseItems(order.items);
                    const statusColor = STATUS_COLORS[order.status?.toLowerCase()] ?? "#374151";
                    const statusLabel = STATUS_LABELS[order.status?.toLowerCase()] ?? order.status;
                    return (
                      <article key={order.Id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}>
                        {/* Order header */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Invoice</div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: "#111" }}>{order.invoiceId || `#${order.Id}`}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{fmtDate(order.createdAt)}</div>
                          </div>
                          <span style={{ background: `${statusColor}14`, color: statusColor, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Items */}
                        <div style={{ padding: "0 20px" }}>
                          {items.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                              <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                {item.image
                                  ? <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                                  : <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af" }}>IMG</div>
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>Qty {item.qty}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>৳{fmt(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "12px 20px", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#666" }}>Payment: {order.paymentMethod?.toUpperCase()}</span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: SECONDARY }}>মোট: ৳{fmt(order.total)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Password change tab */}
          {tab === "password" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxWidth: 440 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#111" }}>পাসওয়ার্ড পরিবর্তন করুন</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>পুরনো পাসওয়ার্ড</label>
                  <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} style={inputStyle} placeholder="বর্তমান পাসওয়ার্ড দিন" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>নতুন পাসওয়ার্ড</label>
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} placeholder="নতুন পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={inputStyle} placeholder="আবার নতুন পাসওয়ার্ড দিন" />
                </div>

                {pwError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{pwError}</div>}
                {pwSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>{pwSuccess}</div>}

                <button
                  onClick={handleChangePassword} disabled={pwLoading}
                  style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.7 : 1 }}
                >
                  {pwLoading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
