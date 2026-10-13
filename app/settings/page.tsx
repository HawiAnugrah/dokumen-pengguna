// app/settings/page.tsx
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import AppSidebar from '@/features/common/components/AppSidebar';
import AccountMenu from '@/features/common/components/accountMenu';
import {
  Settings as SettingsIconLucide,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Coins,
  Zap,
  History,
  Bot,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Cpu,
  Calendar,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  User,
  Shield,
} from 'lucide-react';
import ProjectMenuDropdown from '@/features/stories/components/ProjectMenuDropdown';
import { projectApi } from '@/services/projectsApi';
import { settingsApi, AIRule, AIRuleSuggestion, TokenUsageData } from '@/services/settingsApi';
import { workspaceApi, WorkspaceMemberResponse } from '@/services/workspaceApi';
import { getAuthToken } from '@/lib/auth';
import { getStoredProjectId, setStoredProjectId, clearStoredProjectId } from '@/lib/project-context';

const MAX_DESC_LENGTH = 2000;

// ⚡ Preset Template Bawaan (Langsung muncul seketika / 0 detik tanpa loading)
const PRESET_AI_RULES: AIRuleSuggestion[] = [
  {
    name: 'Format Acceptance Criteria: Given-When-Then (BDD)',
    content: 'Tulis seluruh Acceptance Criteria menggunakan format terstruktur Given-When-Then (Gherkin format) dengan kondisi awal, aksi pengguna, dan ekspektasi sistem yang dapat diverifikasi dengan jelas.',
  },
  {
    name: 'Gaya Bahasa: Formal, Jelas, & Bahasa Indonesia',
    content: 'Gunakan Bahasa Indonesia baku yang profesional, jelas, dan ringkas. Hindari istilah ambigu serta gunakan terminologi baku software engineering yang konsisten.',
  },
  {
    name: 'Detail Validasi Input & Skenario Error (Edge Cases)',
    content: 'Selalu cantumkan aturan validasi input form (tipe data, batasan karakter, format email/telepon) dan skenario penanganan kesalahan (error handling/edge cases) yang deskriptif.',
  },
  {
    name: 'Standar Keamanan & Autentikasi (OWASP)',
    content: 'Pastikan setiap kebutuhan yang memproses data sensitif atau otentikasi menerapkan prinsip keamanan OWASP: validasi authorization per role, perlindungan CSRF/XSS, dan enkripsi payload.',
  },
  {
    name: 'Spesifikasi Arsitektur API & Database',
    content: 'Pada Tech Notes, jelaskan usulan endpoint RESTful API (HTTP Method, Route, Status Code), skema tabel database terkait, serta dependensi antarmuka backend yang relevan.',
  },
  {
    name: 'Desain Responsif & Mobile-First UX',
    content: 'Pastikan spesifikasi user interface mempertimbangkan kenyamanan penggunaan mobile (touch target minimal 44x44px, bottom sheet, serta layout yang adaptif untuk desktop & smartphone).',
  },
];

const TAB_LABELS: Record<'general' | 'ai-rules' | 'token-usage', string> = {
  general: 'General',
  'ai-rules': 'AI Rules',
  'token-usage': 'Pelacak RPD',
};

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdParam = searchParams.get('project_id') || getStoredProjectId();
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'general' | 'ai-rules' | 'token-usage'>('general');
  const [reloadToken, setReloadToken] = useState(0);

  const [aiRules, setAiRules] = useState<AIRule[]>([]);
  const [suggestions, setSuggestions] = useState<AIRuleSuggestion[]>(PRESET_AI_RULES);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<string>('0');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // State untuk Custom Manual Rule
  const [showCustomRuleForm, setShowCustomRuleForm] = useState(false);
  const [customRuleName, setCustomRuleName] = useState('');
  const [customRuleContent, setCustomRuleContent] = useState('');
  const [isSavingCustomRule, setIsSavingCustomRule] = useState(false);

  // State untuk Manage Members
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInvitingMember, setIsInvitingMember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // State untuk Token & AI Usage
  const [tokenData, setTokenData] = useState<TokenUsageData | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [providerHistoryFilter, setProviderHistoryFilter] = useState<string>('all');

  const loadTokenUsage = async () => {
    if (!token) return;
    setIsLoadingTokens(true);
    try {
      const data = await settingsApi.getTokenUsage(token, projectIdParam ? Number(projectIdParam) : undefined);
      setTokenData(data);
    } catch (err) {
      console.error('Gagal memuat data token usage:', err);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'token-usage') {
      loadTokenUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 🚀 SWR Cache: Data Settings langsung tampil seketika (0 detik)
  const { data: cacheData, error: swrError, isLoading: isPageLoading, mutate } = useSWR(
    mounted && projectIdParam && token ? [`settings-data`, projectIdParam, token, reloadToken] : null,
    async ([, projId, tok]: [string, string, string, number]) => {
      const project = await projectApi.getProjectById(Number(projId), tok);
      const [rules, wsMembers] = await Promise.all([
        settingsApi.getProjectAIRules(Number(projId), tok),
        project?.workspace_id
          ? workspaceApi.getWorkspaceMembers(project.workspace_id, tok).catch(() => [])
          : Promise.resolve([]),
      ]);
      return { project, rules: rules || [], members: wsMembers || [] };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  useEffect(() => {
    if (cacheData) {
      setProjectName(cacheData.project?.name || '');
      setProjectDesc(cacheData.project?.description || '');
      setAiRules(cacheData.rules || []);
      setMembers(cacheData.members || []);
      if (projectIdParam) setStoredProjectId(projectIdParam);
    }
  }, [cacheData, projectIdParam]);

  const projectWorkspaceId = cacheData?.project?.workspace_id || null;
  const loadError = swrError ? (swrError.message || 'Gagal memuat data dari server.') : '';

  const handleRetry = useCallback(() => setReloadToken((n) => n + 1), []);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.trim()) {
      setMessage({ type: 'error', text: 'Masukkan alamat email anggota yang ingin diundang.' });
      return;
    }
    if (!projectWorkspaceId || !token) {
      setMessage({ type: 'error', text: 'Ruang kerja tidak ditemukan.' });
      return;
    }

    setIsInvitingMember(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await workspaceApi.addWorkspaceMember(projectWorkspaceId, inviteEmail.trim(), inviteRole, token);
      setMessage({ type: 'success', text: res.message || `Berhasil menambahkan ${inviteEmail}` });
      setInviteEmail('');
      const updated = await workspaceApi.getWorkspaceMembers(projectWorkspaceId, token);
      setMembers(updated);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengundang anggota tim.' });
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${email} dari tim ini?`)) return;
    if (!projectWorkspaceId || !token) return;

    try {
      await workspaceApi.removeWorkspaceMember(projectWorkspaceId, userId, token);
      setMessage({ type: 'success', text: `Berhasil menghapus ${email}` });
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus anggota tim.' });
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    const token = getAuthToken();
    if (!token || !projectIdParam) {
      setMessage({ type: 'error', text: 'Sesi habis, silakan login kembali.' });
      setLoading(false);
      return;
    }

    try {
      await projectApi.updateProject(
        Number(projectIdParam),
        { name: projectName, description: projectDesc },
        token
      );
      setMessage({ type: 'success', text: 'Pengaturan proyek berhasil disimpan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui proyek' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aturan AI ini?')) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      await settingsApi.deleteAIRule(ruleId, token);
      setAiRules(aiRules.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      console.error('Gagal menghapus aturan AI', err);
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus aturan AI' });
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!projectIdParam) return;
    const token = getAuthToken();
    if (!token) return;

    setIsGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await settingsApi.generateAIRuleSuggestions(Number(projectIdParam), token);
      setSuggestions(result);
      setSelectedSuggestionIdx(result.length > 0 ? '0' : '');
      if (result.length === 0) {
        setMessage({ type: 'error', text: 'AI tidak menghasilkan saran. Coba lagi.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'AI gagal memberikan saran.' });
    } finally {
      setIsGenerating(false);
    }
  };

    const handleAddSelectedSuggestion = async () => {
    if (!projectIdParam || selectedSuggestionIdx === '') return;
    const suggestion = suggestions[Number(selectedSuggestionIdx)];
    if (!suggestion) return;

    const token = getAuthToken();
    if (!token) return;

    setIsAddingSuggestion(true);
    try {
      const newRule = await settingsApi.createProjectAIRule(Number(projectIdParam), suggestion, token);
      setAiRules((prev) => [...prev, newRule]);
      setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
      setSelectedSuggestionIdx('0');
      setMessage({ type: 'success', text: `Berhasil menambahkan aturan: ${suggestion.name}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menambahkan aturan.' });
    } finally {
      setIsAddingSuggestion(false);
    }
  };

  const handleSaveCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectIdParam || !customRuleName.trim() || !customRuleContent.trim()) {
      setMessage({ type: 'error', text: 'Nama aturan dan isi instruksi wajib diisi.' });
      return;
    }
    const token = getAuthToken();
    if (!token) return;

    setIsSavingCustomRule(true);
    setMessage({ type: '', text: '' });
    try {
      const newRule = await settingsApi.createProjectAIRule(
        Number(projectIdParam),
        { name: customRuleName.trim(), content: customRuleContent.trim() },
        token
      );
      setAiRules((prev) => [...prev, newRule]);
      setCustomRuleName('');
      setCustomRuleContent('');
      setShowCustomRuleForm(false);
      setMessage({ type: 'success', text: 'Aturan AI kustom berhasil ditambahkan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menambahkan aturan kustom.' });
    } finally {
      setIsSavingCustomRule(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectIdParam) return;
    if (
      !confirm(
        `Hapus project "${projectName}"? Seluruh data akan terhapus permanen dan tidak bisa dikembalikan.`
      )
    )
      return;

    const token = getAuthToken();
    if (!token) return;

    setIsDeletingProject(true);
    try {
      await projectApi.deleteProject(Number(projectIdParam), token);
      clearStoredProjectId();
      router.push('/workspace');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus project.' });
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      {/* 🚀 AppSidebar SELALU Tampil di Layar Secara Konsisten */}
      <AppSidebar activeMenu="settings" projectId={projectIdParam} />

      {!mounted || isPageLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md px-6">
            <p className="text-red-600 font-medium mb-2">Gagal memuat data</p>
            <p className="text-sm text-gray-500 mb-4">{loadError}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top Navbar -- pola breadcrumb yang sama dengan halaman lain (Journeys, Build, dst) */}
        <div className="h-14 border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <ProjectMenuDropdown
              workspaceId={projectWorkspaceId}
              activeProjectId={projectIdParam}
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
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <SettingsIconLucide className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Settings</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900">{TAB_LABELS[activeTab]}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                title="Upload Document"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                title="Download / Export"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <AccountMenu currentWorkspaceId={projectWorkspaceId} />
          </div>
        </div>

        {/* Konten Settings */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-6 px-6 pt-5 border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                    activeTab === 'general'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('ai-rules')}
                  className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                    activeTab === 'ai-rules'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  AI Rules
                </button>
                <button
                  onClick={() => setActiveTab('token-usage')}
                  className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                    activeTab === 'token-usage'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Pelacak RPD
                </button>
              </div>

              <div className="p-6">
                {message.text && (
                  <div
                    className={`mb-6 p-3.5 rounded-xl flex items-start gap-2.5 text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 border border-green-100 text-green-800'
                        : 'bg-red-50 border border-red-100 text-red-800'
                    }`}
                  >
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>{message.text}</span>
                  </div>
                )}

                {/* ============ TAB: GENERAL ============ */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                        Project name
                      </label>
                      <input
                        type="text"
                        required
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                        Project description
                      </label>
                      <div className="relative">
                        <textarea
                          rows={5}
                          maxLength={MAX_DESC_LENGTH}
                          value={projectDesc}
                          onChange={(e) => setProjectDesc(e.target.value)}
                          className="block w-full px-3.5 py-2.5 border text-gray-900 border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                        />
                        <span className="absolute bottom-2.5 right-3.5 text-[11px] text-gray-400">
                          {projectDesc.length} / {MAX_DESC_LENGTH}
                        </span>
                      </div>
                    </div>

                    {/* Manage project members */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-800">
                          Manage project members
                        </label>
                        <span className="text-xs text-gray-400 font-medium">
                          {members.length} anggota
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Undang anggota tim baru menggunakan alamat email terdaftar</p>
                      
                      <form onSubmit={handleInviteMember} className="flex items-center gap-2 mb-4">
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Masukkan email anggota (misal: user@gmail.com)..."
                          disabled={isInvitingMember}
                          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all disabled:opacity-50"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                          disabled={isInvitingMember}
                          className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          type="submit"
                          disabled={isInvitingMember || !inviteEmail.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap"
                        >
                          {isInvitingMember ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          <span>+ Add</span>
                        </button>
                      </form>

                      {/* List Anggota yang Ada */}
                      {members.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {members.map((m) => (
                            <div
                              key={m.user_id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                                  {m.username?.charAt(0).toUpperCase() || m.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{m.username || m.email}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  m.role === 'owner'
                                    ? 'bg-amber-100 text-amber-800'
                                    : m.role === 'editor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {m.role}
                                </span>
                                {m.role !== 'owner' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(m.user_id, m.email)}
                                    title="Hapus dari ruang kerja"
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleDeleteProject}
                        disabled={isDeletingProject}
                        className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingProject ? 'Menghapus...' : 'Delete'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(projectIdParam ? `/stories?project_id=${projectIdParam}` : '/stories')}
                          className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGeneral}
                          disabled={loading}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {loading ? 'Menyimpan...' : 'Save Project'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============ TAB: AI RULES ============ */}
                {activeTab === 'ai-rules' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">AI Rules</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        AI Rules allow you to tailor the behaviour and responses of the AI assistant
                        for this project. Add reusable instructions that guide how user stories,
                        personas, journeys, requirements, and technical documentation are generated,
                        ensuring every output follows your team&apos;s standards and writing style.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Project-specific AI Rules</p>
                        <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                          These AI rules apply only to this project. They can significantly influence
                          AI-generated content. Configure them carefully to maintain consistent,
                          accurate, and reliable outputs.
                        </p>
                      </div>
                    </div>

                                        {/* Controls: Preset Template & Custom Rule */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-800">
                          Pilih Template Aturan / Tambah Aturan Baru
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCustomRuleForm(!showCustomRuleForm)}
                            className="text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {showCustomRuleForm ? 'Tutup Form Kustom' : '+ Tulis Aturan Manual'}
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateSuggestions}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
                            title="Generate ide aturan baru spesifik proyek dari AI"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            )}
                            {isGenerating ? 'AI Thinking...' : '✨ Generate Saran AI'}
                          </button>
                        </div>
                      </div>

                      {/* Form Tulis Aturan Manual (Bebas Input) */}
                      {showCustomRuleForm && (
                        <form onSubmit={handleSaveCustomRule} className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Tambah Aturan AI Kustom</span>
                            <span className="text-[11px] text-blue-600">Instruksi akan langsung memandu asisten AI</span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Aturan</label>
                            <input
                              type="text"
                              required
                              value={customRuleName}
                              onChange={(e) => setCustomRuleName(e.target.value)}
                              placeholder="Contoh: Format Penulisan Acceptance Criteria"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Isi Instruksi / Prompt Rule</label>
                            <textarea
                              required
                              rows={3}
                              value={customRuleContent}
                              onChange={(e) => setCustomRuleContent(e.target.value)}
                              placeholder="Tuliskan instruksi spesifik untuk memandu AI saat menyusun requirements..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowCustomRuleForm(false)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingCustomRule || !customRuleName.trim() || !customRuleContent.trim()}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isSavingCustomRule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                              Simpan Aturan
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Dropdown Preset Library (0 Detik) */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedSuggestionIdx}
                            onChange={(e) => setSelectedSuggestionIdx(e.target.value)}
                            disabled={suggestions.length === 0}
                            className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-800 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                          >
                            {suggestions.map((s, i) => (
                              <option key={i} value={i}>
                                ⚡ {s.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddSelectedSuggestion}
                            disabled={isAddingSuggestion || selectedSuggestionIdx === '' || suggestions.length === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            {isAddingSuggestion ? 'Adding...' : '+ Add Rule'}
                          </button>
                        </div>
                        {suggestions.length > 0 && selectedSuggestionIdx !== '' && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-800 block mb-1">Preview Instruksi:</span>
                            {suggestions[Number(selectedSuggestionIdx)]?.content}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* List rules yang sudah tersimpan */}
                    {aiRules.length === 0 ? (
                      <div className="text-center py-10 border-t border-gray-100">
                        <Bot className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700">Belum ada aturan AI</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Klik tombol &quot;Generate&quot; di atas untuk memilih dan menambahkan aturan AI pertama Anda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        {aiRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-4 border border-gray-200 rounded-xl flex justify-between items-start gap-4"
                          >
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">{rule.name}</h4>
                              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
                                {rule.content}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => router.push(projectIdParam ? `/stories?project_id=${projectIdParam}` : '/stories')}
                        className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessage({ type: 'success', text: 'Pengaturan AI Rules sudah aktif dan tersimpan!' });
                          router.push(projectIdParam ? `/stories?project_id=${projectIdParam}` : '/stories');
                        }}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* ============ TAB: PELACAK RPD (REQUESTS PER DAY) ============ */}
                {activeTab === 'token-usage' && (
                  <div className="space-y-6">
                    {isLoadingTokens ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">Memuat statistik RPD...</span>
                      </div>
                    ) : (
                      <>
                        {/* 1. Global Overview Metrics RPD */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500" /> RPD Terpakai Hari Ini
                            </span>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                              <span className="text-xl font-bold text-gray-900">
                                {tokenData?.rpd_total_used != null ? tokenData.rpd_total_used.toLocaleString() : '0'}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                / {(tokenData?.rpd_total_limit ?? 2700).toLocaleString()} RPD
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              Total permintaan AI seluruh provider hari ini (UTC)
                            </span>
                          </div>

                          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Total Request Bulan Ini
                            </span>
                            <div className="mt-1.5 text-xl font-bold text-blue-600">
                              {tokenData?.monthly_requests_total != null ? tokenData.monthly_requests_total.toLocaleString() : '0'}
                              <span className="text-xs text-gray-400 font-normal ml-1">panggilan</span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {tokenData ? tokenData.monthly_used.toLocaleString() : '0'} total token terakumulasi
                            </span>
                          </div>

                          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Status Multi-AI
                            </span>
                            <div className="mt-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                                3 Provider Terhubung
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                              Round-Robin & Automatic Failover Siap
                            </span>
                          </div>
                        </div>

                        {/* 2. Pelacakan RPD Terpisah Per Masing-Masing Provider AI */}
                        <div className="border-t border-gray-100 pt-5">
                          <div className="flex items-center justify-between mb-3.5">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-500" /> Pelacakan RPD (Requests Per Day) Per Provider AI
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Batas dan penggunaan Request Per Day (RPD) yang dialokasikan oleh masing-masing penyedia AI
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {tokenData?.providers_info.map((p) => {
                              const isGemini = p.provider_key === 'gemini';
                              const isOpenRouter = p.provider_key === 'openrouter';
                              const isGroq = p.provider_key === 'groq';

                              const ProviderIcon = isGemini ? Sparkles : isOpenRouter ? Bot : Cpu;
                              const iconColor = isGemini ? 'text-blue-600' : isOpenRouter ? 'text-violet-600' : 'text-emerald-600';
                              const iconBg = isGemini ? 'bg-blue-50 border-blue-200' : isOpenRouter ? 'bg-violet-50 border-violet-200' : 'bg-emerald-50 border-emerald-200';
                              
                              const rpdUsed = p.rpd_used ?? p.requests_today ?? 0;
                              const rpdLimit = p.rpd_limit ?? (isGemini ? 1500 : isOpenRouter ? 200 : 1000);
                              const rpdPct = p.rpd_percentage ?? (rpdLimit > 0 ? Math.min(100, Math.round((rpdUsed / rpdLimit) * 100)) : 0);
                              const rpdRem = p.rpd_remaining ?? Math.max(0, rpdLimit - rpdUsed);

                              const progressColor =
                                rpdPct > 90
                                  ? 'bg-red-500'
                                  : rpdPct > 70
                                  ? 'bg-amber-500'
                                  : isGemini
                                  ? 'bg-blue-600'
                                  : isOpenRouter
                                  ? 'bg-violet-600'
                                  : 'bg-emerald-600';

                              return (
                                <div
                                  key={p.provider_key}
                                  className="border border-gray-200 bg-white p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all"
                                >
                                  <div>
                                    {/* Header Kartu Provider */}
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                                          <ProviderIcon className={`w-4 h-4 ${iconColor}`} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-900">{p.name}</span>
                                      </div>
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                          p.status === 'Ready'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {p.status}
                                      </span>
                                    </div>

                                    {/* Model Badge */}
                                    <div className="bg-gray-50 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600 truncate mb-4 border border-gray-100">
                                      {p.model}
                                    </div>

                                    {/* Pelacakan RPD (Requests Per Day) */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-gray-50/60 border border-gray-100 mb-3">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                          <Zap className="w-3 h-3 text-amber-500" /> Limit RPD Harian
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-800">
                                          {rpdPct}%
                                        </span>
                                      </div>
                                      <div className="flex items-baseline justify-between text-xs">
                                        <span className="font-bold text-gray-900 text-sm">
                                          {rpdUsed.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">RPD</span>
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                          / {rpdLimit.toLocaleString()} RPD
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
                                          style={{ width: `${rpdPct}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                                        <span>{rpdRem.toLocaleString()} sisa request hari ini</span>
                                        <span>{p.daily_used.toLocaleString()} token terpakai</span>
                                      </div>
                                    </div>

                                    {/* Akumulasi Request & Token Per Bulan */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3 text-gray-400" /> Akumulasi Bulan Ini
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-800">
                                          {p.requests_month} request
                                        </span>
                                      </div>
                                      <div className="flex items-baseline justify-between text-xs">
                                        <span className="font-bold text-gray-900">
                                          {p.monthly_used.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">token</span>
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                          / {p.monthly_limit.toLocaleString()} token
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                          style={{ width: `${p.monthly_percentage}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                                        <span>{p.monthly_remaining.toLocaleString()} sisa kuota token</span>
                                        <span>{p.monthly_percentage}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Riwayat Pemanggilan AI Terakhir dengan Filter Provider */}
                        <div className="border-t border-gray-100 pt-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <History className="w-4 h-4 text-blue-600" /> Riwayat Request AI Terakhir
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Log audit pemanggilan API, model, serta prompt dan completion token
                              </p>
                            </div>

                            {/* Filter Provider Pills */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px]">
                              {[
                                { key: 'all', label: 'Semua' },
                                { key: 'gemini', label: 'Gemini' },
                                { key: 'openrouter', label: 'OpenRouter' },
                                { key: 'groq', label: 'Groq' },
                              ].map((f) => (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() => setProviderHistoryFilter(f.key)}
                                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                                    providerHistoryFilter === f.key
                                      ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                      : 'text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(() => {
                            const filteredHistory = (tokenData?.history || []).filter((h) => {
                              if (providerHistoryFilter === 'all') return true;
                              return h.provider.toLowerCase() === providerHistoryFilter.toLowerCase();
                            });

                            return filteredHistory.length > 0 ? (
                              <div className="overflow-x-auto -mx-1 border border-gray-100 rounded-xl">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-gray-50/80">
                                    <tr className="border-b border-gray-200 text-gray-500">
                                      <th className="py-2.5 font-medium px-3">Fitur</th>
                                      <th className="py-2.5 font-medium px-2">Provider</th>
                                      <th className="py-2.5 font-medium px-2">Model</th>
                                      <th className="py-2.5 font-medium text-right px-2">Prompt</th>
                                      <th className="py-2.5 font-medium text-right px-2">Completion</th>
                                      <th className="py-2.5 font-medium text-right px-3">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                                    {filteredHistory.map((h) => (
                                      <tr key={h.id} className="hover:bg-gray-50/70">
                                        <td className="py-2.5 px-3 font-medium text-gray-900">{h.feature}</td>
                                        <td className="py-2.5 px-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] bg-gray-100 text-gray-700 uppercase">
                                            {h.provider}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-2 font-mono text-[10px] text-gray-500 truncate max-w-[120px]" title={h.model_name}>
                                          {h.model_name}
                                        </td>
                                        <td className="py-2.5 px-2 text-right font-mono text-gray-600">
                                          {h.prompt_tokens.toLocaleString()}
                                        </td>
                                        <td className="py-2.5 px-2 text-right font-mono text-gray-600">
                                          {h.completion_tokens.toLocaleString()}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                                          {h.total_tokens.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-400 text-xs bg-gray-50/50 rounded-xl border border-gray-100">
                                Belum ada riwayat pemanggilan AI untuk filter ini.
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}