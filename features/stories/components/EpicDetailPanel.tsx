// features/stories/components/EpicDetailPanel.tsx
'use client';

import { useState } from 'react';
import { Epic, UserStory } from '../types';
import { Copy, Check, Edit3, X, Loader2, FolderGit2, FileText } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { updateEpic } from '@/services/storiesApi';

interface EpicDetailPanelProps {
  epic: Epic;
  onSelectStory: (story: UserStory) => void;
  onUpdated?: (epic: Epic) => void;
}

export default function EpicDetailPanel({ epic, onSelectStory, onUpdated }: EpicDetailPanelProps) {
  const stories = epic.user_stories || [];

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(epic.name);
  const [editDescription, setEditDescription] = useState(epic.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(epic.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Gagal menyalin ke clipboard.');
    }
  };

  const startEditing = () => {
    setEditName(epic.name);
    setEditDescription(epic.description || '');
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError('Nama epic wajib diisi.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateEpic(
        epic.id,
        { name: trimmedName, description: editDescription.trim() },
        token
      );
      onUpdated?.({
        ...epic,
        name: updated.name,
        description: updated.description,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6 gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={255}
              autoFocus
              className="w-full text-2xl font-bold text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 mb-1 truncate">{epic.name}</h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded font-mono font-medium border border-gray-200">
            {epic.code}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
            title="Copy epic code"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-500" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-gray-500" /> Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="mb-8 bg-blue-50/40 p-4 rounded-xl border border-blue-50">
        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Description</h3>
        {isEditing ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
            placeholder="Ringkasan singkat cakupan epic ini..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none bg-white"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">
            {epic.description || 'Tidak ada deskripsi epic.'}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4 border-b border-blue-50 pb-2 flex items-center gap-1.5">
          <FolderGit2 className="w-4 h-4" /> CHILD REQUIREMENTS
        </h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4 w-24">Type</th>
                <th className="py-3 px-4">Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {stories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 px-4 text-center text-gray-400 text-xs">
                    Belum ada user story di epic ini.
                  </td>
                </tr>
              ) : (
                stories.map((story) => (
                  <tr
                    key={story.id}
                    onClick={() => onSelectStory(story)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-blue-600">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        {story.i_want}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">Story</td>
                    <td className="py-3 px-4 text-gray-600">
                      As a {story.as_a}, I want to {story.i_want}, So that {story.so_that}.
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}