import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { SkillGapCategory, SkillGapItem } from '../../types/learning.ts';

interface SkillGapViewProps {
  gaps: SkillGapItem[];
  targetRole: string;
  onOpenAssessment: (skillName: string) => void;
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({
  gaps,
  targetRole,
  onOpenAssessment,
}) => {
  const categories: { key: SkillGapCategory; label: string; desc: string; badgeClass: string }[] = [
    {
      key: 'Must Learn',
      label: 'Must Learn (Immediate Bottlenecks)',
      desc: 'Critical foundations required for your role where you currently have no verified competency.',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      key: 'Needs Refresh',
      label: 'Needs Refresh',
      desc: 'Skills where you have foundational familiarity but need strengthening to meet industry expectations.',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'Should Learn',
      label: 'Should Learn (High-Value Skills)',
      desc: 'Important skills that expand your technical versatility and market readiness.',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      key: 'Already Covered',
      label: 'Already Covered (Zero Repetition)',
      desc: 'Skills you have already demonstrated. CareerOS skips redundant beginner exercises so you learn faster.',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: 'Optional Later',
      label: 'Optional Later / Capstones',
      desc: 'Advanced specializations or nice-to-have tools that can be explored once core stages are completed.',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Skill Gap Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Personalized Skill Gap Analysis</h2>
        </div>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          Comparing the verified industry requirements for <span className="font-semibold text-slate-900">{targetRole}</span> against your assessed profile. Prioritization is calculated from prerequisite bottlenecks and dependency impact, not arbitrary difficulty.
        </p>
      </div>

      {/* Gap Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const items = gaps.filter((g) => g.gap_category === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cat.badgeClass}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({items.length})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                  const skill = item.skill;
                  const isBlocked = !item.dependencies_satisfied;

                  return (
                    <div
                      key={skill.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm space-y-3 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Priority {item.priority_tier}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Current: {item.student_state.assessed_proficiency} → Target: {skill.expected_proficiency}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{skill.name}</h4>
                        </div>

                        <button
                          onClick={() => onOpenAssessment(skill.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Assess</span>
                        </button>
                      </div>

                      {/* Transparent Why Prioritized Explanation */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <span className="font-semibold text-slate-800 block">Why Prioritized Here:</span>
                        <p className="text-slate-600 leading-relaxed">{item.why_prioritized}</p>
                      </div>

                      {/* Prerequisites warning if blocked */}
                      {isBlocked && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Prerequisite waiting:</span> Master{' '}
                            <span className="font-medium underline">{item.unsatisfied_prerequisites.join(', ')}</span> before starting.
                          </div>
                        </div>
                      )}

                      {cat.key === 'Already Covered' && (
                        <div className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Demonstrated {item.student_state.assessed_proficiency}. Skipped in roadmap.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
