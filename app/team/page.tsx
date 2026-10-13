// app/team-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoUserdoc from '@/public/logoUserDoc';
import { workspaceApi, WorkspaceResponse, WorkspaceMemberResponse } from '@/services/workspaceApi';
import { getAuthToken } from '@/lib/auth';
import {
  Users, Settings as SettingsIcon, Brain, Trash2, Plus, AlertCircle, Loader2,
  ArrowLeft, UserPlus, Crown, Shield, Eye, X, CheckCircle2
} from 'lucide-react';

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'bg-amber-100 text-amber-700' },
  editor: { label: 'Editor', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-gray-100 text-gray-600' },
};

export default function TeamSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'ai-rules'>('general');

  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [aiRules, setAiRules] = useState<any[]>([]);
  const [teamNameInput, setTeamNameInput] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [savingName, setSavingName] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoadError('Sesi habis, silakan login kembali.');
        setIsLoading(false);
        return;
      }
      try {
        const workspaces = await workspaceApi.getMyWorkspaces(token);
        if (!workspaces || workspaces.length === 0) {
          router.replace('/project-setup');
          return;
        }
        const ws = workspaces[0];
        setWorkspace(ws);
        setTeamNameInput(ws.name);

        const [memberList, ruleList] = await Promise.all([
          workspaceApi.getWorkspaceMembers(ws.id, token),
          workspaceApi.getWorkspaceAIRules(ws.id, token),
        ]);
        setMembers(memberList);
        setAiRules(ruleList);
      } catch (err: any) {
        setLoadError(err.message || 'Gagal memuat data team.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    const token = getAuthToken();
    if (!token) return;

    setSavingName(true);
    try {
      const updated = await workspaceApi.updateWorkspace(workspace.id, { name: teamNameInput }, token);
      setWorkspace(updated);
      showMsg('success', 'Nama team berhasil disimpan!');
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menyimpan nama team.');
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!workspace) return;
    if (!confirm(`Hapus team "${workspace.name}"? SELURUH project di dalamnya akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`)) return;

    const token = getAuthToken();
    if (!token) return;

    setDeletingTeam(true);
    try {
      await workspaceApi.deleteWorkspace(workspace.id, token);
      router.push('/project-setup');
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menghapus team.');
      setDeletingTeam(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    const token = getAuthToken();
    if (!token) return;

    setInviting(true);
    try {
      await workspaceApi.addWorkspaceMember(workspace.id, inviteEmail, inviteRole, token);
      const memberList = await workspaceApi.getWorkspaceMembers(workspace.id, token);
      setMembers(memberList);
      setShowInviteModal(false);
      setInviteEmail('');
      showMsg('success', `Berhasil mengundang ${inviteEmail}!`);
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal mengundang anggota.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMemberResponse) => {
    if (!workspace) return;
    if (!confirm(`Keluarkan ${member.username} dari team?`)) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      await workspaceApi.removeWorkspaceMember(workspace.id, member.user_id, token);
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      showMsg('success', `${member.username} berhasil dikeluarkan.`);
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menghapus anggota.');
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !newRuleName.trim() || !newRuleContent.trim()) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const newRule = await workspaceApi.createWorkspaceAIRule(workspace.id, { name: newRuleName, content: newRuleContent }, token);
      setAiRules([...aiRules, newRule]);
      setNewRuleName('');
      setNewRuleContent('');
      setShowRuleModal(false);
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menambahkan aturan AI.');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Hapus aturan AI ini?')) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      await workspaceApi.deleteWorkspaceAIRule(ruleId, token);
      setAiRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menghapus aturan AI.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  if (loadError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-600 text-sm">{loadError}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <button onClick={() => router.push('/workspace')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <LogoUserdoc />
      </header>

      <main className="max-w-2xl mx-auto pt-10 px-6 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Team Settings</h1>

        {message.text && (
          <div className={`mb-4 p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="border-b border-gray-100 px-6 flex gap-6">
            <button onClick={() => setActiveTab('general')} className={`py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <SettingsIcon className="w-4 h-4" /> General
            </button>
            <button onClick={() => setActiveTab('members')} className={`py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Users className="w-4 h-4" /> Team Members <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">{members.length}</span>
            </button>
            <button onClick={() => setActiveTab('ai-rules')} className={`py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'ai-rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Brain className="w-4 h-4" /> AI Rules
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={handleSaveName} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Team Name</label>
                  <input
                    type="text"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
                    disabled={deletingTeam}
                    className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer disabled:opacity-50"
                  >
                    {deletingTeam ? 'Menghapus...' : 'Delete Team'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingName}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {savingName ? 'Menyimpan...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5" /> Invite Member
                  </button>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {members.map((m) => {
                    const cfg = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer;
                    const Icon = cfg.icon;
                    return (
                      <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {m.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{m.username}</p>
                          <p className="text-[11px] text-gray-500 truncate">{m.email}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                        {m.role !== 'owner' && (
                          <button onClick={() => handleRemoveMember(m)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'ai-rules' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 -mt-2">
                  Aturan di sini berlaku untuk SEMUA project dalam team ini (di luar aturan spesifik per project).
                </p>
                <div className="flex justify-end">
                  <button onClick={() => setShowRuleModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>
                {aiRules.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Brain className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No AI rules yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiRules.map((rule) => (
                      <div key={rule.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{rule.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{rule.content}</p>
                        </div>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Invite Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <input 
                  type="email" 
                  required 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:border-blue-500" 
                />
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value as any)} 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-500"
>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={inviting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer">
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Add Team AI Rule</h3>
              <button onClick={() => setShowRuleModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddRule} className="p-5 space-y-4">
            <input 
              type="text" 
              required 
              value={newRuleName} 
              onChange={(e) => setNewRuleName(e.target.value)} 
              placeholder="Nama aturan (misal: Bahasa Baku, Tech Stack Standar)"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
            />
            <textarea 
              required 
              rows={4} 
              value={newRuleContent} 
              onChange={(e) => setNewRuleContent(e.target.value)} 
              placeholder="Tuliskan aturan AI di sini..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRuleModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}