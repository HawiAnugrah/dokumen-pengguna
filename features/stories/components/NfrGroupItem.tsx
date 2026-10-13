// features/stories/components/NfrGroupItem.tsx
'use client';

import { useState } from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import { NFR } from '../types';

interface NfrGroupItemProps {
  category: string;
  items: NFR[];
  selectedNfrId?: string | number;
  onSelectNfr?: (nfr: NFR) => void;
}

export default function NfrGroupItem({
  category,
  items,
  selectedNfrId,
  onSelectNfr,
}: NfrGroupItemProps) {
  const containsSelected = items.some((n) => n.id === selectedNfrId);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
        <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span
          className={`text-xs font-semibold truncate flex-1 text-left ${
            containsSelected ? 'text-blue-700' : 'text-gray-700'
          }`}
        >
          {category}
        </span>
        <span className="text-[10px] text-gray-400 font-medium shrink-0">{items.length}</span>
      </button>

      {isOpen && (
        <div className="ml-[22px] border-l border-gray-100 pl-2">
          {items.map((nfr) => {
            const isSelected = nfr.id === selectedNfrId;
            return (
              <button
                key={nfr.id}
                type="button"
                onClick={() => onSelectNfr?.(nfr)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                  isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="line-clamp-2">{nfr.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}