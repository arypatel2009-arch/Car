import React from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CareerRoleResearch, RecommendationItem } from '../types/career.ts';

interface CareerDetailModalProps {
  research: CareerRoleResearch | null;
  recommendation?: RecommendationItem | null;
  onClose: () => void;
  onSelectGoal: (roleTitle: string) => void;
}

export const CareerDetailModal: React.FC<CareerDetailModalProps> = ({
  research,
  recommendation,
  onClose,
  onSelectGoal,
}) => {
  if (!research) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Career Detail & Evidence</span>
              <span>·</span>
              <span>Barrier: {research.entry_barrier}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {research.role_title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-7">
          {/* Overview */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Career Overview
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">
              {research.overview}
            </p>
          </div>

          {/* Why CareerOS showed this career (if coming from recommendation) */}
          {recommendation && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                Why CareerOS Showed This Career
              </h3>
              <div className="space-y-2 text-xs text-blue-950">
                <p>
                  <strong>Profile Signal: </strong>
                  {recommendation.why_recommended.student_profile_signal}
                </p>
                <p>
                  <strong>Alignment Reason: </strong>
                  {recommendation.why_recommended.alignment_reason}
                </p>
                <p className="text-blue-800 italic">
                  <strong>Noted Limitation: </strong>
                  {recommendation.why_recommended.uncertainty_or_limitations}
                </p>
              </div>
            </div>
          )}

          {/* Typical Responsibilities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Typical Work & Responsibilities
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {research.typical_responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">·</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills & Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-900 mb-2">Core Skills</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-mono">
                {research.core_skills.join(' · ')}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-900 mb-2">Common Toolchain</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-mono">
                {research.common_tools.join(' · ')}
              </p>
            </div>
          </div>

          {/* Supporting skills & Industries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Supporting Skills
              </h4>
              <p className="text-xs text-slate-700">
                {research.supporting_skills.join(', ')}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Industries Where Role Exists
              </h4>
              <p className="text-xs text-slate-700">
                {research.industries.join(', ')}
              </p>
            </div>
          </div>

          {/* Market signals & Startup relevance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Market Signals
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {research.current_market_signals}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Business & Startup Relevance
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {research.business_startup_relevance}
              </p>
            </div>
          </div>

          {/* Related roles */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Related Career Paths
            </h4>
            <p className="text-xs text-slate-700">
              {research.related_roles.join(' · ')}
            </p>
          </div>

          {/* Verified Sources */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Occupational Sources & Labor Citations
              </h4>
            </div>
            <div className="space-y-2.5">
              {research.sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{src.title}</span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{src.publisher}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-600 italic">"{src.evidence_excerpt}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelectGoal(research.role_title);
              onClose();
            }}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Select as Career Goal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
