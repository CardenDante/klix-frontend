'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { KlixEvent, TicketType } from './api/types';

export interface CartLine {
  ticketTypeId: string;
  name: string;
  price: string;
  quantity: number;
}

interface CartState {
  event: Pick<KlixEvent, 'id' | 'slug' | 'title' | 'start_datetime' | 'location' | 'banner_image_url'> | null;
  lines: CartLine[];
  promoCode: string;
  discountPercentage: number;
  /** Replaces the cart with a selection for one event. */
  start: (event: KlixEvent, ticketTypes: TicketType[], quantities: Record<string, number>, promoCode?: string) => void;
  setPromo: (code: string, discountPercentage: number) => void;
  clear: () => void;
}

// Session storage: a cart belongs to one tab and shouldn't outlive it.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      event: null,
      lines: [],
      promoCode: '',
      discountPercentage: 0,
      start: (event, ticketTypes, quantities, promoCode = '') =>
        set({
          event: {
            id: event.id,
            slug: event.slug,
            title: event.title,
            start_datetime: event.start_datetime,
            location: event.location,
            banner_image_url: event.banner_image_url,
          },
          lines: ticketTypes
            .filter((tt) => (quantities[tt.id] ?? 0) > 0)
            .map((tt) => ({ ticketTypeId: tt.id, name: tt.name, price: tt.price, quantity: quantities[tt.id]! })),
          promoCode,
          discountPercentage: 0,
        }),
      setPromo: (promoCode, discountPercentage) => set({ promoCode, discountPercentage }),
      clear: () => set({ event: null, lines: [], promoCode: '', discountPercentage: 0 }),
    }),
    { name: 'klix-cart', storage: createJSONStorage(() => sessionStorage) },
  ),
);

/** Cart totals in whole shillings, computed the same way as the API. */
export function cartTotals(lines: CartLine[], discountPercentage = 0) {
  let subtotalCents = 0;
  let discountCents = 0;
  for (const line of lines) {
    const unitCents = Math.round(Number(line.price) * 100);
    const unitDiscount = Math.round((unitCents * discountPercentage) / 100);
    subtotalCents += unitCents * line.quantity;
    discountCents += unitDiscount * line.quantity;
  }
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
