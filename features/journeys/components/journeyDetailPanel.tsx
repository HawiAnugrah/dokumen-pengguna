'use client';

import { useState, useEffect } from 'react';
import { 
  Edit3, 
  ArrowDown, 
  Sparkles, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  User, 
  Loader2, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface Step {
  id: number | string;
  title: string;
  description: string;
  personaId: number | null;
  personaName: string | null;
}

interface Persona {
  id: number;
  name: string;
  avatar_url?: string | null;
}

export interface JourneyDetailPanelProps {
  journey?: {
    id: string;
    title: string;
    description: string;
    steps?: Step[];
  } | null;
  personas?: Persona[];
  isEditingInitially?: boolean;
  isNew?: boolean;
  startWithEmptySteps?: boolean;
  onClose: () => void;
  onSave: (updatedJourney: any) => Promise<void> | void;
  onDeleteJourney?: (journeyId: string) => Promise<void> | void;
  onGenerateAiSteps?: (journeyId: string) => Promise<void> | void;
}

const DEFAULT_STEP: Step = {
  id: 1,
  title: 'Step name',
  description: 'Description of this Step',
  personaId: null,
  personaName: null,
};

export default function JourneyDetailPanel({
  journey,
  personas = [],
  isEditingInitially = false,
  isNew = false,
  startWithEmptySteps = false,
  onClose,
  onSave,
  onDeleteJourney,
  onGenerateAiSteps,
}: JourneyDetailPanelProps) {
  const safeJourney = journey || {
    id: '',
    title: '',
    description: '',
    steps: [],
  };

  const resolveInitialSteps = (): Step[] => {
    if (safeJourney.steps && safeJourney.steps.length > 0) return safeJourney.steps;
    return startWithEmptySteps ? [] : [DEFAULT_STEP];
  };

  const [isEditing, setIsEditing] = useState(isEditingInitially);
  const [title, setTitle] = useState(safeJourney.title || '');
  const [description, setDescription] = useState(safeJourney.description || '');
  const [steps, setSteps] = useState<Step[]>(resolveInitialSteps());
  
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | string | null>(null);
  const [validationError, setValidationError] = useState('');

  const resetFromJourney = () => {
    setTitle(safeJourney.title || '');
    setDescription(safeJourney.description || '');
    setSteps(resolveInitialSteps());
  };

  useEffect(() => {
    if (isEditing) return;
    resetFromJourney();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey]);

  const handleStepChange = (id: number | string, field: 'title' | 'description', value: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleStepPersonaChange = (id: number | string, personaIdRaw: string) => {
    const personaId = personaIdRaw ? Number(personaIdRaw) : null;
    const persona = personas.find((p) => p.id === personaId);
    setSteps(
      steps.map((s) =>
        s.id === id ? { ...s, personaId, personaName: persona?.name ?? null } : s
      )
    );
  };

  const handleAddStep = () => {
    const newStep: Step = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `Step ${steps.length + 1}`,
      description: '',
      personaId: personas.length > 0 ? personas[0].id : null,
      personaName: personas.length > 0 ? personas[0].name : null,
    };
    setSteps([...steps, newStep]);
  };

  const confirmDeleteStep = (id: number | string) => {
    setSteps(steps.filter((s) => s.id !== id));
    setStepToDelete(null);
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setValidationError('Nama Journey wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      setValidationError('');
      await onSave({
        ...safeJourney,
        title: title.trim(),
        description: description.trim(),
        steps,
        stepsCount: steps.length,
      });
      setIsEditing(false);
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (isNew) {
      onClose();
    } else {
      resetFromJourney();
      setValidationError('');
      setIsEditing(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!safeJourney.id || !onGenerateAiSteps) return;
    try {
      setIsGeneratingAi(true);
      await onGenerateAiSteps(safeJourney.id);
    } catch (err: any) {
      alert(err.message || 'Gagal menghasilkan langkah dengan AI');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDeleteJourneyConfirm = async () => {
    if (!safeJourney.id || !onDeleteJourney) return;
    try {
      setIsSaving(true);
      await onDeleteJourney(safeJourney.id);
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus journey');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Modal Konfirmasi Hapus Journey */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-900">Hapus User Journey?</h3>
              <p className="text-xs text-gray-500">
                Apakah kamu yakin ingin menghapus journey <span className="font-semibold text-gray-800">"{safeJourney.title}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSaving}
                className="flex-1 px-3 py-2 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteJourneyConfirm}
                disabled={isSaving}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Step */}
      {stepToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xs w-full p-5 space-y-3">
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Hapus Langkah Ini?</h4>
              <p className="text-[11px] text-gray-500">
                Langkah ini akan dihapus dari urutan alur journey.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStepToDelete(null)}
                className="flex-1 px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteStep(stepToDelete)}
                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="px-8 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">
            {isEditing ? 'Journey Editor' : 'User Journey Flow'}
          </span>
          <h1 className="text-sm font-bold text-gray-900 truncate max-w-md">
            {isEditing ? (title || 'Untitled Journey') : safeJourney.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5" /> Batal
              </button>
              <button
                type="button"
                onClick={() => handleFormSubmit()}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan</span>
              </button>
            </>
          ) : (
            <>
              {onGenerateAiSteps && safeJourney.id && (
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Generate otomatis langkah-langkah alur dengan AI"
                >
                  {isGeneratingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-400" />
                  )}
                  <span>{isGeneratingAi ? 'Generating...' : 'AI Suggest Steps'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>

              {onDeleteJourney && safeJourney.id && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Hapus Journey"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= CONTENT BODY ================= */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title & Description Section */}
          {isEditing ? (
            <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-200">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Nama Journey <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: User Registration & Onboarding Flow"
                  autoFocus
                  className="w-full text-base font-bold text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan alur atau konteks umum user journey ini..."
                  rows={2}
                  className="w-full text-xs text-gray-700 border border-gray-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white shadow-xs resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Deskripsi
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">
                {safeJourney.description || 'Belum ada deskripsi untuk journey ini.'}
              </p>
            </div>
          )}

          {/* ================= FLOW DIAGRAM ================= */}
          <div className="flex flex-col items-center pt-2 pb-12 space-y-3">
            {/* BEGIN JOURNEY (Fixed) */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-5 py-2 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Begin Journey</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 ml-1" />
            </div>

            {/* Connector */}
            <div className="my-1 text-blue-500 flex flex-col items-center">
              <div className="w-0.5 h-4 bg-blue-200"></div>
              <ArrowDown className="w-4 h-4 -mt-1 text-blue-500" />
            </div>

            {/* STEPS LIST */}
            <div className="w-full space-y-3">
              {steps.map((step, index) => (
                <div key={step.id || index} className="flex flex-col items-center w-full">
                  {isEditing ? (
                    // EDIT STEP CARD
                    <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3 relative group hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {/* Persona Dropdown */}
                          <select
                            value={step.personaId ?? ''}
                            onChange={(e) => handleStepPersonaChange(step.id, e.target.value)}
                            className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 shrink-0 focus:outline-none focus:border-indigo-400 cursor-pointer"
                          >
                            <option value="">No Persona Assigned</option>
                            {personas.map((p) => (
                              <option key={p.id} value={p.id}>
                                👤 {p.name}
                              </option>
                            ))}
                          </select>

                          {/* Step Title Input */}
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => handleStepChange(step.id, 'title', e.target.value)}
                            placeholder="Judul langkah..."
                            className="text-xs font-bold text-gray-900 bg-transparent border-b border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:outline-none px-1 py-0.5 flex-1 min-w-0"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setStepToDelete(step.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                          title="Hapus Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <textarea
                          value={step.description}
                          onChange={(e) => handleStepChange(step.id, 'description', e.target.value)}
                          placeholder="Deskripsikan tindakan atau kebutuhan user pada langkah ini..."
                          rows={2}
                          className="w-full text-xs text-gray-600 bg-gray-50/70 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    // VIEW STEP CARD
                    <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-xs text-gray-900">
                            {step.title}
                          </h3>
                          {step.personaName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                              <User className="w-3 h-3" /> {step.personaName}
                            </span>
                          )}
                        </div>
                        {step.description ? (
                          <p className="text-xs text-gray-600 leading-relaxed pl-7">
                            {step.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic pl-7">
                            Belum ada deskripsi langkah.
                          </p>
                        )}
                      </div>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    </div>
                  )}

                  {/* Connector Arrow to next step or End */}
                  <div className="my-1.5 text-blue-500 flex flex-col items-center">
                    <div className="w-0.5 h-3 bg-blue-200"></div>
                    <ArrowDown className="w-3.5 h-3.5 -mt-1 text-blue-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* ADD STEP BUTTON (In edit mode) */}
            {isEditing && (
              <div className="w-full flex flex-col items-center space-y-3">
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 transition-all bg-gray-50/40 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-white border border-gray-200 group-hover:border-blue-400 flex items-center justify-center shadow-xs transition-all">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold">Tambah Langkah Baru (Add Step)</span>
                </button>

                <div className="my-1 text-blue-500 flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-blue-200"></div>
                  <ArrowDown className="w-3.5 h-3.5 -mt-1 text-blue-500" />
                </div>
              </div>
            )}

            {/* END JOURNEY (Fixed) */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 px-5 py-2 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
              <span>End Journey</span>
            </div>

            <span className="text-[10px] text-gray-400 pt-3">Userdoc AI Software Requirements Management</span>
          </div>
        </div>
      </div>
    </div>
  );
}