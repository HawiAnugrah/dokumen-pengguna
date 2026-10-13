// features/project-setup/components/TeamName.tsx
'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

export default function TeamName() {
  const searchParams = useSearchParams();
  const wsParam = searchParams.get('workspace_id');

  const {
    teamName,
    workspaceId,
    updateTeamName,
    setStep,
    setWorkspaceId,
    nextStep,
    createWorkspaceIfNeeded,
    isCreatingWorkspace,
  } = useWizardStore() as any;

  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (wsParam) {
      const parsedId = Number(wsParam);
      if (parsedId) {
        setWorkspaceId(parsedId);
      }
      setStep(2);
      return;
    }
    if (workspaceId) {
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsParam, workspaceId]);

  const handleNext = async () => {
    if (!teamName || teamName.trim() === "") {
      setError(true);
      return;
    }
    setError(false);
    setActionError('');

    const token = getAuthToken();
    if (!token) {
      setActionError('Sesi habis, silakan login kembali.');
      return;
    }

    const id = await createWorkspaceIfNeeded(token);
    if (!id) {
      setActionError('Gagal membuat ruang kerja. Silakan coba lagi.');
      return;
    }

    nextStep();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTeamName(e.target.value);
    if (error) setError(false);
    if (actionError) setActionError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  if (workspaceId || wsParam) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Setup your team
      </h1>

      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        A team allows you to group your projects, team members, and billing together. Choose a name that identifies your team, this is most likely your company name.
      </p>

      <div className="relative w-full mb-2">
        <input
          type="text"
          value={teamName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type in your team name..."
          autoFocus
          disabled={isCreatingWorkspace}
          className={`w-full bg-white/10 border rounded-xl px-4 py-3.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 transition-all shadow-inner disabled:opacity-60 ${
            error || actionError ? 'border-red-400 focus:ring-red-400' : 'border-blue-200/40 focus:ring-white/50'
          }`}
        />
      </div>

      {error && (
        <p className="text-red-300 text-xs mb-4 animate-shake flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Nama tim wajib diisi sebelum melanjutkan.
        </p>
      )}

      {actionError && (
        <p className="text-red-300 text-xs mb-4 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {actionError}
        </p>
      )}

      {!error && !actionError && <div className="mb-4"></div>}

      <button
        type="button"
        onClick={handleNext}
        disabled={isCreatingWorkspace}
        className="bg-white hover:bg-blue-50 text-blue-700 px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isCreatingWorkspace ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Membuat ruang kerja...
          </>
        ) : (
          <>
            Create Team <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}