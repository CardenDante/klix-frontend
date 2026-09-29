'use client';

import { useEffect, useState } from 'react';

/**
 * Phones only: a bottom bar with the starting price and a button that jumps to
 * the ticket picker. It hides while the picker itself is on screen.
 */
export function MobileBuyBar({ priceLabel, disabledLabel }: { priceLabel: string; disabledLabel?: string }) {
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    const picker = document.getElementById('tickets');
    if (!picker) return;
    const observer = new IntersectionObserver(([entry]) => setPickerVisible(!!entry?.isIntersecting), {
      rootMargin: '0px 0px -30% 0px',
    });
    observer.observe(picker);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden />
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform lg:hidden ${
          pickerVisible ? 'translate-y-full' : ''
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <p className="flex-1 font-bold">{priceLabel}</p>
          <button
            type="button"
            onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="h-12 rounded-full bg-brand-500 px-6 font-semibold text-white hover:bg-brand-600 disabled:bg-ink/20"
            disabled={!!disabledLabel}
          >
            {disabledLabel ?? 'Get tickets'}
          </button>
        </div>
      </div>
    </>
  );
}
