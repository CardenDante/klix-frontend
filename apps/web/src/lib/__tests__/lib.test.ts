import { describe, expect, it } from 'vitest';
import { buildUrl } from '../api/client';
import { cartTotals } from '../cart';
import { formatKES, fromNairobiInput, isKenyanPhone, normalizePhone, priceLabel, toNairobiInput } from '../format';

describe('cartTotals', () => {
  const lines = [
    { ticketTypeId: 'a', name: 'Regular', price: '2500.00', quantity: 2 },
    { ticketTypeId: 'b', name: 'VIP', price: '7500.00', quantity: 1 },
  ];

  it('sums lines', () => {
    expect(cartTotals(lines)).toEqual({ subtotal: 12500, discount: 0, total: 12500, count: 3 });
  });

  it('applies a per-ticket discount like the API does', () => {
    expect(cartTotals([{ ticketTypeId: 'a', name: 'x', price: '999.99', quantity: 3 }], 10)).toEqual({
      subtotal: 2999.97,
      discount: 300,
      total: 2699.97,
      count: 3,
    });
  });
});

describe('phones', () => {
  it.each([
    ['0712 345 678', '254712345678'],
    ['+254712345678', '254712345678'],
    ['712345678', '254712345678'],
    ['0110 123 456', '254110123456'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
    expect(isKenyanPhone(input)).toBe(true);
  });

  it('rejects short numbers', () => expect(isKenyanPhone('07123')).toBe(false));
});

describe('money and time', () => {
  it('formats shillings', () => {
    expect(formatKES('1500.00')).toMatch(/1,500/);
    expect(priceLabel('0.00')).toBe('Free');
    expect(priceLabel(null)).toBe('Tickets soon');
  });

  it('round-trips datetime-local values as Nairobi time', () => {
    expect(fromNairobiInput('2026-10-10T18:30')).toBe('2026-10-10T15:30:00.000Z');
    expect(toNairobiInput('2026-10-10T15:30:00Z')).toBe('2026-10-10T18:30');
  });
});

describe('buildUrl', () => {
  it('drops empty params', () => {
    expect(buildUrl('http://api', '/events', { q: 'jazz', category: '', page: 2, x: undefined })).toBe(
      'http://api/events?q=jazz&page=2',
    );
  });
});
