//emptyJourneyPanel.tsx

'use client';

import { Map } from 'lucide-react';

interface EmptyJourneyPanelProps {
  onOpenAddModal: () => void;
}

export default function EmptyJourneyPanel({ onOpenAddModal }: EmptyJourneyPanelProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-white">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-64 h-48 mb-6 flex items-center justify-center opacity-80">
          <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M120 140L140 100H100L120 140Z" fill="#93C5FD" opacity="0.4"/>
            <circle cx="80" cy="90" r="25" fill="#E0E7FF"/>
            <circle cx="160" cy="80" r="30" fill="#DBEAFE"/>
            <rect x="70" y="120" width="100" height="8" rx="4" fill="#F3F4F6"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">User journeys</h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Map the flow of personas and stories through your project
        </p>
        <button 
          onClick={onOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Map className="w-4 h-4" /> New Journey
        </button>
      </div>
    </div>
  );
}