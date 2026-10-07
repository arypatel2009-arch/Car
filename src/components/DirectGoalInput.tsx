import React, { useState } from 'react';
import { Target, Search, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface DirectGoalInputProps {
  onBack: () => void;
  onStartDirectVerification: (roleTitle: string) => void;
}

export const DirectGoalInput: React.FC<DirectGoalInputProps> = ({
  onBack,
  onStartDirectVerification,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onStartDirectVerification(inputVal.trim());
  };

  const popularSuggestions = [
    'Frontend Developer',
    'AI Engineer',
    'Data Analyst',
    'Backend Developer',
    'Cybersecurity Analyst',
    'UI/UX Designer',
    'Product Manager',
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to choices</span>
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="max-w-2xl mb-6">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-xs tracking-wider uppercase">
            <Target className="w-4 h-4" />
            <span>Targeted Goal Verification</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            What is your current career goal?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            CareerOS does not accept goals blindly. We will ask a few targeted questions to verify compatibility with what this career actually involves, check for hidden trade-offs, and retrieve official labor research.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. AI Engineer, Frontend Developer, Data Analyst..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="px-6 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <span>Verify Compatibility</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-600 mr-1">Popular roles:</span>
          {popularSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setInputVal(suggestion);
              }}
              className="text-slate-600 hover:text-blue-600 hover:underline cursor-pointer px-1 py-0.5"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Verification principle note */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Verification Protocol:</strong> If you select a demanding technical career (such as AI Engineer) but discover a mismatch with your coding or math comfort, CareerOS will surface targeted clarification questions to help you make an informed decision.
        </div>
      </div>
    </div>
  );
};
