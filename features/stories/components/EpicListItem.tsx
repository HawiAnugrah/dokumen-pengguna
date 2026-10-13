'use client';

import { useState } from 'react';
import { Epic, UserStory } from '../types';
import { LayoutGrid, FileText, ChevronRight, ChevronDown } from 'lucide-react';

interface EpicListItemProps {
  epic: Epic;
  selectedStoryId?: string;
  onSelectStory: (story: UserStory) => void;
  onSelectEpic?: (epic: Epic) => void;
}

export default function EpicListItem({ epic, selectedStoryId, onSelectStory, onSelectEpic }: EpicListItemProps) {
  // State untuk melipat (collapse) atau membuka dropdown epic, default terbuka atau tertutup sesuai keinginan
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      {/* Header Epic (Bisa diklik untuk expand/collapse atau klik judul untuk melihat detail epic) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-2 truncate">
          <button className="text-gray-400 group-hover:text-gray-600 focus:outline-none">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span 
            className="truncate font-medium" 
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectEpic) onSelectEpic(epic);
            }}
            title={epic.name}
          >
            {epic.name}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-normal">
          {epic.user_stories?.length || 0}
        </span>
      </div>

      {/* Daftar User Stories di dalam Epic (Hanya muncul jika isOpen bernilai true) */}
      {isOpen && (
        <div className="space-y-1 pl-6 pt-1 border-l border-gray-100 ml-3 my-1">
          {epic.user_stories && epic.user_stories.length > 0 ? (
            epic.user_stories.map((story) => {
              const isSelected = selectedStoryId === story.id;
              return (
                <button
                  key={story.id}
                  onClick={() => onSelectStory(story)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between group cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate">{story.i_want || 'Example story'}</span>
                  </div>
                  
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono shrink-0 ml-1">
                    {story.code}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-2 py-1 text-[11px] text-gray-400 italic">No stories yet</div>
          )}
        </div>
      )}
    </div>
  );
}