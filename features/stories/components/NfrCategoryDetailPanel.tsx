// features/stories/components/NfrCategoryDetailPanel.tsx
'use client';

import { useState } from 'react';
import { Layers, Trash2, Loader2, Pencil, Check, X, Plus, Sparkles } from 'lucide-react';
import { NFR } from '../types';
import { getAuthToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface NfrCategoryDetailPanelProps {
  category: string;
  items: NFR[];
  projectId?: string | null;
  projectName?: string;
  onUpdated: (updatedNfr: NFR) => void;
  onDeleted: (nfrId: string | number) => void;
  onCreated: (newNfr: NFR) => void;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  const msg = Array.isArray(body?.detail)
    ? body.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('; ')
    : body?.detail;
  return msg || fallback;
}

function NfrTableRow({
  nfr,
  projectName,
  onUpdated,
  onDeleted,
}: {
  nfr: NFR;
  projectName?: string;
  onUpdated: (n: NFR) => void;
  onDeleted: (id: string | number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(nfr.description);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) return alert('Sesi habis, silakan login kembali.');

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nfrs/${nfr.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error(await parseError(res, 'Gagal menyimpan perubahan.'));
      const updated = await res.json();
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefine = async () => {
    const token = getAuthToken();
    if (!token) return alert('Sesi habis, silakan login kembali.');

    setRefining(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nfrs/ai-suggest-refine`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          project_name: projectName || '',
          category: nfr.category,
          description,
        }),
      });
      if (!res.ok) throw new Error(await parseError(res, 'Gagal generate saran AI.'));
      const suggestion = await res.json();
      setDescription(suggestion.description);
      setEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setRefining(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Hapus non-functional requirement ini?')) return;
    const token = getAuthToken();
    if (!token) return alert('Sesi habis, silakan login kembali.');

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nfrs/${nfr.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await parseError(res, 'Gagal menghapus NFR.'));
      onDeleted(nfr.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      setDeleting(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors align-top">
      <td className="py-3 px-4 text-gray-700">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{nfr.description}</p>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
                {error}
              </p>
            )}
          </>
        )}
      </td>
      <td className="py-3 px-4 w-40">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDescription(nfr.description);
                setError(null);
              }}
              disabled={saving}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefine}
              disabled={refining}
              className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
              title="Refine with AI"
            >
              {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function NfrCategoryDetailPanel({
  category,
  items,
  projectId,
  projectName,
  onUpdated,
  onDeleted,
  onCreated,
}: NfrCategoryDetailPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    const token = getAuthToken();
    if (!token) return alert('Sesi habis, silakan login kembali.');

    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nfrs/ai-suggest-draft`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          project_name: projectName || '',
          existing_categories: [category],
        }),
      });
      if (!res.ok) throw new Error(await parseError(res, 'Gagal generate saran AI.'));
      const suggestion = await res.json();
      setNewDescription(suggestion.description);
      setAdding(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = newDescription.trim();
    if (!trimmed) {
      setError('Description wajib diisi.');
      return;
    }
    if (!projectId) {
      setError('Project tidak ditemukan.');
      return;
    }

    const token = getAuthToken();
    if (!token) return alert('Sesi habis, silakan login kembali.');

    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nfrs`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          category,
          description: trimmed,
          project_id: Number(projectId),
        }),
      });
      if (!res.ok) throw new Error(await parseError(res, 'Gagal membuat NFR.'));
      const created = await res.json();
      onCreated(created);
      setNewDescription('');
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{category}</h1>
          <p className="text-xs text-gray-400">
            {items.length} non-functional requirement{items.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded font-mono font-medium border border-gray-200">
            NFR
          </span>
          <button
            onClick={handleGenerateDraft}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 hover:bg-purple-50 text-purple-600 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate with AI
          </button>
        </div>
      </div>

      {error && !adding && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div>
        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4 border-b border-blue-50 pb-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4" /> REQUIREMENTS
        </h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 px-4 text-center text-gray-400 text-xs">
                    Belum ada NFR di category ini.
                  </td>
                </tr>
              ) : (
                items.map((nfr) => (
                  <NfrTableRow
                    key={nfr.id}
                    nfr={nfr}
                    projectName={projectName}
                    onUpdated={onUpdated}
                    onDeleted={onDeleted}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          {adding ? (
            <div className="border border-blue-200 rounded-lg p-4 space-y-2 bg-blue-50/30">
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder='e.g. "API response time must be under 200ms for 95% of requests"'
                rows={3}
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none bg-white"
              />
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setNewDescription('');
                    setError(null);
                  }}
                  disabled={creating}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 border border-dashed border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add NFR to "{category}"
            </button>
          )}
        </div>
      </div>
    </div>
  );
}