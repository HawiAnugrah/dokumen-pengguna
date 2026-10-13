// features/stories/components/ProjectMenuPanel.tsx
import { ReactNode } from 'react';
import { Plus, Settings, Folder, Trash2, FileText } from 'lucide-react';
import { projectApi } from '@/services/projectsApi';

interface ExtraTopAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface ProjectMenuPanelProps {
  activeProjectId?: string | number | null;
  projects: any[];
  // Item tambahan yang muncul PALING ATAS dropdown, di atas "Create new
  // Project". Dipakai misalnya buat "Create New User Story" di EmptyDetailPanel.
  // Kosongkan kalau tidak butuh (misal di StoriesSidebar).
  extraTopAction?: ExtraTopAction;
  onCreateNewProject: () => void;
  onGoToSettings: () => void;
  onOpenProject: (id: number) => void;
  onDeleteProject: (e: React.MouseEvent, id: number, name: string) => void;
}

/**
 * Isi dropdown "Project Menu" -- dipakai bareng di StoriesSidebar dan
 * EmptyDetailPanel lewat ProjectMenuDropdown, supaya kontennya identik di
 * kedua tempat. Positioning diatur oleh ProjectMenuDropdown, bukan di sini.
 */
export default function ProjectMenuPanel({
  activeProjectId,
  projects,
  extraTopAction,
  onCreateNewProject,
  onGoToSettings,
  onOpenProject,
  onDeleteProject,
}: ProjectMenuPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl py-2">
      <div className="px-3 py-2 border-b border-gray-100">
        {extraTopAction && (
          <button
            onClick={extraTopAction.onClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-left"
          >
            {extraTopAction.icon}
            {extraTopAction.label}
          </button>
        )}
        <button
          onClick={onCreateNewProject}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-left"
        >
          <Plus className="w-4 h-4 text-blue-600" /> Create new Project
        </button>
        <button
          onClick={onGoToSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-left"
        >
          <Settings className="w-4 h-4 text-gray-400" /> Project Settings
        </button>
        {activeProjectId && (
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              const activeProj = projects.find((p) => String(p.id) === String(activeProjectId));
              const projName = activeProj?.name || 'project';
              if (token && activeProjectId) {
                projectApi.downloadProjectPdf(Number(activeProjectId), projName, token).catch((e) => alert(e.message));
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
          >
            <FileText className="w-4 h-4 text-rose-600" /> Export Project PDF
          </button>
        )}
      </div>

      <div className="px-3 py-1.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold px-2 py-1">CHANGE PROJECT</p>
        <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
          {projects.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-1 italic">Memuat project...</p>
          ) : (
            projects.map((p) => {
              const isCurrent = String(p.id) === String(activeProjectId);
              return (
                <div
                  key={p.id}
                  className={`group/item flex items-center justify-between w-full px-3 py-2 rounded-xl transition-colors ${
                    isCurrent ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <button
                    onClick={() => onOpenProject(p.id)}
                    className="flex items-center gap-2 text-xs text-left truncate flex-1 cursor-pointer"
                  >
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate">{p.name}</span>
                  </button>
                  <button
                    onClick={(e) => onDeleteProject(e, p.id, p.name)}
                    title="Hapus Project"
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer opacity-0 group-hover/item:opacity-100 shrink-0 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}