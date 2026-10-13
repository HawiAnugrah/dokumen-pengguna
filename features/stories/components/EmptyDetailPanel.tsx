// features/stories/components/EmptyDetailPanel.tsx
'use client';

import { Pencil, ChevronDown, Sparkles, FileText, Layers, Boxes } from 'lucide-react';
import CreateNewDropdown from './createNewDropdown';

interface EmptyDetailPanelProps {
  onOpenAddModal?: () => void; // -> New User story
  onOpenAddEpicModal?: () => void; // -> New Epic
  onOpenAddNfrModal?: () => void; // -> New Non-functional requirement
  // Props ini sekarang tidak dipakai lagi di sini (dropdown "Create New"
  // tidak lagi jadi Project Menu), tapi tetap diterima biar kompatibel
  // dengan pemanggil lama (app/stories/page.tsx).
  workspaceId?: number | null;
  projectId?: string | null;
}

export default function EmptyDetailPanel({
  onOpenAddModal,
  onOpenAddEpicModal,
  onOpenAddNfrModal,
}: EmptyDetailPanelProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
      {/* Ilustrasi Placeholder */}
      <div className="w-64 h-48 bg-blue-50/50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white shadow-md mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <span className="text-xs text-blue-600 font-medium">Userdoc Workflow</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">User Stories, Epics, and Non-functional Requirements</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
        Capture requirements in a language everyone can understand
      </p>

      {/* Dropdown "Create New" -- 3 pilihan: New User story,
          New Non-functional requirement, New Epic (sesuai desain). */}
      <CreateNewDropdown
        items={[
          {
            label: 'New User story',
            icon: <FileText className="w-4 h-4 text-blue-600" />,
            onClick: () => onOpenAddModal?.(),
          },
          {
            label: 'New Non-functional requirement',
            icon: <Layers className="w-4 h-4 text-blue-600" />,
            onClick: () =>
              onOpenAddNfrModal
                ? onOpenAddNfrModal()
                : alert('Fitur Create New Non-functional Requirement segera hadir!'),
          },
          {
            label: 'New Epic',
            icon: <Boxes className="w-4 h-4 text-blue-600" />,
            onClick: () =>
              onOpenAddEpicModal
                ? onOpenAddEpicModal()
                : alert('Fitur Create New Epic segera hadir!'),
          },
        ]}
        renderTrigger={({ onClick, triggerRef }) => (
          <button
            ref={triggerRef}
            type="button"
            onClick={onClick}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <span className="px-4 py-2.5 flex items-center gap-2 text-sm font-medium border-r border-blue-500/40">
              <Pencil className="w-4 h-4" />
              Create New
            </span>
            <span className="px-2.5 py-2.5 flex items-center justify-center">
              <ChevronDown className="w-4 h-4" />
            </span>
          </button>
        )}
      />
    </div>
  );
}