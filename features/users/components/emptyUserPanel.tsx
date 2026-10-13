// features/user-types/components/EmptyUserPanel.tsx
'use client';

import { UsersRound, UserRoundPlus } from 'lucide-react';

interface EmptyUserPanelProps {
  onOpenAddModal: () => void;
}

export default function EmptyUserPanel({ onOpenAddModal }: EmptyUserPanelProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
      {/* Ilustrasi Placeholder */}
      <div className="w-64 h-48 bg-blue-50/50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
        <div className="text-center p-4">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
              <UsersRound className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
              <UserRoundPlus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-xs text-blue-600 font-medium">User Types & Personas</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">User Types and Personas</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
        Software is about real people, let them shine.
      </p>

      <button
        type="button"
        onClick={onOpenAddModal}
        className="group inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium pl-2 pr-5 py-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
      >
        <span className="flex items-center justify-center w-7 h-7 bg-white/20 group-hover:bg-white/25 rounded-lg transition-colors">
          <UserRoundPlus className="w-4 h-4" strokeWidth={2.25} />
        </span>
        <span className="text-sm">New User Type</span>
      </button>
    </div>
  );
}