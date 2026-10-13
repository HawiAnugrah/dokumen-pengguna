// features/project-setup/components/describeProject.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import {
  Box,
  Paperclip,
  Sparkles,
  ArrowRight,
  Check,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';

const GENERATION_PHASES = [
  'Menganalisis deskripsi proyek & platform...',
  'Menyusun user types & persona...',
  'Merancang epics & modul utama...',
  'Menyusun user stories & acceptance criteria...',
  'Menyiapkan non-functional requirements...',
];

export default function DescribeProject() {
  const {
    projectName,
    projectDescription,
    setProjectDescription,
    platformType,
    setPlatformType,
    nextStep,
    prevStep,
    createProjectIfNeeded,
    generateAIRequirements,
    isCreatingProject,
  } = useWizardStore() as any;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const titleName = projectName?.trim() ? projectName : 'your project';

  const platforms = [
    'Web Application',
    'Mobile Application',
    'Desktop Application',
    'CLI Tool',
    'Backend Service',
    'Integration',
    'API',
    'Microservice',
    'Data pipeline / ETL',
  ];

  const attachOptions = [
    { label: 'Upload Document (.pdf, .docx)', icon: FileText, type: 'file', accept: '.pdf,.docx,.doc' },
    { label: 'Upload Image / Screenshot', icon: ImageIcon, type: 'file', accept: 'image/*' },
    { label: 'Add Web Link / URL', icon: LinkIcon, type: 'link', accept: '' },
    { label: 'Attach Source Code / Repo', icon: Code, type: 'file', accept: '.zip,.rar,.tar,.json' },
  ];

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, []);

  const handleSelectAttachOption = (option: typeof attachOptions[0]) => {
    setIsAttachOpen(false);
    if (option.type === 'file') {
      if (fileInputRef.current) {
        fileInputRef.current.accept = option.accept;
        fileInputRef.current.click();
      }
    } else if (option.type === 'link') {
      const url = prompt('Enter Web Link / URL:', 'https://');
      if (url && url.trim() !== '' && url !== 'https://') {
        setAttachedFile(url.trim());
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAttachedFile(files[0].name);
    }
  };

  const handleAiSuggest = async () => {
    setActionError('');
    const token = getAuthToken() || localStorage.getItem('token') || '';
    if (!token) {
      setActionError('Sesi habis, silakan login kembali.');
      window.location.href = '/login';
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await projectApi.suggestDescription(
        { project_name: projectName?.trim() || 'Proyek Baru', platform_type: platformType },
        token
      );
      setProjectDescription(result.description);
      if (error) setError(false);
    } catch (err: any) {
      console.error('Gagal mendapatkan saran AI:', err);
      setProjectDescription(`${titleName} is a comprehensive digital platform designed to optimize workflow management, track real-time analytics, and streamline team collaboration efficiently.`);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleNext = async () => {
    if (!projectDescription || projectDescription.trim() === '') {
      setError(true);
      return;
    }
    setError(false);
    setActionError('');

    const token = getAuthToken() || localStorage.getItem('token') || '';
    if (!token) {
      setActionError('Sesi habis, silakan login kembali.');
      window.location.href = '/login';
      return;
    }

    const id = await createProjectIfNeeded(token);
    if (!id) {
      setActionError('Gagal membuat proyek. Silakan coba lagi.');
      return;
    }

    setIsGenerating(true);
    setPhaseIndex(0);
    setCompletedPhases(0);

    phaseTimerRef.current = setInterval(() => {
      setPhaseIndex((prev) => {
        const next = prev + 1;
        if (next < GENERATION_PHASES.length) {
          setCompletedPhases(next);
          return next;
        }
        return prev;
      });
    }, 1500);

    const success = await generateAIRequirements(id, token);

    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    setCompletedPhases(GENERATION_PHASES.length);
    setPhaseIndex(GENERATION_PHASES.length - 1);

    setTimeout(() => {
      setIsGenerating(false);
      if (success) {
        nextStep();
      } else {
        setActionError('AI gagal menghasilkan rekomendasi. Silakan pastikan token aktif atau coba lagi.');
      }
    }, 600);
  };

  const isBusy = isSuggesting || isCreatingProject || isGenerating;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto pt-20 text-center pb-12 animate-fadeIn">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-tr from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
            <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce relative z-10" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Menyusun Kebutuhan {titleName}
        </h2>
        <p className="text-blue-200/80 text-xs sm:text-sm mb-8">
          AI sedang memproses spesifikasi berbasis platform <span className="text-white font-semibold">{platformType}</span>...
        </p>

        <div className="w-full bg-slate-900/60 border border-blue-400/30 rounded-3xl p-6 text-left backdrop-blur-xl shadow-2xl mb-6">
          <div className="flex flex-col gap-3.5">
            {GENERATION_PHASES.map((phase, index) => {
              const isDone = index < completedPhases;
              const isActive = index === phaseIndex && !isDone;
              return (
                <div key={index} className="flex items-center gap-3.5">
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>
                  <span
                    className={`text-xs sm:text-sm transition-all duration-300 ${
                      isDone
                        ? 'text-white/40 line-through decoration-white/20'
                        : isActive
                        ? 'text-white font-semibold'
                        : 'text-blue-200/40'
                    }`}
                  >
                    {phase}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full bg-blue-950/60 rounded-full h-2 overflow-hidden border border-blue-500/30 p-0.5">
          <div
            className="bg-linear-to-r from-blue-400 to-indigo-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${((completedPhases + 1) / GENERATION_PHASES.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto pt-8 text-center pb-12">
      <style jsx global>{`
        textarea.transparent-scroll::-webkit-scrollbar {
          width: 6px;
        }
        textarea.transparent-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea.transparent-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
        }
        textarea.transparent-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <div className="mb-4">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
        Tell us about <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white">{titleName}</span>
      </h1>

      <p className="text-blue-100/80 text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
        Enter a high-level overview of what it does, and how you use it for your <span className="text-white font-semibold">{platformType}</span> project.
      </p>

      <div
        className={`bg-white/10 border rounded-3xl p-5 sm:p-6 w-full mb-4 backdrop-blur-xl shadow-2xl text-left relative flex flex-col transition-all ${
          error ? 'border-red-400 ring-4 ring-red-400/20 bg-red-950/10' : 'border-blue-400/30 hover:border-blue-400/50'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-400/20">
          <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
            Project Overview Description
          </span>

          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={isBusy}
            className="text-yellow-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all px-3 py-1 rounded-xl bg-white/10 hover:bg-blue-600/40 border border-white/15 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Get AI suggestion based on platform"
          >
            {isSuggesting ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            )}
          </button>
        </div>

        <textarea
          rows={6}
          value={projectDescription}
          onChange={(e) => {
            setProjectDescription(e.target.value);
            if (error) setError(false);
          }}
          placeholder={
            isSuggesting
              ? 'AI sedang menyusun draf deskripsi...'
              : `Describe your ${platformType} project overview...`
          }
          disabled={isSuggesting}
          className="w-full bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:border-blue-400 resize-none mb-4 disabled:opacity-70 leading-relaxed transparent-scroll"
        />

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-blue-400/20 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsAttachOpen(false);
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-blue-600/80 border border-blue-400/40 text-white text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm font-medium"
            >
              <Box className="w-3.5 h-3.5 text-blue-300" />
              <span>{platformType}</span>
              <span className="text-blue-300 text-[10px] ml-1">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-56 max-h-48 overflow-y-auto bg-slate-900 border border-blue-400/30 rounded-2xl shadow-2xl py-2 z-50 flex flex-col backdrop-blur-2xl transparent-scroll">
                <div className="px-4 py-1 text-[10px] font-semibold text-blue-400 uppercase tracking-wider sticky top-0 bg-slate-900 backdrop-blur-md">
                  Select Platform Type
                </div>
                {platforms.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setPlatformType(item);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors hover:bg-blue-600/40 cursor-pointer ${
                      platformType === item ? 'text-white font-semibold bg-blue-600/50' : 'text-blue-200'
                    }`}
                  >
                    <span>{item}</span>
                    {platformType === item && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAttachOpen(!isAttachOpen);
                setIsDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-blue-600/80 border border-blue-400/40 text-white text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm font-medium"
            >
              <Paperclip className="w-3.5 h-3.5 text-blue-300" />
              <span>{attachedFile ? 'Attached (1)' : 'Attach'}</span>
              <span className="text-blue-300 text-[10px] ml-1">▼</span>
            </button>

            {isAttachOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-900 border border-blue-400/30 rounded-2xl shadow-2xl py-2 z-50 flex flex-col backdrop-blur-2xl transparent-scroll">
                <div className="px-4 py-1 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                  Select Attachment Type
                </div>
                {attachOptions.map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectAttachOption(opt)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-left text-blue-200 hover:text-white transition-colors hover:bg-blue-600/40 cursor-pointer"
                    >
                      <IconComp className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {attachedFile && (
            <span
              className="text-[11px] text-blue-200 bg-white/10 border border-blue-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 max-w-xs truncate"
              title={attachedFile}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-300" />
              <span className="truncate">{attachedFile}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-red-300 hover:text-red-100 ml-1 font-bold cursor-pointer shrink-0"
              >
                <X className="w-3 h-3 inline" />
              </button>
            </span>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <div className="w-full text-left mb-4">
          <p className="text-red-300 text-xs flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 px-3.5 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {error ? 'Deskripsi proyek wajib diisi sebelum melanjutkan.' : actionError}
          </p>
        </div>
      )}

      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={isBusy}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-5 py-3 rounded-2xl font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isBusy}
          className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2.5 shadow-xl text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCreatingProject || isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Memproses AI...
            </>
          ) : (
            <>
              <span>Next</span> <ArrowRight className="w-4 h-4 text-blue-600" />
            </>
          )}
        </button>
      </div> 
    </div>
  );
}