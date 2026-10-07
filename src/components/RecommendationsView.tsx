import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitCompare,
  HelpCircle,
  Info,
  ThumbsDown,
  BookOpen,
} from 'lucide-react';
import { RecommendationItem, StudentCareerProfile } from '../types/career.ts';

interface RecommendationsViewProps {
  recommendations: RecommendationItem[];
  profile: StudentCareerProfile | null;
  onSelectGoal: (roleTitle: string, rec: RecommendationItem) => void;
  onOpenDetail: (rec: RecommendationItem) => void;
  onOpenReject: (rec: RecommendationItem) => void;
  onCompareAll: () => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  profile,
  onSelectGoal,
  onOpenDetail,
  onOpenReject,
  onCompareAll,
}) => {
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  const toggleWhy = (id: string) => {
    setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeRecommendations = recommendations.filter((r) => !r.is_rejected);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Career Discovery Recommendations
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Evidence-Aligned Career Paths
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Based on your responses and the available occupational evidence, the following careers show alignment with your profile. The final decision always belongs to you.
          </p>
        </div>

        {activeRecommendations.length >= 2 && (
          <button
            onClick={onCompareAll}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0"
          >
            <GitCompare className="w-4 h-4 text-emerald-600" />
            <span>Compare Roles ({activeRecommendations.length})</span>
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-6">
        {activeRecommendations.map((rec) => {
          const isWhyOpen = expandedWhy[rec.id] ?? false;

          return (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Card Main Header */}
              <div className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div>
                    {/* Unboxed metadata row with typographic separators (anti-pill rule) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-medium text-slate-700">
                        Profile Alignment: {rec.profile_alignment}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>Market Evidence: {rec.market_evidence_strength}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>Entry Barrier: {rec.entry_barrier}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {rec.role_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenReject(rec)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Not aligned with what you want"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Not for me</span>
                    </button>

                    <button
                      onClick={() => onSelectGoal(rec.role_title, rec)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Choose Goal</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  {rec.summary}
                </p>

                {/* Core skills & tools inline preview */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">Core Skills: </span>
                    <span>{rec.research.core_skills.slice(0, 4).join(', ')}</span>
                  </div>
                  <button
                    onClick={() => onOpenDetail(rec)}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View full research</span>
                  </button>
                </div>
              </div>

              {/* "Why was this recommended?" Accordion */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 sm:px-7 py-3">
                <button
                  onClick={() => toggleWhy(rec.id)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Why was this recommended?</span>
                  </div>
                  {isWhyOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isWhyOpen && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-3.5 text-xs text-slate-700 animate-in fade-in duration-200">
                    <div>
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        1. Your Profile Signal:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {rec.why_recommended.student_profile_signal}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        2. Occupational Requirement:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {rec.why_recommended.career_requirement}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        3. Verified Research Evidence:
                      </span>
                      <p className="text-slate-600 leading-relaxed italic">
                        "{rec.why_recommended.research_evidence}"
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        4. Alignment Rationale:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {rec.why_recommended.alignment_reason}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/60 text-amber-900">
                      <span className="font-semibold block mb-0.5">
                        5. Limitations & Uncertainties:
                      </span>
                      <p className="leading-relaxed">
                        {rec.why_recommended.uncertainty_or_limitations}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeRecommendations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              All recommendations were rejected
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
              Your rejection feedback was saved without modifying your original responses. You can restart discovery to explore alternative directions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
