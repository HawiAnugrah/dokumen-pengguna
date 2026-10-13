'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, ArrowLeft, Sparkles, FileText, Users, Layers, ListChecks, Compass } from 'lucide-react';

export default function AiIntro() {
  const { nextStep, prevStep } = useWizardStore();

  const stepsList = [
    {
      title: "Project details",
      description: "Ceritakan gambaran umum proyekmu dan platform yang digunakan.",
      icon: FileText,
    },
    {
      title: "User types",
      description: "Tentukan siapa saja pengguna utama dari aplikasi ini.",
      icon: Users,
    },
    {
      title: "Epics & Non-functional requirements",
      description: "AI menyusun modul-modul utama dan kebutuhan non-fungsional.",
      icon: Layers,
    },
    {
      title: "User story overviews",
      description: "Rincian cerita pengguna untuk tiap epic yang sudah dibuat.",
      icon: ListChecks,
    },
    {
      title: "User goals & example journey",
      description: "Tujuan pengguna dan contoh alur perjalanan mereka di aplikasi.",
      icon: Compass,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-8 text-center">
      
      <div className="mb-6">
        <LogoUserdoc />
      </div>

      <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4 text-xs text-blue-200 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        AI-Assisted Setup
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Let&apos;s create your project requirements.
      </h1>
      
      <p className="text-blue-200 text-sm mb-8 max-w-md">
        Kami akan membantumu menyusun kebutuhan software awal dalam 5 langkah sederhana berikut.
      </p>

      <div className="bg-white/10 border border-blue-200/50 rounded-2xl p-5 sm:p-6 w-full mb-8 text-left backdrop-blur-sm">
        <div className="flex flex-col">
          {stepsList.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === stepsList.length - 1;
            return (
              <div key={index} className="relative flex gap-4 pb-5 last:pb-0">
                {/* Garis penghubung vertikal antar step */}
                {!isLast && (
                  <div className="absolute left-[15px] top-9 bottom-0 w-px bg-white/15" />
                )}

                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20 relative z-10">
                  <Icon className="w-3.5 h-3.5 text-blue-200" />
                </div>

                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-blue-300 text-[11px] font-semibold">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white text-sm font-semibold">{item.title}</span>
                  </div>
                  <p className="text-blue-200/70 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
          type="button"
          onClick={nextStep}
          className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg text-sm cursor-pointer"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}