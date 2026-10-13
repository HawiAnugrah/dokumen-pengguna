// features/stories/components/CreateNfrModal.tsx
'use client';

import { useState } from 'react';
import { X, Layers, Loader2, Sparkles } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

// Sesuai schemas.NFRCreate / schemas.NFRResponse: category, description, project_id.
interface CreatedNfr {
  id: number;
  category: string;
  description: string;
  project_id: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CATEGORY_SUGGESTIONS = [
  'Performance',
  'Security',
  'Availability',
  'Usability',
  'Scalability',
  'Reliability',
  'Maintainability',
  'Compliance',
];

interface CreateNfrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (nfr: CreatedNfr) => void;
  projectId?: string | null;
  projectName?: string;
  existingCategories?: string[];
}

export default function CreateNfrModal({
  isOpen,
  onClose,
  onCreated,
  projectId,
  projectName,
  existingCategories,
}: CreateNfrModalProps) {
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setCategory('');
    setCustomCategory(false);
    setDescription('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleGenerateDraft = async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/nfrs/ai-suggest-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_name: projectName || '',
          existing_categories: existingCategories || [],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || 'Gagal generate saran AI.');
      }

      const suggestion = await res.json();
      setCategory(suggestion.category);
      setCustomCategory(!CATEGORY_SUGGESTIONS.includes(suggestion.category));
      setDescription(suggestion.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();

    if (!trimmedCategory) {
      setError('Category wajib diisi.');
      return;
    }
    if (!trimmedDescription) {
      setError('Description wajib diisi.');
      return;
    }
    if (!projectId) {
      setError('Project tidak ditemukan. Muat ulang halaman.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/nfrs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: trimmedCategory,
          description: trimmedDescription,
          project_id: Number(projectId),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = Array.isArray(body?.detail)
          ? body.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('; ')
          : body?.detail;
        throw new Error(msg || 'Gagal membuat non-functional requirement.');
      }

      const newNfr: CreatedNfr = await res.json();
      onCreated(newNfr);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </span>
            <h2 className="text-sm font-semibold text-gray-800">New Non-functional Requirement</h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-purple-600 border border-purple-200 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiLoading ? 'Generating...' : 'Generate with AI'}
          </button>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>

            {!customCategory ? (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__other__') {
                    setCustomCategory(true);
                    setCategory('');
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__other__">Other...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Custom category"
                  autoFocus
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomCategory(false);
                    setCategory('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2"
                >
                  Back to list
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g. "API response time must be under 200ms for 95% of requests"'
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tulis target yang terukur, bukan pernyataan umum.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Creating...' : 'Create NFR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}