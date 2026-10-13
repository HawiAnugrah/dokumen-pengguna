// features/users/components/userDetailPanel.tsx
'use client';

import { useState } from 'react';
import { UserType } from '../types';
import { Edit3, Trash2, MapPin, Briefcase, Heart, Calendar, Info, Flag, AlertCircle } from 'lucide-react';

interface UserDetailPanelProps {
  userType: UserType;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export default function UserDetailPanel({ userType, onEdit, onDelete }: UserDetailPanelProps) {
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);

  const personas = userType.personas || [];
  const currentPersona = personas[activePersonaIndex];

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto h-full flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col flex-1">
        {/* Header Info User Type & Action Buttons */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{userType.name}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{userType.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(userType.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Bagian Personas dengan Tab Navigasi & Layout 2 Kolom */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personas</h3>

          {personas.length > 0 ? (
            <div>
              {/* Tab Navigasi Persona */}
              <div className="flex justify-center border-b border-gray-200 mb-6">
                {personas.map((persona, index) => {
                  const isActive = activePersonaIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => setActivePersonaIndex(index)}
                      className={`pb-3 px-4 text-xs font-bold transition-colors relative cursor-pointer ${
                        isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {persona.name || `Persona ${index + 1}`}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>

            {/* Konten Persona Aktif (Layout 2 Kolom) */}
            {currentPersona && (
              <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Kolom Kiri: Foto, Nama, & Biodata */}
                <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-gray-100 lg:pr-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-blue-100 shadow-sm flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-2xl">
                      {currentPersona.avatarUrl ? (
                        <img src={currentPersona.avatarUrl} alt={currentPersona.name} className="w-full h-full object-cover" />
                      ) : currentPersona.name ? (
                        currentPersona.name.charAt(0)
                      ) : (
                        'U'
                      )}
                    </div>
                    <h4 className="text-base font-bold text-gray-900">{currentPersona.name}</h4>
                  </div>

                    <div className="space-y-3 text-xs pt-2">
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Age</span>
                        <span className="font-semibold text-gray-800">{currentPersona.age || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span>
                        <span className="font-semibold text-gray-800 text-right">{currentPersona.location || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Family status</span>
                        <span className="font-semibold text-gray-800 text-right">{currentPersona.familyStatus || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Work / Job Title</span>
                        <span className="font-semibold text-gray-800 text-right">{currentPersona.workTitle || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: About, Goals, Frustrations dengan Framework Icon */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* About */}
                    {currentPersona.about && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                          <Info className="w-4 h-4 text-blue-600" /> About
                        </h5>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line pl-6 border-l-2 border-gray-100">
                          {currentPersona.about}
                        </p>
                      </div>
                    )}

                    {/* Goals */}
                    {currentPersona.goals && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                          <Flag className="w-4 h-4 text-blue-600" /> Goals
                        </h5>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line pl-6 border-l-2 border-gray-100">
                          {currentPersona.goals}
                        </p>
                      </div>
                    )}

                    {/* Frustrations */}
                    {currentPersona.frustrations && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4 text-blue-600" /> Frustrations
                        </h5>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line pl-6 border-l-2 border-gray-100">
                          {currentPersona.frustrations}
                        </p>
                      </div>
                    )}

                    {!currentPersona.about && !currentPersona.goals && !currentPersona.frustrations && (
                      <p className="text-xs text-gray-400 italic">No additional details provided for this persona.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center">No personas defined for this user type yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}