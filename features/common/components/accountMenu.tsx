// features/common/components/accountMenu.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Users, LogOut, Loader2, Plus, Building2, Trash2 } from 'lucide-react';
import { profileApi, UserProfile } from '@/services/profileApi';
import { workspaceApi, WorkspaceResponse } from '@/services/workspaceApi';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken, clearAuthToken } from '@/lib/auth';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';

interface AccountMenuProps {
  // Opsional: kirim ini dari halaman yang sudah tahu workspace_id project aktif
  // (misal dari ProjectResponse.workspace_id di stories/page.tsx) supaya highlight
  // "workspace aktif" akurat walau URL tidak punya query param workspace_id.
  currentWorkspaceId?: number | string | null;
}

export default function AccountMenu({ currentWorkspaceId: currentWorkspaceIdProp }: AccountMenuProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWorkspaceIdFromUrl = searchParams.get('workspace_id');

  // Prioritaskan prop dari parent (lebih akurat), fallback ke query param URL
  const currentWorkspaceId = currentWorkspaceIdProp ?? currentWorkspaceIdFromUrl;

  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingWsId, setDeletingWsId] = useState<number | null>(null);
  const [switchingWsId, setSwitchingWsId] = useState<number | null>(null);
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

  const loadData = async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const [profileData, workspacesData] = await Promise.all([
        profileApi.getProfile(token),
        workspaceApi.getMyWorkspaces(token),
      ]);
      setProfile(profileData);
      setWorkspaces(workspacesData);
      setHasLoaded(true);
    } catch (err) {
      console.error('Gagal memuat data akun:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !hasLoaded) loadData();
  };

  const initials = (profile?.full_name || profile?.username || 'UD')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const handleCreateWorkspace = () => {
    useWizardStore.getState().resetStore();
    setIsOpen(false);
    router.push('/project-setup');
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, ws: WorkspaceResponse) => {
    e.stopPropagation();

    if (workspaces.length <= 1) {
      alert('Anda harus memiliki setidaknya satu tim aktif. Tim terakhir tidak dapat dihapus.');
      return;
    }

    if (!confirm(`Hapus tim "${ws.name}"? Seluruh project di dalamnya akan ikut terhapus.`)) return;

    const token = getAuthToken();
    if (!token) return;

    setDeletingWsId(ws.id);
    try {
      await workspaceApi.deleteWorkspace(ws.id, token);
      const updatedWorkspaces = workspaces.filter((w) => w.id !== ws.id);
      setWorkspaces(updatedWorkspaces);

      // Jika tim yang dihapus adalah tim yang sedang aktif, pindah ke tim lain yang tersisa
      if (String(currentWorkspaceId) === String(ws.id)) {
        const nextWs = updatedWorkspaces[0];
        if (nextWs) {
          await handleSwitchWorkspace(nextWs);
        } else {
          router.push('/project-setup');
        }
      }
    } catch (err: any) {
      console.error('Gagal menghapus workspace:', err);
      alert(err.message || 'Gagal menghapus tim.');
    } finally {
      setDeletingWsId(null);
    }
  };

  // Pindah workspace: ambil daftar project di workspace tsb, lalu buka project pertamanya.
  // Kalau workspace itu belum punya project sama sekali, arahkan ke project-setup.
  const handleSwitchWorkspace = async (ws: WorkspaceResponse) => {
    const token = getAuthToken();
    if (!token) return;

    setSwitchingWsId(ws.id);
    try {
      const projects = await projectApi.getProjects(ws.id, token);

      if (projects && projects.length > 0) {
        router.push(`/stories?project_id=${projects[0].id}`);
      } else {
        useWizardStore.getState().resetStore();
        router.push(`/project-setup?workspace_id=${ws.id}`);
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error('Gagal pindah workspace:', err);
      alert(err.message || 'Gagal memuat project pada tim ini.');
    } finally {
      setSwitchingWsId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <style jsx global>{`
        .account-dropdown-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .account-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .account-dropdown-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 9999px;
        }
      `}</style>

      <button
        onClick={handleToggle}
        className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-md cursor-pointer transition-colors border border-blue-400/30"
      >
        {initials || 'UD'}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden text-gray-800">
          {isLoading ? (
            <div className="px-4 py-8 flex justify-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || profile?.username || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || 'user@userdoc.io'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setIsOpen(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer text-left font-medium"
                >
                  <User className="w-4 h-4 text-gray-400" /> Manage Profile
                </button>
                <button
                  onClick={() => { setIsOpen(false); router.push('/team'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer text-left font-medium"
                >
                  <Users className="w-4 h-4 text-gray-400" /> Team Settings
                </button>
              </div>

              <div className="border-t border-gray-100 py-1">
                <div className="flex items-center justify-between px-4 py-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Teams / Workspaces</span>
                  <button
                    onClick={handleCreateWorkspace}
                    title="Buat Tim Baru"
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Team
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto account-dropdown-scroll px-1">
                  {workspaces.map((ws) => {
                    const isDeleting = deletingWsId === ws.id;
                    const isSwitching = switchingWsId === ws.id;
                    const isCurrentActive = String(currentWorkspaceId) === String(ws.id) || (!currentWorkspaceId && workspaces[0]?.id === ws.id);

                    return (
                      <div
                        key={ws.id}
                        className={`group/item flex items-center justify-between w-full px-3 py-2 rounded-xl transition-colors ${
                          isCurrentActive ? 'bg-blue-50/80 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <button
                          onClick={() => handleSwitchWorkspace(ws)}
                          disabled={isSwitching}
                          className="flex items-center gap-2 text-xs text-left truncate flex-grow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSwitching ? (
                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-600" />
                          ) : (
                            <Building2 className={`w-3.5 h-3.5 shrink-0 ${isCurrentActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          )}
                          <span className="truncate">{ws.name}</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteWorkspace(e, ws)}
                          disabled={isDeleting || isSwitching || workspaces.length <= 1}
                          title={workspaces.length <= 1 ? 'Tim terakhir tidak dapat dihapus' : 'Hapus Tim'}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover/item:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ml-1"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}