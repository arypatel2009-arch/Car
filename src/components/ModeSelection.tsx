import React from 'react';
import { Target, Compass, GitCompare, ArrowRight } from 'lucide-react';
import { DiscoveryMode } from '../types/career.ts';

interface ModeSelectionProps {
  onSelectMode: (mode: DiscoveryMode) => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3 text-balance">
          What do you want to become?
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          CareerOS provides verified occupational evidence and structured guidance to help you navigate your journey. The final decision always belongs to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Choice 1: I already know my career goal */}
        <div
          onClick={() => onSelectMode('direct_goal')}
          className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              I already know my career goal
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Enter your target role directly. We will retrieve verified labor research, required skillsets, entry hurdles, and real market citations for your confirmation.
            </p>
          </div>
          <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
            <span>Verify & establish goal</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Choice 2: I'm confused — help me discover career paths */}
        <div
          onClick={() => onSelectMode('adaptive_discovery')}
          className="group relative bg-white rounded-xl border-2 border-blue-500/80 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-5">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              I'm confused — help me discover career paths
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Take an adaptive, concise questionnaire evaluating your interests, coding preference, problem solving style, and learning bandwidth without boring forms.
            </p>
          </div>
          <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
            <span>Start guided discovery</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Choice 3: I have a few ideas — compare them for me */}
        <div
          onClick={() => onSelectMode('compare_ideas')}
          className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <GitCompare className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              I have a few ideas — compare them for me
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Enter 2 to 5 careers you are considering. Review a transparent, side-by-side comparison across skills, entry barriers, market evidence, and startup viability.
            </p>
          </div>
          <div className="flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
            <span>Compare candidate roles</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Trust & Evidence Principle callout */}
      <div className="mt-12 bg-slate-100/70 border border-slate-200 rounded-xl p-5 text-center max-w-3xl mx-auto">
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Our Evidence Principle:</strong> CareerOS references authoritative labor databases (including the U.S. Bureau of Labor Statistics OOH and O*NET Online). We never present fabricated statistics or hallucinated job demand percentages.
        </p>
      </div>
    </div>
  );
};
