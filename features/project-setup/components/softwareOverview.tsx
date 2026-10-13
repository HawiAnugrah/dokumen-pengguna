'use client';

import { useState, useRef } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, ArrowLeft, AlertCircle, Paperclip, Sparkles, Loader2, FileCode, X } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

export default function SoftwareOverview() {
  const { softwareName, softwareOverview, setSoftwareOverview, nextStep, prevStep } = useWizardStore() as any;
  const [localDesc, setLocalDesc] = useState(softwareOverview || '');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
      if (!localDesc.trim()) {
        setLocalDesc(`Source Code Archive: ${file.name}\nSistem arsitektur dan modul yang diekstrak dari repositori kode.`);
      }
    }
  };

  const handleAiSuggest = async () => {
    setIsSuggesting(true);
    try {
      const promptName = softwareName?.trim() || 'Software System';
      // Contoh draft deskripsi arsitektur pintar
      const sampleSuggestions = [
        `Sistem arsitektur monolitik/modular ${promptName} yang mencakup modul autentikasi JWT, API routing, manajemen database relasional (PostgreSQL), dan integrasi background workers.`,
        `Aplikasi ${promptName} berbasis REST API dan microservices dengan pembagian layer Controller, Service, Repository, dan terintegrasi sistem autentikasi aman.`,
      ];
      const chosen = sampleSuggestions[Math.floor(Math.random() * sampleSuggestions.length)];
      setLocalDesc(chosen);
      if (error) setError(false);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleNext = () => {
    if (!localDesc.trim()) {
      setError(true);
      return;
    }
    setError(false);
    const finalContent = attachedFile ? `${localDesc}\n\n[Attached File: ${attachedFile}]` : localDesc;
    setSoftwareOverview(finalContent.trim());
    nextStep();
  };

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        High level overview of your software
      </h1>

      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        Jelaskan arsitektur kode atau unggah berkas source code (.zip, .json, repo) untuk dianalisis.
      </p>

      {/* Input File Tersembunyi */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".zip,.rar,.json,.ts,.js,.py,.sql,.txt,.pdf"
        className="hidden"
      />

      <div className="relative w-full mb-2">
        <textarea
          rows={6}
          value={localDesc}
          onChange={(e) => {
            setLocalDesc(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Tuliskan gambaran arsitektur kode atau klik tombol Attach untuk unggah file kode/JSON..."
          className={`w-full bg-white/10 border rounded-xl px-4 py-3.5 pb-12 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 transition-all shadow-inner resize-y ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-blue-100/40 focus:ring-white/50'
          }`}
        />

        {/* Toolbar Pojok Bawah Textarea */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
              title="Unggah berkas .zip, .json, atau kode"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach File (.zip, .json)</span>
            </button>

            {attachedFile && (
              <span className="bg-blue-500/40 border border-blue-300/50 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{attachedFile}</span>
                <button type="button" onClick={() => setAttachedFile(null)} className="hover:text-red-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={isSuggesting}
            className="px-3 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 border border-blue-300/40 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSuggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
            <span>AI Suggest</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-300 text-xs mb-4 animate-shake flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Deskripsi software wajib diisi sebelum melanjutkan.
        </p>
      )}

      <div className="w-full flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={prevStep}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}