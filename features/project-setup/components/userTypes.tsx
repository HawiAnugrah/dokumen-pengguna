// features/project-setup/components/UserTypes.tsx
'use client';

import { useState } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore, UserTypeItem } from '../store/wizard-store';
import { Plus, Trash2, Pencil, Sparkles, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';

// Dipindah ke luar komponen supaya tidak dibuat ulang (dan di-remount) setiap render.
function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-red-300 text-xs flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 px-3.5 py-2.5 rounded-xl">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      {message}
    </p>
  );
}

export default function UserTypes() {
  const {
    projectName,
    projectDescription,
    platformType,
    userTypes,
    addUserType,
    removeUserType,
    updateUserType,
    nextStep,
    prevStep,
  } = useWizardStore() as any;

  const [isAdding, setIsAdding] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [error, setError] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<{ id: string; message: string } | null>(null);

  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');

  const titleName = projectName?.trim() ? projectName : 'your project';

  const handleAddUserType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    addUserType({
      id: `ut-${Date.now()}`,
      name: newTypeName.trim(),
      description: newTypeDesc.trim(),
    });

    setNewTypeName('');
    setNewTypeDesc('');
    setIsAdding(false);
    if (error) setError(false);
  };

  // ---- AI DRAFT: dipanggil saat user klik "AI Draft" di form Add ----
  const handleAiDraft = async () => {
    const token = getAuthToken();
    if (!token) {
      setDraftError('Sesi habis, silakan login kembali.');
      return;
    }

    setDraftError('');
    setIsDrafting(true);
    try {
      const result = await projectApi.suggestUserTypeDraft(
        {
          project_name: titleName,
          project_description: projectDescription || '',
          application_type: platformType || '',
          existing_user_types: (userTypes || []).map((u: UserTypeItem) => u.name),
        },
        token
      );
      setNewTypeName(result.name);
      setNewTypeDesc(result.description);
    } catch (err: any) {
      setDraftError(err?.message || 'AI gagal membuat draf tipe pengguna.');
    } finally {
      setIsDrafting(false);
    }
  };

  // Dipakai HANYA di mode edit — AI Suggest untuk menyempurnakan deskripsi.
  const requestAiDescription = async (id: string, typeName: string): Promise<string | null> => {
    setAiError(null);
    const token = getAuthToken();
    if (!token) {
      setAiError({ id, message: 'Sesi habis, silakan login kembali.' });
      return null;
    }

    setGeneratingId(id);
    try {
      const result = await projectApi.suggestUserTypeDescription(
        {
          project_name: titleName,
          user_type_name: typeName,
          project_description: projectDescription || '',
        },
        token
      );
      const text = result.description?.trim();
      if (!text) throw new Error('AI mengembalikan deskripsi kosong.');
      return text;
    } catch (err: any) {
      console.error('Gagal generate deskripsi user type dengan AI:', err);
      setAiError({ id, message: err.message || 'AI gagal memberikan saran deskripsi. Silakan coba lagi.' });
      return null;
    } finally {
      setGeneratingId(null);
    }
  };

  const handleAiGenerateInEdit = async (id: string) => {
    const text = await requestAiDescription(id, editName.trim() || 'Pengguna');
    if (text) setEditDesc(text);
  };

  const startEditing = (user: UserTypeItem) => {
    setAiError(null);
    setEditingId(user.id);
    setEditName(user.name);
    setEditDesc(user.description || '');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateUserType(editingId, { name: editName.trim(), description: editDesc.trim() });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAiError(null);
  };

  const handleNext = () => {
    if (!userTypes || userTypes.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    nextStep();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto pt-6 text-center pb-12">
      <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
        User types of <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white">{titleName}</span>
      </h1>

      <p className="text-blue-100/80 text-xs sm:text-sm mb-8 max-w-lg leading-relaxed">
        Software is nothing without users. What are the different types of users who will interact with {titleName}?
      </p>

      <div
        className={`bg-white/10 border rounded-3xl w-full mb-4 backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/10 text-left transition-all ${
          error ? 'border-red-400 ring-4 ring-red-400/20 bg-red-950/10' : 'border-blue-400/30'
        }`}
      >
        {!userTypes || userTypes.length === 0 ? (
          <div className="p-10 text-center text-blue-200/70 text-sm">
            Belum ada tipe pengguna yang ditambahkan. Klik &quot;Add user type&quot; di bawah untuk mulai.
          </div>
        ) : (
          userTypes.map((user: UserTypeItem) => (
            <div key={user.id} className="p-5 sm:p-6 hover:bg-white/5 transition-colors">
              {editingId === user.id ? (
                <div className="w-full flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/10 border border-blue-300/40 rounded-xl px-3 py-1.5 text-white text-sm font-semibold focus:outline-none"
                    autoFocus
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    placeholder="Deskripsi tipe pengguna..."
                    disabled={generatingId === user.id}
                    className="w-full bg-white/10 border border-blue-300/40 rounded-xl px-3 py-1.5 text-blue-100 text-xs resize-none focus:outline-none disabled:opacity-60"
                  />

                  {aiError?.id === user.id && <ErrorBox message={aiError.message} />}

                  <div className="flex items-center gap-2 justify-between">
                    <button
                      type="button"
                      onClick={() => handleAiGenerateInEdit(user.id)}
                      disabled={generatingId === user.id}
                      className="flex items-center gap-1.5 text-yellow-300 hover:text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {generatingId === user.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      AI Suggest
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-blue-200 hover:text-white text-xs px-2 py-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!editName.trim() || generatingId === user.id}
                        className="bg-white text-blue-700 text-xs px-3 py-1 rounded-lg font-medium hover:bg-blue-50 cursor-pointer disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col max-w-[75%]">
                    <span className="text-white font-bold text-sm sm:text-base mb-1.5">{user.name}</span>
                    {user.description ? (
                      <p className="text-blue-200/90 text-xs sm:text-sm leading-relaxed">{user.description}</p>
                    ) : (
                      <p className="text-blue-300/50 text-xs sm:text-sm italic">
                        Belum ada deskripsi. Klik ikon edit lalu &quot;AI Suggest&quot; untuk generate dengan AI.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => startEditing(user)}
                      title="Edit user type"
                      className="p-2 text-blue-200 hover:text-white transition-colors rounded-xl hover:bg-white/10 border border-white/10 cursor-pointer shadow-sm bg-white/5"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUserType(user.id)}
                      title="Delete user type"
                      className="p-2 text-red-300 hover:text-white transition-colors rounded-xl hover:bg-red-500/20 border border-red-500/20 cursor-pointer shadow-sm bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddUserType}
          className="bg-white/10 border border-blue-300/40 rounded-2xl p-4 w-full mb-4 backdrop-blur-md shadow-xl text-left flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Add New User Type</span>
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={isDrafting}
              className="flex items-center gap-1.5 text-yellow-300 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDrafting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI Draft
            </button>
          </div>

          {draftError && <ErrorBox message={draftError} />}

          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="User type name (e.g. Administrator, Customer)..."
            autoFocus
            className="w-full bg-white/10 border border-blue-300/40 rounded-xl px-3 py-2 text-white text-sm font-semibold placeholder-blue-300/60 focus:outline-none"
          />
          <textarea
            value={newTypeDesc}
            onChange={(e) => setNewTypeDesc(e.target.value)}
            placeholder="Describe what this user does (optional, bisa di-generate AI setelah ditambahkan)..."
            rows={2}
            className="w-full bg-white/10 border border-blue-300/40 rounded-xl px-3 py-2 text-blue-100 text-xs placeholder-blue-300/60 resize-none focus:outline-none"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTypeName('');
                setNewTypeDesc('');
                setDraftError('');
              }}
              className="text-blue-200 hover:text-white text-xs px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTypeName.trim()}
              className="bg-white text-blue-700 text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 cursor-pointer disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="w-full text-left mb-4 animate-fadeIn">
          <ErrorBox message="⚠️ Tambahkan minimal 1 user type sebelum melanjutkan ke tahap berikutnya." />
        </div>
      )}

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
              onClick={() => setIsAdding(true)}
              className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" /> Add user type
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="bg-white hover:bg-blue-50 text-blue-700 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm"
          >
            <span>Next</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}