'use client';

import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import AppSidebar from '@/features/common/components/AppSidebar';
import JourneysSidebar from '@/features/journeys/components/journeySidebar';
import EmptyJourneyPanel from '@/features/journeys/components/emptyJourneyPanel';
import JourneyDetailPanel from '@/features/journeys/components/journeyDetailPanel';
import CreateJourneyModal from '@/features/journeys/components/createJourneyModal';
import AccountMenu from '@/features/common/components/accountMenu';
import { Upload, Download, Loader2, ChevronDown } from 'lucide-react';
import ProjectMenuDropdown from '@/features/stories/components/ProjectMenuDropdown';
import { journeysApi, UserJourneyResponse } from '@/services/journeysApi';
import { projectApi } from '@/services/projectsApi';
import { personasApi, Persona } from '@/services/personasApi';
import { getAuthToken } from '@/lib/auth';

interface JourneyStepVM {
  id: number | string;
  title: string;
  description: string;
  personaId: number | null;
  personaName: string | null;
}

interface JourneyVM {
  id: string;
  title: string;
  description: string;
  steps: JourneyStepVM[];
  stepsCount: number;
  personasCount: number;
  storiesCount: number;
}

function mapJourneyFromBackend(j: UserJourneyResponse): JourneyVM {
  const sortedSteps = [...(j.steps || [])].sort((a, b) => a.step_order - b.step_order);
  const uniquePersonaIds = new Set(
    sortedSteps.map((s) => s.persona_id).filter((pid): pid is number => pid != null)
  );
  return {
    id: String(j.id),
    title: j.name,
    description: j.description || '',
    steps: sortedSteps.map((s, idx) => ({
      id: s.id ?? `${j.id}-${idx}`,
      title: s.title,
      description: s.description || '',
      personaId: s.persona_id ?? null,
      personaName: s.persona?.name ?? null,
    })),
    stepsCount: sortedSteps.length,
    personasCount: uniquePersonaIds.size,
    storiesCount: 0,
  };
}

function JourneysPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 🚀 SWR Cache: Data Journeys langsung tampil seketika (0 detik)
  const { data: cacheData, error: swrError, isLoading, mutate } = useSWR(
    mounted && projectId && token ? [`journeys-data`, projectId, token] : null,
    async ([, projId, tok]) => {
      const [journeysData, projectData, personasData] = await Promise.all([
        journeysApi.getJourneysByProject(Number(projId), tok),
        projectApi.getProjectById(Number(projId), tok),
        personasApi.getPersonasByProject(Number(projId), tok),
      ]);
      return {
        journeys: (journeysData || []).map(mapJourneyFromBackend),
        project: projectData,
        personas: personasData || [],
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const journeys = cacheData?.journeys || [];
  const projectName = cacheData?.project?.name || '';
  const projectWorkspaceId = cacheData?.project?.workspace_id || null;
  const personas = cacheData?.personas || [];
  const loadError = swrError ? (swrError.message || 'Gagal memuat data dari server.') : '';

  const selectedJourney =
    journeys.find((j) => j.id === selectedJourneyId) || journeys[0] || null;

  // Handler Submit Modal Buat Journey Baru
  const handleCreateJourneyFromModal = async (data: { name: string; description: string }) => {
    if (!token || !projectId) return;

    const created = await journeysApi.createJourney(
      {
        project_id: Number(projectId),
        name: data.name,
        description: data.description,
        steps: [],
      },
      token
    );

    const newVM = mapJourneyFromBackend(created);
    mutate(
      (prev: any) => (prev ? { ...prev, journeys: [newVM, ...(prev.journeys || [])] } : prev),
      false
    );
    setSelectedJourneyId(newVM.id);
  };

  // Handler Update Journey & Steps
  const handleUpdateJourneyDetail = async (updated: JourneyVM) => {
    if (!token || !projectId) return;

    try {
      // 1. Update nama & deskripsi journey
      await journeysApi.updateJourney(
        Number(updated.id),
        { name: updated.title, description: updated.description },
        token
      );

      // 2. Replace langkah-langkah steps
      await journeysApi.replaceSteps(
        Number(updated.id),
        updated.steps.map((s, index) => ({
          step_order: index + 1,
          title: s.title,
          description: s.description,
          persona_id: s.personaId ?? null,
        })),
        token
      );

      const updatedJourneys = journeys.map((j) => (j.id === updated.id ? updated : j));
      mutate(
        (prev: any) => (prev ? { ...prev, journeys: updatedJourneys } : prev),
        false
      );
    } catch (err: any) {
      console.error('Gagal menyimpan perubahan journey:', err);
      alert(err.message || 'Gagal menyimpan perubahan journey ke server.');
    }
  };

  // Handler Hapus Journey
  const handleDeleteJourney = async (journeyId: string) => {
    if (!token) return;

    try {
      await journeysApi.deleteJourney(Number(journeyId), token);
      mutate(
        (prev: any) =>
          prev
            ? {
                ...prev,
                journeys: (prev.journeys || []).filter((j: JourneyVM) => j.id !== journeyId),
              }
            : prev,
        false
      );
      if (selectedJourneyId === journeyId || selectedJourney?.id === journeyId) {
        setSelectedJourneyId(null);
      }
    } catch (err: any) {
      console.error('Gagal menghapus journey:', err);
      alert(err.message || 'Gagal menghapus journey dari server.');
    }
  };

  // Handler AI Generate Steps
  const handleGenerateAiSteps = async (journeyId: string) => {
    if (!token) return;

    try {
      await journeysApi.generateAiSteps(Number(journeyId), token);
      mutate();
    } catch (err: any) {
      console.error('Gagal generate AI steps:', err);
      alert(err.message || 'Gagal menghasilkan langkah alur dengan AI.');
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !token || !projectId) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        for (const j of list) {
          await journeysApi.createJourney(
            {
              project_id: Number(projectId),
              name: j.title || j.name || 'Untitled journey',
              description: j.description || '',
              steps: (j.steps || []).map((s: any, idx: number) => ({
                title: s.title,
                description: s.description,
                step_order: idx + 1,
                persona_id: s.personaId ?? null,
              })),
            },
            token
          );
        }
        mutate();
        alert(`Berhasil import ${list.length} journey dari "${file.name}".`);
      } catch (err: any) {
        alert('File tidak valid atau gagal diimport: ' + (err.message || ''));
      }
    };
    input.click();
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(journeys, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectName || 'project'}-journeys.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const safeSelectedJourney = selectedJourney
    ? JSON.parse(JSON.stringify(selectedJourney))
    : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans relative">
      {/* 🚀 AppSidebar SELALU Tampil di Layar Secara Konsisten */}
      <AppSidebar activeMenu="journeys" projectId={projectId} />

      {!mounted || isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Memuat data journeys...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md px-6">
            <p className="text-red-600 font-medium mb-2">Gagal memuat data</p>
            <p className="text-sm text-gray-500">{loadError}</p>
          </div>
        </div>
      ) : (
        <>
          <JourneysSidebar
            journeys={journeys}
            selectedJourneyId={selectedJourney?.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectJourney={(j) => setSelectedJourneyId(j.id)}
            onOpenMapModal={() => setIsCreateModalOpen(true)}
          />

          <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
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
                    type="button"
                    onClick={handleUpload}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                    title="Upload Document"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
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

            {selectedJourney ? (
              <JourneyDetailPanel
                key={selectedJourney.id}
                journey={safeSelectedJourney}
                personas={personas}
                onClose={() => {
                  const original = journeys.find((j) => j.id === selectedJourney.id);
                  setSelectedJourneyId(original?.id || null);
                }}
                onSave={handleUpdateJourneyDetail}
                onDeleteJourney={handleDeleteJourney}
                onGenerateAiSteps={handleGenerateAiSteps}
              />
            ) : (
              <EmptyJourneyPanel onOpenAddModal={() => setIsCreateModalOpen(true)} />
            )}
          </main>
        </>
      )}

      {/* Modal Popup Create Journey Sesuai PRD */}
      <CreateJourneyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJourneyFromModal}
      />
    </div>
  );
}

export default function JourneysPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <JourneysPageContent />
    </Suspense>
  );
}