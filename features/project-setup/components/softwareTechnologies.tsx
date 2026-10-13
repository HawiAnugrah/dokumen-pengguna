'use client';

import { useState } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

export default function SoftwareTechnologies() {
  const { nextStep, prevStep, softwareTechnologies, setSoftwareTechnologies, createProjectIfNeeded } = useWizardStore() as any;

  const [technologies, setTechnologies] = useState<string[]>(
    softwareTechnologies && softwareTechnologies.length > 0 ? softwareTechnologies : []
  );
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTech = inputValue.trim();
      if (!technologies.includes(newTech)) {
        setTechnologies([...technologies, newTech]);
      }
      setInputValue('');
    }
  };

  const removeTech = (techToRemove: string) => {
    setTechnologies(technologies.filter((tech) => tech !== techToRemove));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (technologies.length === 0) return;
    setSoftwareTechnologies(technologies);
    
    // 🚀 Buat project di background sebelum masuk step akhir
    const token = getAuthToken();
    if (token && createProjectIfNeeded) {
      createProjectIfNeeded(token).catch((err: any) => console.error("Auto create proj error:", err));
    }

    nextStep();
  };

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        What technologies does this software use?
      </h1>

      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        Select the programming languages and frameworks used to build this system.
      </p>

      <form onSubmit={handleNext} className="w-full flex flex-col items-start">
        <div className="w-full bg-white/10 border border-blue-100/40 rounded-xl p-3 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-white/50 transition-all shadow-inner mb-6">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium backdrop-blur-sm"
            >
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="hover:text-red-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={technologies.length === 0 ? 'Type technology and press Enter...' : ''}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-blue-300/50 flex-1 min-w-[140px] px-1 py-1"
            autoFocus
          />
        </div>

        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            type="submit"
            disabled={technologies.length === 0}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 border ${
              technologies.length > 0
                ? 'bg-transparent hover:bg-white/10 text-white border-white/20 backdrop-blur-sm cursor-pointer'
                : 'bg-transparent text-white/30 border-white/10 cursor-not-allowed'
            }`}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}