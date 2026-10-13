//journeySidebar.tsx

'use client';

import { Search, User, Plus } from 'lucide-react';

interface JourneysSidebarProps {
  journeys: any[];
  selectedJourneyId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectJourney: (journey: any) => void;
  onOpenMapModal: () => void;
}

export default function JourneysSidebar({
  journeys,
  selectedJourneyId,
  searchQuery,
  onSearchChange,
  onSelectJourney,
  onOpenMapModal,
}: JourneysSidebarProps) {
  const filteredJourneys = journeys.filter(j => 
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari user journey..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
          {/* Tombol New Journey */}
          <button 
            type="button"
            onClick={onOpenMapModal}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
            title="Buat Journey Baru"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
          <span>Menampilkan {filteredJourneys.length} journey</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredJourneys.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Tidak ada journey ditemukan</p>
            <p className="text-[11px] text-gray-400">
              {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data journey pada project ini.'}
            </p>
          </div>
        ) : (
          filteredJourneys.map((journey) => (
            <div
              key={journey.id}
              onClick={() => onSelectJourney(journey)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedJourneyId === journey.id 
                  ? 'bg-blue-50/70 border-blue-300 shadow-xs' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <h4 className="font-bold text-xs text-gray-900 mb-1 leading-snug line-clamp-2">
                {journey.title}
              </h4>
              <p className="text-[11px] text-gray-500 mb-2.5 line-clamp-1">
                {journey.description || 'Tidak ada deskripsi'}
              </p>
              <div className="flex items-center gap-2.5 text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  <User className="w-3 h-3" /> {journey.personasCount ?? 0} Personas
                </span>
                <span>•</span>
                <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  {journey.stepsCount ?? journey.steps?.length ?? 0} Steps
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}