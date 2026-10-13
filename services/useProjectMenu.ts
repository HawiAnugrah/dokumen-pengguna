// features/stories/hooks/useProjectMenu.ts
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { projectApi } from '@/services/projectsApi';
import { workspaceApi } from '@/services/workspaceApi';
import { getAuthToken } from '@/lib/auth';
import { setStoredProjectId, clearStoredProjectId } from '@/lib/project-context';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';

/**
 * Logic bersama untuk dropdown "Project Menu" (Create new Project / Project
 * Settings / Change Project). Dipakai di StoriesSidebar dan EmptyDetailPanel
 * serta top header di semua halaman dashboard.
 */
export function useProjectMenu(
  workspaceId?: number | null,
  activeProjectId?: string | number | null
) {
  const router = useRouter();
  const pathname = usePathname();
  const resetStore = useWizardStore((s: any) => s.resetStore);
  const setWizardWorkspaceId = useWizardStore((s: any) => s.setWorkspaceId);

  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        let wsId = workspaceId;
        if (!wsId) {
          const workspaces = await workspaceApi.getMyWorkspaces(token);
          if (workspaces && workspaces.length > 0) {
            wsId = workspaces[0].id;
          }
        }
        if (!wsId) return;

        const response: any = await projectApi.getProjects(wsId, token);
        const list = Array.isArray(response) ? response : response?.data || response?.projects || [];
        setProjects(list);
      } catch (err) {
        console.error('Gagal memuat list project:', err);
      }
    };
    fetchProjects();
  }, [workspaceId, activeProjectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  const handleCreateNewProject = () => {
    close();
    resetStore();
    if (workspaceId) setWizardWorkspaceId(workspaceId);
    router.push('/project-setup');
  };

  const goToSettings = () => {
    close();
    router.push(`/settings?project_id=${activeProjectId}`);
  };

  const openProject = (projectId: number) => {
    close();
    setStoredProjectId(projectId);
    const targetPath =
      pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')
        ? pathname
        : '/stories';
    router.push(`${targetPath}?project_id=${projectId}`);
  };

  const deleteProject = async (e: React.MouseEvent, pId: number, pName: string) => {
    e.stopPropagation();
    if (!confirm(`Hapus project "${pName}"? Seluruh data di dalamnya akan terhapus permanen.`)) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      await projectApi.deleteProject(pId, token);
      const remaining = projects.filter((p) => p.id !== pId);
      setProjects(remaining);

      if (String(pId) === String(activeProjectId)) {
        if (remaining.length > 0) {
          setStoredProjectId(remaining[0].id);
          const targetPath =
            pathname && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')
              ? pathname
              : '/stories';
          router.push(`${targetPath}?project_id=${remaining[0].id}`);
        } else {
          clearStoredProjectId();
          router.push('/workspace');
        }
      }
    } catch (err: any) {
      console.error('Gagal menghapus project:', err);
      alert(err.message || 'Gagal menghapus project.');
    }
  };

  return {
    isOpen,
    toggle,
    close,
    containerRef,
    projects,
    handleCreateNewProject,
    goToSettings,
    openProject,
    deleteProject,
  };
}