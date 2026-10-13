'use client';

import { useRouter } from 'next/navigation';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { FolderGit2, FileCode2, Eye, ArrowLeft } from 'lucide-react';

export default function ProjectType() {
  const router = useRouter();
  const { setProjectType, nextStep, prevStep, projectType, workspaceId } = useWizardStore() as any;

  const handleSelect = (type: 'generate' | 'translate' | 'example') => {
    setProjectType(type);
    nextStep();
  };

  const handleBack = () => {
    const activeProj = typeof window !== 'undefined' ? localStorage.getItem('active_project_id') : null;
    if (workspaceId || activeProj) {
      if (activeProj) {
        router.push(`/stories?project_id=${activeProj}`);
      } else {
        router.push('/stories');
      }
    } else {
      prevStep();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto pt-10 text-center">
      
      {/* Logo */}
      <div className="mb-6">
        <LogoUserdoc />
      </div>

      {/* Grid 2 Pilihan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mb-6">
        
        {/* Pilihan: Generate */}
        <div
          onClick={() => handleSelect('generate')}
          className={`cursor-pointer p-8 rounded-2xl border transition-all flex flex-col items-center text-center ${
            projectType === 'generate'
              ? 'bg-blue-700/80 border-white shadow-xl ring-2 ring-white/50'
              : 'bg-white/10 border-blue-400/60 hover:bg-blue-700/50 hover:border-blue-700/60'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-5">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 leading-snug">
            Generate new software requirements with AI
          </h3>
          <p className="text-blue-200 text-xs leading-relaxed">
            Automatically generate detailed software requirements for a new system or a new component.
          </p>
        </div>

        {/* Pilihan: Translate */}
        <div
          onClick={() => handleSelect('translate')}
          className={`cursor-pointer p-8 rounded-2xl border transition-all flex flex-col items-center text-center ${
            projectType === 'translate'
              ? 'bg-blue-700/80 border-white shadow-xl ring-2 ring-white/50'
              : 'bg-white/10 border-blue-400/60 hover:bg-blue-700/50 hover:border-blue-700/60'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-5">
            <FileCode2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 leading-snug">
            Translate source code into detailed documentation
          </h3>
          <p className="text-blue-200 text-xs leading-relaxed">
            Reverse engineer your code into a detailed knowledge base which would otherwise take months.
          </p>
        </div>
      </div>

            {/* Tombol Explore Example */}
      <div className="w-full flex flex-col items-center mb-8">
        <span className="text-blue-300/80 text-xs font-medium uppercase tracking-wider mb-3">OR</span>
        <button
          type="button"
          onClick={() => handleSelect('example')}
          className={`text-sm font-medium transition-colors flex items-center gap-2 ${
            projectType === 'example' ? 'text-white' : 'text-white hover:text-blue-200'
          }`}
        >
          <Eye className="w-4 h-4" /> Explore an example Userdoc project
        </button>
      </div>

      {/* Tombol Back */}
      <div className="w-full flex items-center justify-start pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleBack}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
      
    </div>
  );
}