// features/project-setup/components/NonFunctionalList.tsx
'use client';

import { useState, useEffect } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore, NonFunctionalItem } from '../store/wizard-store';
import { projectApi } from '@/services/projectsApi';
import { Sparkles, ArrowRight, ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const getAuthToken = (): string =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('token') || localStorage.getItem('access_token'))) || '';

export default function NonFunctionalList() {
  const {
    projectName,
    projectDescription,
    platformType,
    nonFunctionals,
    addNonFunctional,
    removeNonFunctional,
    updateNonFunctional,
    nextStep,
    prevStep,
  } = useWizardStore() as any;

  const [mounted, setMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isDrafting, setIsDrafting] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const titleName = projectName?.trim() ? projectName : 'your project';

  const handleAdd = () => {
    if (!newCategory.trim()) return;

    const newItem: NonFunctionalItem = {
      id: Date.now().toString(),
      category: newCategory.trim(),
      description: newDesc.trim() || 'No description provided.',
    };

    addNonFunctional(newItem);
    setNewCategory('');
    setNewDesc('');
    setIsAdding(false);
  };

  // ---- AI DRAFT: dipanggil saat user klik "AI Draft" di form Add ----
  const handleAiDraft = async () => {
    const token = getAuthToken();
    if (!token) {
      setAiError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }

    setAiError('');
    setIsDrafting(true);
    try {
      const result = await projectApi.suggestNFRDraft(
        {
          project_name: titleName,
          project_description: projectDescription || '',
          application_type: platformType || '',
          existing_categories: nonFunctionals.map((n: NonFunctionalItem) => n.category),
        },
        token
      );
      setNewCategory(result.category);
      setNewDesc(result.description);
    } catch (err: any) {
      setAiError(err?.message || 'AI gagal membuat draf NFR.');
    } finally {
      setIsDrafting(false);
    }
  };

  const startEditing = (item: NonFunctionalItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditDesc(item.description);
    setAiError('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (typeof updateNonFunctional === 'function') {
      updateNonFunctional(editingId, {
        category: editCategory.trim() || 'Untitled',
        description: editDesc.trim(),
      });
    }
    setEditingId(null);
  };

  // ---- AI SUGGEST: dipanggil saat user klik "AI Suggest" di mode edit ----
  const handleAiRefine = async (itemId: string) => {
    const token = getAuthToken();
    if (!token) {
      setAiError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }
    if (!editCategory.trim()) {
      setAiError('Isi kategori terlebih dahulu sebelum minta saran AI.');
      return;
    }

    setAiError('');
    setRefiningId(itemId);
    try {
      const result = await projectApi.suggestNFRRefine(
        {
          project_name: titleName,
          category: editCategory.trim(),
          description: editDesc,
        },
        token
      );
      setEditCategory(result.category);
      setEditDesc(result.description);
    } catch (err: any) {
      setAiError(err?.message || 'AI gagal menyempurnakan NFR.');
    } finally {
      setRefiningId(null);
    }
  };

  return (
    <div className="flex flex-col items-start w-full max-w-5xl mx-auto pt-10 px-4 pb-12">
      <div className="w-full flex flex-col items-center mb-8 header-fade">
        <LogoUserdoc />
      </div>

      <div className="header-fade w-full" style={{ animationDelay: '80ms' }}>
        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3 text-xs text-blue-200 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          {nonFunctionals.length} kebutuhan terdaftar
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Non-Functional Requirements for {titleName}
        </h1>

        <p className="text-blue-200 text-sm mb-6 leading-relaxed max-w-3xl">
          Non-functional requirements mendefinisikan batasan dan atribut kualitas sistemmu — bagaimana sistem
          seharusnya bekerja, bukan sekadar fitur apa yang dimiliki. Silakan tambah, edit, atau hapus sesuai kebutuhan.
        </p>

        {aiError && (
          <div className="mb-4 text-xs text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2 max-w-3xl">
            {aiError}
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {nonFunctionals.map((item: NonFunctionalItem, index: number) => (
          <div
            key={item.id}
            className={`group relative bg-white/10 border border-blue-300/30 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 hover:border-blue-300/50 hover:-translate-y-0.5 transition-all duration-300 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {editingId !== item.id && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  className="text-blue-200 hover:text-white p-1 cursor-pointer"
                  title="Edit requirement"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeNonFunctional(item.id)}
                  className="text-blue-200 hover:text-red-300 p-1 cursor-pointer"
                  title="Remove requirement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {editingId === item.id ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-2.5 py-1.5 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-2.5 py-1.5 text-blue-100 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <div className="flex items-center gap-2 justify-between">
                  <button
                    type="button"
                    onClick={() => handleAiRefine(item.id)}
                    disabled={refiningId === item.id}
                    className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded-lg border border-blue-300/30 hover:border-blue-300/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refiningId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    )}
                    AI Suggest
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-blue-200 hover:text-white text-xs px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="bg-white text-blue-700 text-xs px-3 py-1 rounded-lg font-medium hover:bg-blue-50 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-1.5 mb-1.5 pr-10">
                  <span className="text-[10px] font-mono text-blue-300/70 mt-0.5 shrink-0">
                    NFR-{index + 1}
                  </span>
                  <h3 className="text-white text-sm font-semibold">{item.category}</h3>
                </div>
                <p className="text-blue-200 text-xs leading-relaxed line-clamp-4">{item.description}</p>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="w-full bg-white/10 border border-blue-300/40 rounded-xl p-4 backdrop-blur-sm sm:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-200 font-medium">New requirement</span>
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={isDrafting}
                className="text-blue-100 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-blue-300/30 hover:border-blue-300/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDrafting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                )}
                AI Draft
              </button>
            </div>

            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category / Attribute (cth: Scalability, Security)..."
              autoFocus
              className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-white text-sm font-semibold placeholder-blue-300/60 mb-2 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe the performance or constraint..."
              rows={3}
              className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-blue-100 text-xs placeholder-blue-300/60 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewCategory('');
                  setNewDesc('');
                  setAiError('');
                }}
                className="text-blue-200 hover:text-white text-xs px-3 py-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newCategory.trim()}
                className="bg-white text-blue-700 text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {nonFunctionals.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-10 text-blue-200 text-sm">
            Belum ada non-functional requirement. Klik &quot;Add requirement&quot; untuk menambahkan secara manual.
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setAiError('');
              }}
              className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" /> Add requirement
            </button>
          )}

          <button
            type="button"
            onClick={nextStep}
            className="bg-white hover:bg-blue-50 text-blue-700 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm"
          >
            <span>Next</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}