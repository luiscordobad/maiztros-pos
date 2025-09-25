'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { PosCartItem, PosProduct } from './types';

interface PosState {
  items: PosCartItem[];
  couponCode: string | null;
  discount: number;
  subtotal: number;
  total: number;
  addProduct: (product: PosProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyDiscount: (value: number, code: string | null) => void;
  reset: () => void;
}

const computeSubtotal = (items: PosCartItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  couponCode: null,
  discount: 0,
  subtotal: 0,
  total: 0,
  addProduct: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.sku === product.sku);
      let nextItems: PosCartItem[];
      if (existing) {
        nextItems = state.items.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        nextItems = [
          ...state.items,
          { id: nanoid(), sku: product.sku, name: product.name, price: product.price, quantity: 1, modifiers: [] },
        ];
      }
      const subtotal = computeSubtotal(nextItems);
      return {
        items: nextItems,
        subtotal,
        total: subtotal - state.discount,
      };
    });
  },
  removeItem: (id) => {
    set((state) => {
      const nextItems = state.items.filter((item) => item.id !== id);
      const subtotal = computeSubtotal(nextItems);
      return {
        items: nextItems,
        subtotal,
        total: subtotal - state.discount,
      };
    });
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => {
      const nextItems = state.items.map((item) => (item.id === id ? { ...item, quantity } : item));
      const subtotal = computeSubtotal(nextItems);
      return {
        items: nextItems,
        subtotal,
        total: subtotal - state.discount,
      };
    });
  },
  applyDiscount: (value, code) => {
    set((state) => ({
      discount: value,
      couponCode: code,
      total: Math.max(state.subtotal - value, 0),
    }));
  },
  reset: () => set({ items: [], couponCode: null, discount: 0, subtotal: 0, total: 0 }),
}));
