// features/common/components/ProjectSwitcher.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Check, FolderKanban, Loader2, Trash2, LayoutGrid } from 'lucide-react';
import { workspaceApi } from '@/services/workspaceApi';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';
import { setStoredProjectId, clearStoredProjectId, getStoredProjectId } from '@/lib/project-context';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';

interface ProjectSwitcherProps {
  currentProjectId?: string | null;
}

interface ProjectOption {
  id: number;
  name: string;
}

export default function ProjectSwitcher({ currentProjectId }: ProjectSwitcherProps) {
  const router = useRouter();
  const resetStore = useWizardStore((s: any) => s.resetStore);

  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjects = async () => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const workspaces = await workspaceApi.getMyWorkspaces(token);
      const allProjects: ProjectOption[] = [];
      for (const ws of workspaces) {
        const wsProjects = await projectApi.getProjects(ws.id, token);
        allProjects.push(...wsProjects.map((p) => ({ id: p.id, name: p.name })));
      }
      setProjects(allProjects);
      setHasLoaded(true);
    } catch (err) {
      console.error('Gagal memuat daftar project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !hasLoaded) {
      loadProjects();
    }
  };

  const handleSelectProject = (id: number) => {
    setStoredProjectId(id);
    setIsOpen(false);
    router.push(`/stories?project_id=${id}`);
  };

  const handleCreateNew = () => {
    resetStore();
    setIsOpen(false);
    router.push('/project-setup');
  };

  // TAMBAHAN: hapus project langsung dari dropdown, tanpa perlu buka halaman terpisah.
  // Kalau project yang dihapus adalah project yang lagi aktif dan itu project TERAKHIR
  // yang tersisa, arahkan ke /workspace (bukan project-setup) -- sesuai permintaan:
  // "kalau semua project dihapus, masuk ke workspace, bukan ke project-setup".
  const handleDeleteProject = async (e: React.MouseEvent, project: ProjectOption) => {
    e.stopPropagation();
    if (!confirm(`Hapus project "${project.name}"? Semua data di dalamnya akan terhapus permanen.`)) return;

    const token = getAuthToken();
    if (!token) return;

    setDeletingId(project.id);
    try {
      await projectApi.deleteProject(project.id, token);
      const remaining = projects.filter((p) => p.id !== project.id);
      setProjects(remaining);

      const wasActive = String(project.id) === String(currentProjectId);
      if (wasActive) {
        clearStoredProjectId();
        setIsOpen(false);
        if (remaining.length > 0) {
          handleSelectProject(remaining[0].id);
        } else {
          router.push('/workspace');
        }
      }
    } catch (err: any) {
      console.error('Gagal menghapus project:', err);
      alert(err.message || 'Gagal menghapus project.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="border border-gray-200 hover:bg-gray-50 text-gray-600 p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
        title="Switch project"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Your Projects
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 italic">Belum ada project lain.</div>
            ) : (
              projects.map((p) => {
                const isActive = String(p.id) === String(currentProjectId);
                const isDeleting = deletingId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors group ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectProject(p.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <FolderKanban className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="truncate flex-1">{p.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(e, p)}
                      disabled={isDeleting}
                      title="Delete project"
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              type="button"
              onClick={() => { setIsOpen(false); router.push('/workspace'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              View All Projects
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              Create New Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}