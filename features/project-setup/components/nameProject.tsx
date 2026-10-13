// features/project-setup/components/nameProject.tsx
'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { Sparkles, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function NameProject() {
  const { projectName, updateProjectName, nextStep, prevStep } = useWizardStore() as any;
  const [error, setError] = useState(false);

  const handleNext = () => {
    if (!projectName || projectName.trim() === "") {
      setError(true);
      return;
    }
    setError(false);
    nextStep();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProjectName(e.target.value);
    if (error) setError(false);
  };

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        What is the name of your project?
      </h1>

      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        This is the name of your software, app, or system you want to create requirements for.{' '}
        <span className="mt-1 text-blue-300 flex items-center gap-1.5">
          (click the <Sparkles className="w-3.5 h-3.5 inline-block" /> button on the right for some inspiration)
        </span>
      </p>

      <div className="relative w-full mb-2">
        <input
          type="text"
          value={projectName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your project name here..."
          autoFocus
          className={`w-full bg-white/10 border rounded-xl px-4 py-3.5 text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 transition-all shadow-inner pr-12 ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-blue-100/40 focus:ring-white/50'
          }`}
        />
      </div>

      {error && (
        <p className="text-red-300 text-xs mb-4 animate-shake flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Nama proyek wajib diisi sebelum melanjutkan.
        </p>
      )}

      {!error && <div className="mb-4"></div>}

      <div className="w-full flex items-center justify-between">
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