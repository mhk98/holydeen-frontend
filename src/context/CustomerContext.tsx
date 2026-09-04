"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CustomerInfo { Id: number; name: string; phone: string; }

interface CustomerContextValue {
  customer: CustomerInfo | null;
  token: string | null;
  login: (token: string, customer: CustomerInfo) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const CustomerContext = createContext<CustomerContextValue>({
  customer: null, token: null, login: () => {}, logout: () => {}, isLoggedIn: false,
});

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [token,    setToken]    = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("customer_token");
      const c = localStorage.getItem("customer_info");
      if (t && c) { setToken(t); setCustomer(JSON.parse(c)); }
    } catch { /* ignore */ }
  }, []);

  const login = useCallback((newToken: string, info: CustomerInfo) => {
    localStorage.setItem("customer_token", newToken);
    localStorage.setItem("customer_info", JSON.stringify(info));
    setToken(newToken);
    setCustomer(info);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_info");
    setToken(null);
    setCustomer(null);
  }, []);

  return (
    <CustomerContext.Provider value={{ customer, token, login, logout, isLoggedIn: !!customer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() { return useContext(CustomerContext); }
