"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Giỏ hàng lưu trong localStorage của trình duyệt (chưa cần đăng nhập).
// Zustand = thư viện quản lý "trạng thái chung" mà nhiều component cùng đọc/ghi.

export type CartItem = {
  key: string; // productId-màu-size: cùng áo, cùng màu, cùng size thì gộp số lượng
  productId: number;
  slug: string;
  name: string;
  colorKey: string;
  colorName: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const MAX_QUANTITY = 10;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const key = `${item.productId}-${item.colorKey}-${item.size}`;
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key, quantity }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : i,
          ),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "aura-cart" },
  ),
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

const noopSubscribe = () => () => {};

/**
 * Server không có localStorage → lần vẽ đầu tiên giỏ hàng luôn trống.
 * Hook này trả về false ở server và lần vẽ đầu, true khi đã chạy trên trình duyệt,
 * giúp tránh lỗi "hydration mismatch" (HTML server ≠ HTML trình duyệt).
 */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
