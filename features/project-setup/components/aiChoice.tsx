'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface AiChoiceProps {
  // Kalau disediakan, tombol "No, not at this stage" akan memanggil ini
  // (redirect langsung ke /stories, sekaligus seed example story) alih-alih
  // lanjut ke step wizard berikutnya. Boleh async (page.tsx akan await-nya).
  onManualSetup?: () => void | Promise<void>;
}

export default function AiChoice({ onManualSetup }: AiChoiceProps) {
  const { nextStep, prevStep, setUseAi } = useWizardStore() as any;

  const [isSettingUpManual, setIsSettingUpManual] = useState(false);

  // Tidak generate ulang di sini -- AI requirements (user types, epics, user
  // stories, nfrs) sudah di-generate sekali di step DescribeProject (step 5)
  // lewat generateAIRequirements(), dan hasilnya sudah tersimpan di wizard
  // store. Generate ulang di sini akan overwrite editan manual yang mungkin
  // sudah dilakukan user di step UserTypes (step 6). Jadi tombol ini cukup
  // lanjut ke step berikutnya (EpicsList).
  const handleContinueWithAi = () => {
    setUseAi(true);
    nextStep();
  };

  const handleManualInput = async () => {
    setUseAi(false);
    if (onManualSetup) {
      setIsSettingUpManual(true);
      try {
        await onManualSetup();
      } finally {
        setIsSettingUpManual(false);
      }
    } else {
      nextStep();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
        Kick-start your requirements using AI?
      </h1>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Card: Yes, use Userdoc AI */}
        <button
          type="button"
          onClick={handleContinueWithAi}
          disabled={isSettingUpManual}
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mb-1 group-hover:bg-white/25 transition-colors">
            <Check className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-semibold text-white">Yes, use Userdoc AI</span>
          <span className="text-xs text-blue-100/80 leading-relaxed">
            Answer a few more questions and have Userdoc scaffold detailed project requirements.
          </span>
        </button>

        {/* Card: No, not at this stage */}
        <button
          type="button"
          onClick={handleManualInput}
          disabled={isSettingUpManual}
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mb-1 group-hover:bg-white/25 transition-colors">
            {isSettingUpManual ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <X className="w-4 h-4 text-white" />
            )}
          </span>
          <span className="text-sm font-semibold text-white">
            {isSettingUpManual ? 'Menyiapkan project...' : 'No, not at this stage'}
          </span>
          <span className="text-xs text-blue-100/80 leading-relaxed">
            Enter your requirements manually, but don't worry you can always leverage our AI later on.
          </span>
        </button>
      </div>

      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSettingUpManual}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  );
}