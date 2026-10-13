// app/workspace/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LogoUserdoc from '@/public/logoUserDoc';
import AccountMenu from '@/features/common/components/accountMenu';
import { workspaceApi, WorkspaceResponse, WorkspaceMemberResponse } from '@/services/workspaceApi';
import { projectApi, ProjectResponse } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';
import { setStoredProjectId } from '@/lib/project-context';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';
import {
  FolderKanban,
  Plus,
  Loader2,
  RefreshCw,
  Users,
  Search,
  GitGraph,
  Settings,
  Calendar,
  ArrowRight,
  Activity,
  Sparkles,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'project' | 'story' | 'member';
}
export default function WorkspacePage() {
  const router = useRouter();
  const resetStore = useWizardStore((s: any) => s.resetStore);
  const setWorkspaceId = useWizardStore((s: any) => s.setWorkspaceId);
  const updateTeamName = useWizardStore((s: any) => s.updateTeamName);

  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        const workspaces = await workspaceApi.getMyWorkspaces(token);
        if (!workspaces || workspaces.length === 0) {
          router.replace('/project-setup');
          return;
        }

        const activeWorkspace = workspaces[0];
        setWorkspace(activeWorkspace);

        localStorage.setItem('workspace_id', String(activeWorkspace.id));
        localStorage.setItem('team_id', String(activeWorkspace.id));

        const [projectList, memberList] = await Promise.all([
          projectApi.getProjects(activeWorkspace.id, token).catch(() => []),
          workspaceApi.getWorkspaceMembers(activeWorkspace.id, token).catch(() => []),
        ]);

        setProjects(projectList || []);
        setMembers(memberList || []);
      } catch (err: any) {
        console.error('Gagal memuat data workspace:', err);
        setLoadError(err.message || 'Gagal memuat data workspace.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [reloadToken, router]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.domain_business && p.domain_business.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const handleOpenProject = (projectId: number, path: 'stories' | 'graph' | 'settings' = 'stories') => {
    setStoredProjectId(projectId);
    router.push(`/${path}?project_id=${projectId}`);
  };

  const recentActivities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];
    if (projects.length > 0) {
      projects.slice(0, 4).forEach((p) => {
        list.push({
          id: `act-proj-${p.id}`,
          user: members[0]?.username || 'Owner',
          action: 'membuat proyek',
          target: p.name,
          time: new Date(p.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          type: 'project',
        });
      });
    }
    return list;
  }, [projects, members]);

  const handleCreateFirstProject = () => {
    resetStore();
    if (workspace) {
      // Isi workspaceId & teamName di wizard store SEBELUM masuk /project-setup,
      // supaya komponen TeamName mendeteksi workspace sudah ada dan otomatis
      // skip ke step NameProject (tidak perlu isi nama team lagi).
      setWorkspaceId(workspace.id);
      updateTeamName(workspace.name);
    }
    router.push('/project-setup');
  };

  const handleRetry = () => setReloadToken((n) => n + 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-gray-800 font-medium mb-2">Gagal memuat data</p>
          <p className="text-gray-500 text-sm mb-4">{loadError}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  
    return (
    <div className="min-h-screen bg-gray-50/70">
      {/* Header Bar */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sm:px-10 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <LogoUserdoc />
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-bold text-gray-900">{workspace?.name || 'Your Team'}</span>
          <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-100">
            Workspace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/team')}
            className="text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs font-semibold cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-gray-500" /> Team Settings ({members.length})
          </button>
          <AccountMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-8">
        {/* Banner Ringkasan */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100">
              <Sparkles className="w-3.5 h-3.5" /> Requirement Management Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang di {workspace?.name || 'Workspace'}
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Kelola seluruh proyek, susun spesifikasi User Stories, User Journeys, dan panduan arsitektur pengembangan software tim Anda di satu tempat.
            </p>
            <div className="pt-2 flex items-center gap-6 text-xs text-blue-100 font-medium">
              <div>
                <span className="text-xl font-bold text-white block">{projects.length}</span>
                <span>Total Proyek</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="text-xl font-bold text-white block">{members.length}</span>
                <span>Anggota Tim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Daftar Proyek & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Daftar Kartu Proyek */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau deskripsi proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-xs"
                />
              </div>
              <button
                onClick={handleCreateFirstProject}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Buat Proyek Baru
              </button>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {project.domain_business || 'General'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {project.description || 'Tidak ada deskripsi proyek.'}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        {project.application_type && (
                          <span className="text-[10px] text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                            {project.application_type}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenProject(project.id, 'graph')}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Visualisasi Graph"
                        >
                          <GitGraph className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenProject(project.id, 'settings')}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Pengaturan Proyek"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenProject(project.id, 'stories')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        <span>Buka Proyek</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">Belum ada project di tim ini</p>
                <p className="text-gray-500 text-xs mb-6">Buat project pertama untuk mulai menyusun requirements.</p>
                <button
                  onClick={handleCreateFirstProject}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Buat Proyek Pertama
                </button>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Recent Activity Feed (REQ-002) */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Aktivitas Terkini</h3>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>

              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                        {act.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-gray-800 leading-relaxed">
                          <strong className="text-gray-900">{act.user}</strong> {act.action}{' '}
                          <span className="font-semibold text-blue-600">{act.target}</span>
                        </p>
                        <p className="text-[10px] text-gray-400">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  Belum ada catatan aktivitas baru.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}