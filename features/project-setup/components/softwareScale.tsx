'use client';

import { useState } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { Check } from 'lucide-react';

export default function SoftwareSize() {
  const { nextStep, prevStep } = useWizardStore();
  const [knowsSize, setKnowsSize] = useState<string | null>(null);
  
  // State untuk opsi 'Yes'
  const [linesOfCode, setLinesOfCode] = useState<string>('');

  // State untuk opsi 'No'
  const [yearsInDev, setYearsInDev] = useState<string>('');
  const [softwareSizeClass, setSoftwareSizeClass] = useState<string>('');
  const [codeStructure, setCodeStructure] = useState<string>('');

  // Validasi tombol Next dinamis berdasarkan pilihan
  const isFormValid = 
    knowsSize === 'yes' ? linesOfCode.trim().length > 0 :
    knowsSize === 'no' ? (yearsInDev.trim().length > 0 && softwareSizeClass !== '' && codeStructure !== '') : 
    false;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    nextStep();
  };

  return (
    <div className="flex flex-col items-center text-center w-full max-w-xl mx-auto pt-10 pb-16">
      
      {/* Logo Kotak (UD) */}
      <div className="mb-6">
        <LogoUserdoc />
      </div>

      {/* Judul & Deskripsi */}
      <div className="mb-6 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
          The size of your software
        </h2>
        <p className="text-blue-100 text-xs sm:text-sm">
          Do you know (or can estimate) the lines of code in your software?
        </p>
      </div>

      {/* Pilihan Radio / Opsi Yes & No */}
      <form onSubmit={handleNext} className="w-full flex flex-col items-center">
        <div className="flex items-center justify-center gap-8 mb-6">
          <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
            <input
              type="radio"
              name="knowsSize"
              value="yes"
              checked={knowsSize === 'yes'}
              onChange={() => {
                setKnowsSize('yes');
                // Reset field 'no'
                setYearsInDev('');
                setSoftwareSizeClass('');
                setCodeStructure('');
              }}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
            />
            Yes
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
            <input
              type="radio"
              name="knowsSize"
              value="no"
              checked={knowsSize === 'no'}
              onChange={() => {
                setKnowsSize('no');
                // Reset field 'yes'
                setLinesOfCode('');
              }}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
            />
            No
          </label>
        </div>

        {/* --- KONDISI 1: Jika user memilih 'yes' --- */}
        {knowsSize === 'yes' && (
          <div className="w-full mb-6 text-left transition-all animate-fadeIn">
            <label className="block text-xs font-medium text-blue-100 mb-2">
              How many lines of code is it?
            </label>
            <input
              type="text"
              value={linesOfCode}
              onChange={(e) => setLinesOfCode(e.target.value)}
              placeholder="Lines of code"
              className="w-full bg-white/10 border border-blue-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/60 focus:outline-none focus:border-white transition-all shadow-inner"
              autoFocus
            />
          </div>
        )}

        {/* --- KONDISI 2: Jika user memilih 'no' --- */}
        {knowsSize === 'no' && (
          <div className="w-full flex flex-col gap-4 mb-6 text-left transition-all animate-fadeIn">
            
            {/* Input 1: Years in development */}
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-2">
                How many years has your software been in development?
              </label>
              <input
                type="text"
                value={yearsInDev}
                onChange={(e) => setYearsInDev(e.target.value)}
                placeholder="e.g. 2 years"
                className="w-full bg-white/10 border border-blue-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/60 focus:outline-none focus:border-white transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* Input 2: Software size classification */}
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-2">
                What size would you classify this software as?
              </label>
              <select
                value={softwareSizeClass}
                onChange={(e) => setSoftwareSizeClass(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-400/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all shadow-inner cursor-pointer"
              >
                <option value="" disabled className="bg-blue-900 text-blue-200">Select software size...</option>
                <option value="small" className="bg-blue-900 text-white">Small (e.g., MVP, small script/app)</option>
                <option value="medium" className="bg-blue-900 text-white">Medium (Standard web/mobile app)</option>
                <option value="large" className="bg-blue-900 text-white">Large (Enterprise system / Large codebase)</option>
              </select>
            </div>

            {/* Input 3: Code structure description */}
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-2">
                What most accurately describes your software source code structure?
              </label>
              <select
                value={codeStructure}
                onChange={(e) => setCodeStructure(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-400/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all shadow-inner cursor-pointer"
              >
                <option value="" disabled className="bg-blue-900 text-blue-200">Select structure description...</option>
                <option value="modular" className="bg-blue-900 text-white">We have a highly modular and componentized system, with very few large files</option>
                <option value="monolithic" className="bg-blue-900 text-white">We have a monolithic structure with standard file organization</option>
                <option value="legacy" className="bg-blue-900 text-white">Legacy codebase with interconnected or unstructured files</option>
              </select>
            </div>

          </div>
        )}

        {/* Tombol Navigasi */}
        <div className="flex items-center gap-4 w-full">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md ${
              isFormValid
                ? 'bg-white text-blue-700 hover:bg-blue-50 cursor-pointer'
                : 'bg-white/40 text-white/50 cursor-not-allowed'
            }`}
          >
            Next <Check className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={prevStep}
            className="text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-colors underline underline-offset-4 cursor-pointer"
          >
            Back
          </button>
        </div>
      </form>

    </div>
  );
}