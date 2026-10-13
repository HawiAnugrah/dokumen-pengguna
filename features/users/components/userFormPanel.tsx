// features/users/components/userFormPanel.tsx
'use client';

import { useState } from 'react';
import { UserType, Persona } from '../types';
import { Plus, Trash2, Sparkles, User as UserIcon, Loader2, Camera } from 'lucide-react';
import AvatarPickerModal from './avatarPickerModal';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';

interface UserFormPanelProps {
  initialData?: UserType | null;
  onSubmit: (data: UserType) => void;
  onCancel: () => void;
  projectId?: string | null; // Ditambahkan agar bisa pakai AI berdasarkan project
}

export default function UserFormPanel({ initialData, onSubmit, onCancel, projectId }: UserFormPanelProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [personas, setPersonas] = useState<Persona[]>(initialData?.personas || []);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeAvatarIndex, setActiveAvatarIndex] = useState<number | null>(null);
  const [initialPersonaIds] = useState<number[]>(
    (initialData?.personas || []).map((p) => p.id).filter((id): id is number => !!id)
  );

  const handleAddPersona = () => {
    const newPersona: Persona = {
      name: 'New Persona',
      workTitle: '',
      age: '',
      location: '',
      familyStatus: '',
      about: '',
      goals: '',
      frustrations: '',
    };
    setPersonas([...personas, newPersona]);
  };

  const handleRemovePersona = (index: number) => {
    setPersonas(personas.filter((_, i) => i !== index));
  };

  const handlePersonaChange = (index: number, field: keyof Persona, value: string) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    setPersonas(updated);
  };

  // FUNGSI AI: Generate/Suggest Persona goals & frustrations via AI backend
  const handleAIGeneratePersona = async (index: number) => {
    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }
    if (!name.trim()) {
      alert('Mohon isi nama User Type terlebih dahulu.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const personaName = personas[index].name || 'User';
      const response = await projectApi.suggestUserGoals(
        {
          project_name: name,
          user_type_name: personaName,
          user_type_description: description,
        },
        token
      );

      // Masukkan hasil suggest AI ke persona terkait
      const updated = [...personas];
      updated[index] = {
        ...updated[index],
        goals: response.goals || updated[index].goals,
        frustrations: response.frustrations || updated[index].frustrations,
      };
      setPersonas(updated);
    } catch (err: any) {
      console.error('Gagal generate AI persona:', err);
      alert(err.message || 'AI gagal menghasilkan saran.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const remainingIds = personas.map((p) => p.id).filter((id): id is number => !!id);
    const deletedPersonaIds = initialPersonaIds.filter((id) => !remainingIds.includes(id));

    const savedUserType: UserType = {
      id: initialData?.id || '',
      name,
      description,
      storiesCount: initialData?.storiesCount || 0,
      personasCount: personas.length,
      personas,
      deletedPersonaIds,
    };

    onSubmit(savedUserType);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      {/* Top Bar Form */}
      <div className="h-16 border-b border-gray-200 px-8 flex items-center justify-between shrink-0 bg-white">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="User Type Name"
          className="text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-1/2 transition-colors"
          required
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      {/* Content Form */}
      <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-gray-50/30">
        {/* Description Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description of this User type"
            rows={3}
            className="w-full border border-gray-200 rounded-lg p-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Personas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personas</h3>
            <button
              type="button"
              onClick={handleAddPersona}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Persona
            </button>
          </div>

          {personas.map((persona, index) => (
            <div key={persona.id ?? `new-${index}`} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Foto Avatar dengan Tombol Kamera untuk Ganti Foto */}
                  <div className="relative group shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 bg-blue-50 flex items-center justify-center shadow-xs">
                      {persona.avatarUrl ? (
                        <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAvatarIndex(index)}
                      className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Ganti Foto Persona"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) => handlePersonaChange(index, 'name', e.target.value)}
                    placeholder="Persona Name"
                    className="text-sm font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                  />
                </div>
                
                {/* Tombol AI Generate di tiap card Persona */}
                <button
                  type="button"
                  onClick={() => handleAIGeneratePersona(index)}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate goals & frustrations with AI"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>AI Suggest Goals</span>
                </button>
              </div>

              {/* Grid Atribut Persona */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Age</label>
                  <input
                    type="text"
                    value={persona.age || ''}
                    onChange={(e) => handlePersonaChange(index, 'age', e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={persona.location || ''}
                    onChange={(e) => handlePersonaChange(index, 'location', e.target.value)}
                    placeholder="e.g., Jakarta"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Family Status</label>
                  <input
                    type="text"
                    value={persona.familyStatus || ''}
                    onChange={(e) => handlePersonaChange(index, 'familyStatus', e.target.value)}
                    placeholder="e.g., Single"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Work / Job Title</label>
                  <input
                    type="text"
                    value={persona.workTitle || ''}
                    onChange={(e) => handlePersonaChange(index, 'workTitle', e.target.value)}
                    placeholder="e.g., Developer"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* About */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">About</label>
                <textarea
                  value={persona.about || ''}
                  onChange={(e) => handlePersonaChange(index, 'about', e.target.value)}
                  placeholder="Describe about this persona..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Goals */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">Goals</label>
                <textarea
                  value={persona.goals || ''}
                  onChange={(e) => handlePersonaChange(index, 'goals', e.target.value)}
                  placeholder="List persona goals..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Frustrations */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">Frustrations</label>
                <textarea
                  value={persona.frustrations || ''}
                  onChange={(e) => handlePersonaChange(index, 'frustrations', e.target.value)}
                  placeholder="List persona frustrations..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tombol Delete Persona */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleRemovePersona(index)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Persona
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
            {activeAvatarIndex !== null && (
        <AvatarPickerModal
          currentAvatarUrl={personas[activeAvatarIndex]?.avatarUrl}
          onSelect={(url) => {
            handlePersonaChange(activeAvatarIndex, 'avatarUrl' as any, url);
            setActiveAvatarIndex(null);
          }}
          onClose={() => setActiveAvatarIndex(null)}
        />
      )}
    </form>
  );
}