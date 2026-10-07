import React from 'react';
import { CheckCircle2, Calendar, Compass, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { CareerGoalRecord } from '../types/career.ts';

interface ActiveGoalCardProps {
  goal: CareerGoalRecord;
  onExploreResearch: (roleTitle: string) => void;
  onStartNewDiscovery: () => void;
  onOpenLearning?: () => void;
}

export const ActiveGoalCard: React.FC<ActiveGoalCardProps> = ({
  goal,
  onExploreResearch,
  onStartNewDiscovery,
  onOpenLearning,
}) => {
  const formattedDate = new Date(goal.goal_selected_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
          <div>
            {/* Unboxed metadata row */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Career Goal
              </span>
              <span>·</span>
              <span>Source: {goal.goal_source.replace(/_/g, ' ')}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{formattedDate}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {goal.target_role}
            </h1>

            {goal.rationale_snapshot && (
              <p className="text-sm text-slate-600 italic mt-3 max-w-2xl leading-relaxed">
                "{goal.rationale_snapshot}"
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenLearning && (
              <button
                onClick={onOpenLearning}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Roadmap & Learning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onExploreResearch(goal.target_role)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Occupational Spec</span>
            </button>

            <button
              onClick={onStartNewDiscovery}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Phase 1 Completion Confirmation */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Phase 1 — Career Discovery Complete
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your verified career goal is saved in the database. When Phase 2 (Learning Engine) and subsequent phases become available, your learning roadmap and milestone projects will align with <strong>{goal.target_role}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
