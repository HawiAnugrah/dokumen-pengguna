// features/stories/components/NfrEpicItem.tsx
'use client';

import { useState, useMemo } from 'react';
import { LayoutGrid, Tag, ChevronRight, ChevronDown } from 'lucide-react';
import { NFR } from '../types';

interface NfrEpicItemProps {
  nfrs: NFR[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string, items: NFR[]) => void;
}

export default function NfrEpicItem({ nfrs, selectedCategory, onSelectCategory }: NfrEpicItemProps) {
  // Sama seperti EpicListItem: default tertutup, klik header buat expand/collapse.
  const [isOpen, setIsOpen] = useState(false);

  const categories = useMemo(() => {
    const groups = new Map<string, NFR[]>();
    for (const nfr of nfrs) {
      const key = nfr.category || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(nfr);
    }
    return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
  }, [nfrs]);

  if (nfrs.length === 0) return null;

  return (
    <div className="mb-2">
      {/* Header -- perilakunya persis EpicListItem: klik area header toggle collapse. */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-2 truncate">
          <button className="text-gray-400 group-hover:text-gray-600 focus:outline-none">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate font-medium">Non-functional Requirements</span>
        </div>
        <span className="text-[10px] text-gray-400 font-normal">{nfrs.length}</span>
      </div>

      {/* Daftar category -- indent & style persis daftar user_stories di EpicListItem. */}
      {isOpen && (
        <div className="space-y-1 pl-6 pt-1 border-l border-gray-100 ml-3 my-1">
          {categories.map(({ category, items }) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => onSelectCategory?.(category, items)}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between group cursor-pointer ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Tag className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="truncate">{category}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono shrink-0 ml-1">
                  {items.length}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}