"use client";

import { create } from "zustand";
import { CartApiRepository } from "@/infrastructure/frontend/repositories/Cart.api"; // Ensure this path is correct
import { CartEntity } from "@/core/entities/cart.entity";
import {
  AddToCartDTO,
  UpdateCartItemDTO,
  RemoveFromCartDTO,
} from "@/core/dtos/Cart.dto";

interface CartState {
  cart: CartEntity | null;
  loading: boolean;
  error: string | null;
  getCart: () => Promise<void>;
  // Updated addToCart signature to accept identifier and isGuest
  addToCart: (
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ) => Promise<void>;
  updateCartItem: (dto: UpdateCartItemDTO) => Promise<void>;
  removeCartItem: (dto: RemoveFromCartDTO) => Promise<void>;
  clearCart: () => Promise<void>;
}

const cartApi = new CartApiRepository();

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  loading: false,
  error: null,

  getCart: async () => {
    set({ loading: true });
    try {
      // --- CHANGE START ---
      // FIX: Changed cartApi.getCart() to cartApi.getCartWithItems() to match ICartRepository signature.
      // The client-side implementation of getCartWithItems in CartApiRepository does not require arguments
      // as the identifier is handled by the 'x-guest-id' header or auth token.
      const data = await cartApi.getCartWithItems("", false); // Pass dummy identifier and isGuest to satisfy interface
      // --- CHANGE END ---
      set({ cart: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  // Updated addToCart implementation to pass identifier and isGuest to cartApi.addItem
  addToCart: async (
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ) => {
    set({ loading: true });
    try {
      const data = await cartApi.addItem(dto, identifier, isGuest);
      set({ cart: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateCartItem: async (dto: UpdateCartItemDTO) => {
    set({ loading: true });
    try {
      const data = await cartApi.updateItem(dto);
      set({ cart: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  removeCartItem: async (dto: RemoveFromCartDTO) => {
    set({ loading: true });
    try {
      const data = await cartApi.removeItem(dto);
      set({ cart: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  clearCart: async () => {
    set({ loading: true });
    try {
      // --- CHANGE START ---
      // FIX: Added arguments to cartApi.clearCart() to match ICartRepository signature.
      // Since the actual API call relies on headers for identification, these can be dummy values.
      const data = await cartApi.clearCart("", false); // Pass dummy identifier and isGuest
      // --- CHANGE END ---
      set({ cart: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
