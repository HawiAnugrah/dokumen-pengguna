// app/stories/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserStory, Epic, NFR } from '@/features/stories/types';
import StoriesSidebar from '@/features/stories/components/StoriesSidebar';
import EmptyDetailPanel from '@/features/stories/components/EmptyDetailPanel';
import ManualStoryDetailPanel from '@/features/stories/components/ManualStoryDetailPanel';
import EpicDetailPanel from '@/features/stories/components/EpicDetailPanel';
import NfrCategoryDetailPanel from '@/features/stories/components/NfrCategoryDetailPanel';
import ProjectMenuDropdown from '@/features/stories/components/ProjectMenuDropdown';
import AppSidebar from '@/features/common/components/AppSidebar';
import AccountMenu from '@/features/common/components/accountMenu';
import CreateEpicModal from '@/features/stories/components/CreateEpicModal';
import CreateNfrModal from '@/features/stories/components/CreateNfrModal';
import { MessageSquare, Upload, Download, X, Lightbulb, Loader2, ChevronDown, Sparkles, FileText, Plus } from 'lucide-react';
import { fetchEpics, fetchStories, fetchNfrs, suggestStoryWithAi } from '@/services/storiesApi';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';

function StoriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project_id');
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: cacheData, error: swrError, isLoading, mutate } = useSWR(
    mounted && projectId && token ? [`stories-data`, projectId, token] : null,
    async ([, projId, tok]) => {
      const [epicsData, storiesData, projectData, nfrsData] = await Promise.all([
        fetchEpics(Number(projId), tok),
        fetchStories(Number(projId), tok),
        projectApi.getProjectById(Number(projId), tok),
        fetchNfrs(Number(projId), tok),
      ]);
      return {
        epics: epicsData || [],
        stories: storiesData || [],
        project: projectData,
        nfrs: nfrsData || [],
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const rawEpics = cacheData?.epics || [];
  const rawStories = cacheData?.stories || [];
  const rawNfrs: NFR[] = cacheData?.nfrs || [];
  const projectName = cacheData?.project?.name || '';
  const projectWorkspaceId = cacheData?.project?.workspace_id || null;
  const loadError = swrError ? (swrError.message || 'Gagal memuat data dari server.') : '';

  const existingNfrCategories = useMemo(
    () => Array.from(new Set(rawNfrs.map((n) => n.category).filter(Boolean))),
    [rawNfrs]
  );

    const formattedEpics: Epic[] = useMemo(
    () =>
      rawEpics.map((epic: any, index: number) => ({
        id: epic.id,
        code: `EP-${index + 1}`,
        name: epic.name,
        description: epic.description,
        user_stories: rawStories
          .filter((story: any) => story.epic_id === epic.id)
          .map((story: any, sIndex: number) => ({
            id: story.id,
            epicId: story.epic_id,
            code: story.code || `US-${index + 1}.${sIndex + 1}`,
            as_a: story.as_a || 'User',
            i_want: story.i_want || 'Melakukan sesuatu',
            so_that: story.so_that || 'Sistem berjalan dengan baik',
            acceptanceCriteria: (story.acceptance_criteria || []).map((ac: any) => ac.description),
            techNotes: (story.tech_notes || []).map((tn: any) => tn.content),
            testCases: (story.test_cases || []).map((tc: any) => ({
              id: tc.id,
              action: tc.action,
              expectedResult: tc.expected_result,
            })),
            images: (story.images || []).map((img: any) => ({
              id: img.id,
              url: img.url,
              caption: img.caption,
              createdAt: img.created_at,
            })),
            labels: story.labels || [],
          })),
      })),
    [rawEpics, rawStories]
  );

  const allStories: UserStory[] = useMemo(
    () => formattedEpics.flatMap((epic) => epic.user_stories),
    [formattedEpics]
  );

  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [selectedNfrCategory, setSelectedNfrCategory] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [isNfrModalOpen, setIsNfrModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAsA, setNewAsA] = useState('');
  const [newSoThat, setNewSoThat] = useState('');
  const [epicInput, setEpicInput] = useState('');
  const [newStoryAiLoading, setNewStoryAiLoading] = useState(false);
  const [newStoryAiError, setNewStoryAiError] = useState<string | null>(null);

  useEffect(() => {
    if (formattedEpics.length > 0 && !epicInput) {
      setEpicInput(formattedEpics[0].name);
    }
  }, [formattedEpics, isModalOpen]);

  useEffect(() => {
    if (selectedEpic) {
      const refreshed = formattedEpics.find((e) => e.id === selectedEpic.id);
      if (refreshed) setSelectedEpic(refreshed);
    }
  }, [formattedEpics]);

  // Kalau NFR terakhir di category yang lagi dibuka ke-hapus, tutup panelnya.
  useEffect(() => {
    if (selectedNfrCategory && !rawNfrs.some((n) => n.category === selectedNfrCategory)) {
      setSelectedNfrCategory(null);
    }
  }, [rawNfrs, selectedNfrCategory]);

  const selectedNfrItems = useMemo(
    () => rawNfrs.filter((n) => n.category === selectedNfrCategory),
    [rawNfrs, selectedNfrCategory]
  );

  const handleGenerateStoryDraft = async () => {
    const token = getAuthToken();
    if (!token) {
      setNewStoryAiError('Sesi habis, silakan login kembali.');
      return;
    }

    setNewStoryAiLoading(true);
    setNewStoryAiError(null);

    try {
      const suggestion = await suggestStoryWithAi(
        {
          as_a: newAsA || undefined,
          i_want: newTitle || undefined,
          so_that: newSoThat || undefined,
          epic_name: epicInput.trim() || undefined,
          project_name: projectName,
        },
        token
      );

      setNewAsA(suggestion.as_a || newAsA);
      setNewTitle(suggestion.i_want || newTitle);
      setNewSoThat(suggestion.so_that || newSoThat);
    } catch (err) {
      setNewStoryAiError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setNewStoryAiLoading(false);
    }
  };

  const handleSaveNewStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      const trimmedEpicName = epicInput.trim() || 'General';
      let epicIdToUse: number | null = null;
      let newlyCreatedEpic: any = null;

      // Cari apakah nama Epic yang diketik sudah ada di daftar Epic
      const existing = formattedEpics.find(
        (ep) => ep.name.toLowerCase() === trimmedEpicName.toLowerCase()
      );

      if (existing) {
        epicIdToUse = Number(existing.id);
      } else {
        // Jika belum ada, buatkan Epic baru secara otomatis
        const createEpicRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stories/epics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedEpicName,
            project_id: Number(projectId),
          }),
        });

        if (!createEpicRes.ok) {
          const err = await createEpicRes.json().catch(() => ({}));
          throw new Error(err.detail || 'Gagal membuat epic baru.');
        }

        newlyCreatedEpic = await createEpicRes.json();
        epicIdToUse = Number(newlyCreatedEpic.id);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: Number(projectId),
          epic_id: epicIdToUse,
          i_want: newTitle,
          as_a: newAsA || 'User',
          so_that: newSoThat || 'Sistem berjalan dengan baik',
          status: 'draft',
          acceptance_criteria: [],
          tech_notes: [],
          test_cases: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal membuat story baru');
      }

      const createdStory = await response.json();
      mutate(
        (prev: any) => {
          if (!prev) return prev;
          const updatedEpics = newlyCreatedEpic
            ? [...(prev.epics || []), newlyCreatedEpic]
            : (prev.epics || []);
          const updatedStories = [...(prev.stories || []), createdStory];
          return { ...prev, epics: updatedEpics, stories: updatedStories };
        },
        false
      );
      setIsModalOpen(false);
      setNewTitle('');
      setNewAsA('');
      setNewSoThat('');
      setEpicInput('');
    } catch (err: any) {
      console.error('Gagal membuat story:', err);
      alert(err.message || 'Gagal membuat story.');
    }
  };

    const handleUpdateStory = async (updatedStory: UserStory) => {
    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stories/${updatedStory.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
            body: JSON.stringify({
            as_a: updatedStory.as_a,
            i_want: updatedStory.i_want,
            so_that: updatedStory.so_that,
            acceptance_criteria: updatedStory.acceptanceCriteria,
            tech_notes: updatedStory.techNotes,
            test_cases: (updatedStory.testCases || []).map((tc) => ({
              action: tc.action,
              expected_result: tc.expectedResult,
            })),
            labels: updatedStory.labels,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = Array.isArray(errorData.detail)
          ? errorData.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('; ')
          : errorData.detail;
        throw new Error(msg || 'Gagal update story');
      }

      mutate(
        (prev: any) =>
          prev
            ? {
                ...prev,
                stories: (prev.stories || []).map((s: any) =>
                  s.id === updatedStory.id
                                        ? {
                        ...s,
                        ...updatedStory,
                        acceptance_criteria: (updatedStory.acceptanceCriteria || []).map((desc) => ({ description: desc })),
                        tech_notes: (updatedStory.techNotes || []).map((content) => ({ content })),
                        test_cases: (updatedStory.testCases || []).map((tc) => ({
                          id: tc.id,
                          action: tc.action,
                          expected_result: tc.expectedResult,
                        })),
                        labels: updatedStory.labels || [],
                      }
                    : s
                ),
              }
            : prev,
        false
      );
      setSelectedStory(updatedStory);
    } catch (err: any) {
      console.error('Gagal update story:', err);
      alert(err.message || 'Gagal menyimpan perubahan story.');
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    if (!confirm('Apakah kamu yakin ingin menghapus User Story ini?')) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stories/${selectedStory.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal menghapus story');
      }

      mutate(
        (prev: any) =>
          prev
            ? {
                ...prev,
                stories: (prev.stories || []).filter((s: any) => s.id !== selectedStory.id),
              }
            : prev,
        false
      );
      setSelectedStory(null);
    } catch (err: any) {
      console.error('Gagal hapus story:', err);
      alert(err.message || 'Gagal menghapus story.');
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        alert(`File "${file.name}" berhasil di-upload!`);
      }
    };
    input.click();
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!projectId) {
      alert("Pilih proyek terlebih dahulu.");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      alert("Sesi login berakhir. Silakan login kembali.");
      return;
    }

    try {
      setIsExportingPdf(true);
      await projectApi.downloadProjectPdf(Number(projectId), projectName || 'project', token);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh dokumen PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!cacheData?.project) {
      alert("Data proyek belum siap.");
      return;
    }

    const proj = cacheData.project;
    let md = `# ${proj.name || 'Project'} — Product Requirements Document (PRD)\n\n`;
    md += `> Dokumen Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification)\n\n`;
    md += `## 1. Project Overview\n\n`;
    md += `- **Nama Proyek**: ${proj.name || '-'}\n`;
    md += `- **Tipe Aplikasi**: ${proj.application_type || '-'}\n`;
    md += `- **Domain Bisnis**: ${proj.domain_business || '-'}\n`;
    md += `- **Target Pengguna**: ${proj.target_users || '-'}\n`;
    md += `- **Tujuan Bisnis**: ${proj.business_goals || '-'}\n`;
    md += `- **Deskripsi**:\n  ${proj.description || '-'}\n\n`;

    md += `## 2. Kebutuhan Fungsional (Epics & User Stories)\n\n`;
    formattedEpics.forEach((epic) => {
      md += `### ${epic.code}: ${epic.name}\n`;
      if (epic.description) md += `*${epic.description}*\n\n`;

      if (epic.user_stories.length === 0) {
        md += `*Belum ada user story di modul ini.*\n\n`;
      } else {
        epic.user_stories.forEach((story) => {
          md += `#### ${story.code}: Sebagai ${story.as_a}, saya ingin ${story.i_want}\n`;
          md += `**Narasi**: Sebagai ${story.as_a}, saya ingin ${story.i_want}, agar ${story.so_that}.\n\n`;

          if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
            md += `**Acceptance Criteria (Kriteria Penerimaan)**:\n`;
            story.acceptanceCriteria.forEach((ac) => {
              md += `- ${ac}\n`;
            });
            md += `\n`;
          }

          if (story.techNotes && story.techNotes.length > 0) {
            md += `**Catatan Teknis (Tech Notes)**:\n`;
            story.techNotes.forEach((tn) => {
              md += `- \`${tn}\`\n`;
            });
            md += `\n`;
          }

          if (story.testCases && story.testCases.length > 0) {
            md += `**Skenario Pengujian (QA Test Cases)**:\n`;
            story.testCases.forEach((tc) => {
              md += `- **Aksi**: ${tc.action} → **Ekspektasi**: ${tc.expectedResult}\n`;
            });
            md += `\n`;
          }
        });
      }
    });

    if (rawNfrs.length > 0) {
      md += `## 3. Non-Functional Requirements (NFR)\n\n`;
      rawNfrs.forEach((nfr, nIdx) => {
        md += `### ${nIdx + 1}. [${nfr.category}]\n${nfr.description}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (proj.name || 'project').replace(/[^a-zA-Z0-9_\-]/g, '_');
    a.download = `${safeName}-PRD.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formattedEpics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${projectName || 'project'}-stories.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  const handleEpicCreated = (newEpic: any) => {
    mutate((prev: any) => (prev ? { ...prev, epics: [...(prev.epics || []), newEpic] } : prev), false);
    setIsEpicModalOpen(false);
    if (newEpic?.name) {
      setEpicInput(newEpic.name);
    }
  };

  const handleEpicUpdated = (updatedEpic: Epic) => {
  mutate(
    (prev: any) =>
      prev
        ? {
            ...prev,
            epics: (prev.epics || []).map((e: any) =>
              e.id === updatedEpic.id
                ? { ...e, name: updatedEpic.name, description: updatedEpic.description }
                : e
            ),
          }
        : prev,
    false
  );
  setSelectedEpic((prev) => (prev && prev.id === updatedEpic.id ? updatedEpic : prev));
};

  const handleNfrCreated = (newNfr: NFR) => {
    mutate((prev: any) => (prev ? { ...prev, nfrs: [...(prev.nfrs || []), newNfr] } : prev), false);
    setIsNfrModalOpen(false);
    setSelectedNfrCategory(newNfr.category);
    setSelectedStory(null);
    setSelectedEpic(null);
  };

  // Dipakai NfrCategoryDetailPanel: tambah NFR baru langsung di category yang lagi dibuka.
  const handleNfrCreatedInPanel = (newNfr: NFR) => {
    mutate((prev: any) => (prev ? { ...prev, nfrs: [...(prev.nfrs || []), newNfr] } : prev), false);
  };

    // Dipakai ManualStoryDetailPanel: sync cache setelah upload/hapus gambar,
  // tanpa perlu kirim PUT ke endpoint update story (images punya endpoint sendiri).
  const handleStoryImagesUpdated = (storyId: number | string, rawImages: any[]) => {
    mutate(
      (prev: any) =>
        prev
          ? {
              ...prev,
              stories: (prev.stories || []).map((s: any) =>
                s.id === storyId ? { ...s, images: rawImages } : s
              ),
            }
          : prev,
      false
    );
    setSelectedStory((prev) =>
      prev && prev.id === storyId
        ? {
            ...prev,
            images: rawImages.map((img: any) => ({
              id: img.id,
              url: img.url,
              caption: img.caption,
              createdAt: img.created_at,
            })),
          }
        : prev
    );
  };

  const handleNfrUpdated = (updatedNfr: NFR) => {
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, nfrs: (prev.nfrs || []).map((n: any) => (n.id === updatedNfr.id ? updatedNfr : n)) }
          : prev,
      false
    );
  };

  const handleNfrDeleted = (nfrId: string | number) => {
    mutate(
      (prev: any) =>
        prev ? { ...prev, nfrs: (prev.nfrs || []).filter((n: any) => n.id !== nfrId) } : prev,
      false
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans relative">
      <AppSidebar activeMenu="stories" projectId={projectId} />

      {!mounted || isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Memuat data proyek...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md px-6">
            <p className="text-red-600 font-bold mb-1">Gagal memuat data</p>
            <p className="text-xs text-gray-500">{loadError}</p>
          </div>
        </div>
      ) : (
        <>
          <StoriesSidebar
            epics={formattedEpics}
            nfrs={rawNfrs}
            selectedStoryId={selectedStory?.id as string}
            selectedNfrCategory={selectedNfrCategory}
            workspaceId={projectWorkspaceId}
            onSelectStory={(story) => {
              setSelectedStory(story);
              setSelectedEpic(null);
              setSelectedNfrCategory(null);
            }}
            onSelectEpic={(epic) => {
              setSelectedEpic(epic);
              setSelectedStory(null);
              setSelectedNfrCategory(null);
            }}
            onSelectNfrCategory={(category) => {
              setSelectedNfrCategory(category);
              setSelectedStory(null);
              setSelectedEpic(null);
            }}
            onAddNew={() => setIsModalOpen(true)}
            onAddNewEpic={() => setIsEpicModalOpen(true)}
            onAddNewNfr={() => setIsNfrModalOpen(true)}
            projectName={projectName}
            projectId={projectId}
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
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                    >
                      <span>{projectName || 'Untitled Project'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                />
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
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-rose-50 text-rose-700 bg-rose-50/50 rounded-lg transition-colors border border-rose-200 cursor-pointer text-xs font-semibold disabled:opacity-50"
                    title="Download Dokumen Spesifikasi sebagai PDF"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Unduh PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-blue-50 text-blue-700 bg-blue-50/50 rounded-lg transition-colors border border-blue-200 cursor-pointer text-xs font-semibold"
                    title="Download Dokumen Spesifikasi sebagai Markdown (PRD.md)"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unduh Markdown</span>
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

            <div className="flex-1 flex flex-col overflow-hidden">
              {formattedEpics.length === 0 && (
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-800 shrink-0">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Belum ada Epic atau User Story. Silakan buat yang pertama.</span>
                </div>
              )}

              <div className="flex-1 flex overflow-hidden">
                {selectedStory ? (
                  <ManualStoryDetailPanel
                    key={String(selectedStory.id)}
                    story={selectedStory}
                    onDelete={handleDeleteStory}
                    onUpdate={handleUpdateStory}
                    onImagesUpdated={handleStoryImagesUpdated}
                    allStories={allStories}
                    projectId={projectId}
                  />

                ) : selectedEpic ? (
                  <EpicDetailPanel
                    key={String(selectedEpic.id)}
                    epic={selectedEpic}
                    onSelectStory={(story: UserStory) => {
                      setSelectedStory(story);
                      setSelectedEpic(null);
                    }}
                    onUpdated={handleEpicUpdated}
                  />
                ) : selectedNfrCategory ? (
                  <NfrCategoryDetailPanel
                    key={selectedNfrCategory}
                    category={selectedNfrCategory}
                    items={selectedNfrItems}
                    projectId={projectId}
                    projectName={projectName}
                    onUpdated={handleNfrUpdated}
                    onDeleted={handleNfrDeleted}
                    onCreated={handleNfrCreatedInPanel}
                  />
                ) : (
                  <EmptyDetailPanel
                    onOpenAddModal={() => setIsModalOpen(true)}
                    onOpenAddEpicModal={() => setIsEpicModalOpen(true)}
                    onOpenAddNfrModal={() => setIsNfrModalOpen(true)}
                    workspaceId={projectWorkspaceId}
                    projectId={projectId}
                  />
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </span>
                <h2 className="text-sm font-semibold text-gray-800">New User Story</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewStoryAiError(null);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStory} className="px-5 py-4 space-y-4">
              <button
                type="button"
                onClick={handleGenerateStoryDraft}
                disabled={newStoryAiLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-purple-600 border border-purple-200 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {newStoryAiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {newStoryAiLoading ? 'Generating...' : 'Generate with AI'}
              </button>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Epic <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEpicModalOpen(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Epic Baru</span>
                  </button>
                </div>
                <select
                  value={epicInput}
                  onChange={(e) => setEpicInput(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Epic --</option>
                  {formattedEpics.map((ep) => (
                    <option key={ep.id} value={ep.name}>
                      {ep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  As a <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Admin, Guest, Registered User"
                  value={newAsA}
                  onChange={(e) => setNewAsA(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  I want to <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. log in to the system"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  So that <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. I can access the main dashboard"
                  value={newSoThat}
                  onChange={(e) => setNewSoThat(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {newStoryAiError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {newStoryAiError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewStoryAiError(null);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Create Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateEpicModal
        isOpen={isEpicModalOpen}
        onClose={() => setIsEpicModalOpen(false)}
        onCreated={handleEpicCreated}
        projectId={projectId}
        projectName={projectName}
        existingEpics={formattedEpics.map((e) => e.name)}
      />

      <CreateNfrModal
        isOpen={isNfrModalOpen}
        onClose={() => setIsNfrModalOpen(false)}
        onCreated={handleNfrCreated}
        projectId={projectId}
        projectName={projectName}
        existingCategories={existingNfrCategories}
      />
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <StoriesPageContent />
    </Suspense>
  );
}