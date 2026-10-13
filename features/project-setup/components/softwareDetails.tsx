'use client';

import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore } from '../store/wizard-store';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function SoftwareDetails() {
  const {
    nextStep,
    prevStep,
    hasDbLogic,
    setHasDbLogic,
    useMicroservice,
    setUseMicroservice,
    otherComplexity,
    setOtherComplexity,
  } = useWizardStore();

  const isFormValid =
    hasDbLogic === 'no' ? true :
    hasDbLogic === 'yes' ? (useMicroservice !== null && otherComplexity.trim().length > 0) :
    false;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    nextStep();
  };

  const handleSelectDbLogic = (value: 'yes' | 'no') => {
    setHasDbLogic(value);
    if (value === 'no') {
      setUseMicroservice(null);
      setOtherComplexity('');
    }
  };

  return (
    <div className="flex flex-col items-start w-full max-w-xl mx-auto pt-12">
      <div className="mb-8">
        <LogoUserdoc />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        A little more about your software
      </h1>

      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        Does your software use database logic such as stored procedures or triggers?
      </p>

      <form onSubmit={handleNext} className="w-full flex flex-col items-start">
        <div className="flex items-center gap-8 mb-6">
          <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
            <input
              type="radio"
              name="hasDbLogic"
              value="yes"
              checked={hasDbLogic === 'yes'}
              onChange={() => handleSelectDbLogic('yes')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
            />
            Yes
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
            <input
              type="radio"
              name="hasDbLogic"
              value="no"
              checked={hasDbLogic === 'no'}
              onChange={() => handleSelectDbLogic('no')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
            />
            No
          </label>
        </div>

        {hasDbLogic === 'yes' && (
          <div className="w-full flex flex-col gap-6 mb-6 text-left transition-all animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-2">
                Does your software use a microservice architecture?
              </label>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
                  <input
                    type="radio"
                    name="useMicroservice"
                    value="yes"
                    checked={useMicroservice === 'yes'}
                    onChange={() => setUseMicroservice('yes')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
                  />
                  Yes
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-white text-sm font-medium">
                  <input
                    type="radio"
                    name="useMicroservice"
                    value="no"
                    checked={useMicroservice === 'no'}
                    onChange={() => setUseMicroservice('no')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-blue-400/50 bg-white/10 cursor-pointer"
                  />
                  No
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-100 mb-2">
                Is there any other complexity you think our AI needs to know about your software?
              </label>
              <textarea
                rows={4}
                value={otherComplexity}
                onChange={(e) => setOtherComplexity(e.target.value)}
                placeholder="Any other relevant complexity..."
                className="w-full bg-white/10 border border-blue-100/40 rounded-xl p-4 text-sm text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-inner resize-none"
              />
            </div>
          </div>
        )}

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
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 border ${
              isFormValid
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