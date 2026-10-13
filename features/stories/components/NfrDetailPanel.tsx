// features/stories/components/NfrDetailPanel.tsx
'use client';

import { useState } from 'react';
import { Layers, Trash2, Loader2 } from 'lucide-react';
import { NFR } from '../types';
import { getAuthToken } from '@/lib/auth';

interface NfrDetailPanelProps {
  nfr: NFR;
  onDeleted: (nfrId: string | number) => void;
}

export default function NfrDetailPanel({ nfr, onDeleted }: NfrDetailPanelProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Hapus non-functional requirement ini?')) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/nfrs/${nfr.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || 'Gagal menghapus NFR.');
      }

      onDeleted(nfr.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
      <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-blue-600" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
              {nfr.category}
            </p>
            <h1 className="text-lg font-bold text-gray-800">Non-functional Requirement</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="px-8 py-6 space-y-4 max-w-2xl">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {nfr.description}
          </p>
        </div>
      </div>
    </div>
  );
}