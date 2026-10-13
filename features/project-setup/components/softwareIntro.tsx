'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function TranslateIntro() {
  const { nextStep, prevStep } = useWizardStore();

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-10 text-left">
      
      {/* Logo Kotak (UD) */}
      <div className="mb-6">
        <LogoUserdoc />
      </div>

      {/* Teks Deskripsi Pengantar */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
          Let&apos;s learn about your existing software
        </h2>
        <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
          We&apos;ll guide you through describing your existing software system, its source code, and its technologies. This will help us understand the scope and complexity of your project, and help us provide you with an estimate on what it would cost to turn this into detailed documentation.
        </p>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center gap-6 w-full">
        <button
          type="button"
          onClick={nextStep}
          className="bg-white hover:bg-blue-50 text-blue-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-md cursor-pointer"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={prevStep}
          className="text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors underline underline-offset-4 cursor-pointer"
        >
          Back to project type
        </button>
      </div>

    </div>
  );
}