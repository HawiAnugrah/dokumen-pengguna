// app/users/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import AppSidebar from '@/features/common/components/AppSidebar';
import UsersSidebar from '@/features/users/components/userSidebar';
import UserDetailPanel from '@/features/users/components/userDetailPanel';
import EmptyUserPanel from '@/features/users/components/emptyUserPanel';
import UserFormPanel from '@/features/users/components/userFormPanel';
import { UserType } from '@/features/users/types';
import { usersApi } from '@/services/userApi';
import { projectApi } from '@/services/projectsApi';
import { fetchStories } from '@/services/storiesApi';
import { getAuthToken } from '@/lib/auth';
import { MessageSquare, Upload, Download, Loader2, ChevronDown } from 'lucide-react';
import AccountMenu from '@/features/common/components/accountMenu';
import ProjectMenuDropdown from '@/features/stories/components/ProjectMenuDropdown';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const attachStoriesCount = (types: UserType[], rawStories: any[]): UserType[] => {
    const countMap = new Map<string, number>();
    for (const story of rawStories) {
      const userTypeId = story.user_type_id != null ? String(story.user_type_id) : null;
      if (!userTypeId) continue;
      countMap.set(userTypeId, (countMap.get(userTypeId) || 0) + 1);
    }
    return types.map((ut) => ({
      ...ut,
      storiesCount: countMap.get(ut.id) || 0,
    }));
  };

  // 🚀 SWR Cache: Data User Types langsung tampil seketika (0 detik)
  const { data: cacheData, error: swrError, isLoading, mutate } = useSWR(
    mounted && projectId && token ? [`user-types-data`, projectId, token] : null,
    async ([, projId, tok]) => {
      const [userTypesData, storiesData, projectData] = await Promise.all([
        usersApi.fetchUserTypes(Number(projId), tok),
        fetchStories(Number(projId), tok),
        projectApi.getProjectById(Number(projId), tok),
      ]);
      const merged = attachStoriesCount(userTypesData || [], storiesData || []);
      return {
        userTypes: merged,
        project: projectData,
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const userTypes = cacheData?.userTypes || [];
  const projectName = cacheData?.project?.name || '';
  const projectWorkspaceId = cacheData?.project?.workspace_id || null;
  const loadError = swrError ? (swrError.message || 'Gagal memuat data dari server.') : '';

  const selectedUserType =
    userTypes.find((u) => u.id === selectedUserTypeId) || userTypes[0] || null;

  const handleSelectUser = (user: UserType) => {
    setSelectedUserTypeId(user.id);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleOpenAddModal = () => {
    setSelectedUserTypeId(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleOpenEditModal = () => {
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleSaveUserType = async (savedData: UserType) => {
    if (!token || !projectId) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        const rawCreated = await usersApi.createUserType(
          {
            name: savedData.name,
            description: savedData.description,
            project_id: Number(projectId),
          },
          token
        );
        const created: UserType = {
          id: String(rawCreated.id),
          name: rawCreated.name,
          description: rawCreated.description || '',
          personasCount: (rawCreated.personas || []).length,
          storiesCount: 0,
          personas: (rawCreated.personas || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatar_url || p.avatar || '',
            age: p.age != null ? String(p.age) : '',
            location: p.location || '',
            familyStatus: p.family_status || '',
            workTitle: p.job_title || '',
            about: p.about || '',
            goals: p.goals || '',
            frustrations: p.frustrations || '',
          })),
        };
        mutate(
          (prev: any) => (prev ? { ...prev, userTypes: [...(prev.userTypes || []), created] } : prev),
          false
        );
        setSelectedUserTypeId(created.id);
      } else {
        await usersApi.updateUserType(
          Number(savedData.id),
          {
            name: savedData.name,
            description: savedData.description,
            project_id: Number(projectId),
          },
          token
        );
        mutate(
          (prev: any) =>
            prev
              ? {
                  ...prev,
                  userTypes: (prev.userTypes || []).map((u: UserType) =>
                    u.id === savedData.id ? { ...u, name: savedData.name, description: savedData.description } : u
                  ),
                }
              : prev,
          false
        );
      }
      setIsCreating(false);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Gagal menyimpan user type:', err);
      alert(err.message || 'Gagal menyimpan perubahan ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserType = async () => {
    if (!selectedUserType || !token) return;
    if (!confirm(`Hapus user type "${selectedUserType.name}" beserta persona di dalamnya?`)) return;

    setIsSaving(true);
    try {
      await usersApi.deleteUserType(Number(selectedUserType.id), token);
      mutate(
        (prev: any) =>
          prev
            ? {
                ...prev,
                userTypes: (prev.userTypes || []).filter((u: UserType) => u.id !== selectedUserType.id),
              }
            : prev,
        false
      );
      setSelectedUserTypeId(null);
    } catch (err: any) {
      console.error('Gagal menghapus user type:', err);
      alert(err.message || 'Gagal menghapus user type dari server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        alert(`File "${file.name}" berhasil di-upload!`);
      }
    };
    input.click();
  };

  const handleDownload = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userTypes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectName || 'project'}-user-types.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans relative">
      {isSaving && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center text-white font-medium">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Menyimpan ke server...
        </div>
      )}

      {/* 🚀 1. Global Navigation Sidebar Selalu Aktif */}
      <AppSidebar activeMenu="users" projectId={projectId} />

      {!mounted || isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Memuat data user types...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <p className="text-red-600 font-medium mb-2">Gagal memuat data</p>
            <p className="text-sm text-gray-500">{loadError}</p>
          </div>
        </div>
      ) : (
        <>

      {/* 2. Sub-Sidebar Daftar User Types */}
      <UsersSidebar
        userTypes={userTypes}
        selectedId={selectedUserType?.id}
        onSelectUser={handleSelectUser}
        onAddNew={handleOpenAddModal}
      />

      {/* 3. Main Content Panel */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top Navbar */}
        <div className="h-14 border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ProjectMenuDropdown
              workspaceId={projectWorkspaceId}
              activeProjectId={projectId}
              renderTrigger={({ onClick, isOpen, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={onClick}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <span>{projectName || 'Untitled Project'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            />
            <span className="text-gray-300">/</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <button
                onClick={handleUpload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                title="Upload Document"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                title="Download / Export JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <AccountMenu currentWorkspaceId={projectWorkspaceId} />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {isCreating ? (
            <UserFormPanel
              initialData={null}
              onSubmit={handleSaveUserType}
              onCancel={handleCancelForm}
            />
          ) : isEditing && selectedUserType ? (
            <UserFormPanel
              initialData={selectedUserType}
              onSubmit={handleSaveUserType}
              onCancel={handleCancelForm}
            />
          ) : selectedUserType ? (
            <UserDetailPanel
              userType={selectedUserType}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteUserType}
            />
          ) : (
            <EmptyUserPanel onOpenAddModal={handleOpenAddModal} />
          )}
          </div>
        </main>
      </>
    )}
  </div>
);
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}