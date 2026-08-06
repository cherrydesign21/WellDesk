'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="flex w-full flex-col gap-[10px]">
      {items.map((item, i) => {
        const isOpen = i === openIndex;
        return (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpenIndex(isOpen ? -1 : i)}
            aria-expanded={isOpen}
            className={`flex w-full items-start gap-6 rounded-[10px] px-5 py-6 text-left transition-colors ${
              isOpen ? 'bg-[#454e17] text-white' : 'bg-[#f9f3e7] text-[#111] hover:bg-[#f3ead6]'
            }`}
          >
            <Plus
              className={`mt-1 h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''} ${
                isOpen ? 'text-white' : 'text-[#454e17]'
              }`}
            />
            <span className="flex-1">
              <span className="block text-lg font-semibold sm:text-xl">{item.q}</span>
              {isOpen && <span className="mt-3 block text-sm leading-relaxed opacity-90 sm:text-base">{item.a}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
