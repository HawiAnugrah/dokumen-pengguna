// features/users/components/userSidebar.tsx
'use client';

import { useState, useMemo } from 'react';
import { UserType } from '../types';
import { Search, UserPlus } from 'lucide-react';

interface UsersSidebarProps {
  userTypes: UserType[];
  selectedId?: string;
  onSelectUser: (user: UserType) => void;
  onAddNew?: () => void;
}

export default function UsersSidebar({ userTypes, selectedId, onSelectUser, onAddNew }: UsersSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return userTypes;

    const query = searchQuery.toLowerCase();
    return userTypes.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query)
    );
  }, [userTypes, searchQuery]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header Sidebar: Search Bar & Tombol Ikon Orang dengan Background */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          {/* Input Search Biasa */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Tombol Ikon Orang di Luar Search Bar dengan Background Kotak */}
          <button
            type="button"
            onClick={onAddNew}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer shrink-0"
            title="Create New User"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Informasi Jumlah User */}
        <div className="text-[11px] text-gray-400 font-medium px-0.5 uppercase tracking-wider">
          Showing {filteredUsers.length} Users
        </div>
      </div>

      {/* List Card User Types */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-gray-400">
            No users found.
          </div>
        ) : (
          filteredUsers.map((type) => {
            const isSelected = selectedId === type.id;
            const initialLetter = type.name ? type.name.charAt(0).toUpperCase() : 'U';

            return (
              <div
                key={type.id}
                onClick={() => onSelectUser(type)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-blue-50/60 border-blue-200 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {initialLetter}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate">{type.name}</h4>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-1 mb-2 pl-10">{type.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium pl-10">
                  <span>{type.storiesCount ?? 0} Stories</span>
                  <span>•</span>
                  <span>{type.personasCount ?? type.personas?.length ?? 0} Personas</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}