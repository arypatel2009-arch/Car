import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CareerSkillMap, SkillVisualState, StudentSkillState } from '../../types/learning.ts';

interface SkillMapViewProps {
  skillMap: CareerSkillMap | null;
  studentSkills: StudentSkillState[];
  onOpenAssessment: (skillName: string) => void;
}

export const SkillMapView: React.FC<SkillMapViewProps> = ({
  skillMap,
  studentSkills,
  onOpenAssessment,
}) => {
  const [filterState, setFilterState] = useState<'ALL' | SkillVisualState>('ALL');

  if (!skillMap) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500">Loading career skill graph...</p>
      </div>
    );
  }

  const studentStateMap = new Map<string, StudentSkillState>();
  studentSkills.forEach((s) => {
    studentStateMap.set((s.target_skill || s.skill_name).toLowerCase(), s);
  });

  // Calculate visual state for each skill
  const getSkillVisualState = (skillName: string): SkillVisualState => {
    const state = studentStateMap.get(skillName.toLowerCase());
    if (state?.visual_state) return state.visual_state;
    if (state?.current_status === 'STRONG') return 'Completed';
    if (state?.current_status === 'PRACTICAL') return 'Known';

    // Check prerequisites
    const skill = skillMap.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (skill && skill.prerequisites.length > 0) {
      const hasUnsatisfiedPrereq = skill.prerequisites.some((pName) => {
        const pState = studentStateMap.get(pName.toLowerCase());
        const pStatus = pState?.current_status;
        return pStatus !== 'PRACTICAL' && pStatus !== 'STRONG';
      });
      if (hasUnsatisfiedPrereq) return 'Blocked';
    }

    return 'Learning';
  };

  // State counts
  const allVisualStates = skillMap.skills.map((s) => getSkillVisualState(s.name));
  const counts = {
    ALL: skillMap.skills.length,
    Completed: allVisualStates.filter((s) => s === 'Completed').length,
    Known: allVisualStates.filter((s) => s === 'Known').length,
    Learning: allVisualStates.filter((s) => s === 'Learning').length,
    Blocked: allVisualStates.filter((s) => s === 'Blocked').length,
  };

  // Group skills by category
  const categories = [
    'Core Skill',
    'Supporting Skill',
    'Tool',
    'Concept',
    'Domain Knowledge',
    'Professional Skill',
  ] as const;

  return (
    <div className="space-y-6">
      {/* Skill Map Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Phase 2.2 Skill Graph
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {skillMap.skills.length} Required Skills
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{skillMap.role_title} Competency Map</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {skillMap.description}
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 max-w-xs shrink-0">
            <span className="font-semibold text-slate-700 block mb-0.5">Authoritative Source:</span>
            <span>{skillMap.validated_evidence_source}</span>
          </div>
        </div>

        {/* Phase 2.2 Visual State Filter Buttons: Known | Learning | Blocked | Completed */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Status Filter:</span>
          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterState === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Skills</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.ALL})</span>
          </button>

          <button
            onClick={() => setFilterState('Completed')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterState === 'Completed'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className="text-[10px] font-mono">({counts.Completed})</span>
          </button>

          <button
            onClick={() => setFilterState('Known')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterState === 'Known'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Known</span>
            <span className="text-[10px] font-mono">({counts.Known})</span>
          </button>

          <button
            onClick={() => setFilterState('Learning')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterState === 'Learning'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learning</span>
            <span className="text-[10px] font-mono">({counts.Learning})</span>
          </button>

          <button
            onClick={() => setFilterState('Blocked')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterState === 'Blocked'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Blocked</span>
            <span className="text-[10px] font-mono">({counts.Blocked})</span>
          </button>
        </div>
      </div>

      {/* Skills Grouped by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          let catSkills = skillMap.skills.filter((s) => s.category === category);
          if (filterState !== 'ALL') {
            catSkills = catSkills.filter((s) => getSkillVisualState(s.name) === filterState);
          }
          if (catSkills.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{category}</h3>
                <span className="text-xs text-slate-400 font-mono">({catSkills.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catSkills.map((skill) => {
                  const studentState = studentStateMap.get(skill.name.toLowerCase());
                  const visualState = getSkillVisualState(skill.name);
                  const isCritical = skill.importance === 'Critical';

                  // Prerequisites status
                  const prereqStatuses = skill.prerequisites.map((pName) => {
                    const pState = studentStateMap.get(pName.toLowerCase());
                    const isSatisfied = pState?.current_status === 'PRACTICAL' || pState?.current_status === 'STRONG';
                    return { name: pName, isSatisfied };
                  });

                  return (
                    <div
                      key={skill.id}
                      className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 transition-colors ${
                        visualState === 'Completed'
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : visualState === 'Known'
                          ? 'border-blue-200 bg-blue-50/10'
                          : visualState === 'Blocked'
                          ? 'border-rose-200 bg-rose-50/10'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Visual State Badge */}
                            {visualState === 'Completed' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Completed</span>
                              </span>
                            )}
                            {visualState === 'Known' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Known</span>
                              </span>
                            )}
                            {visualState === 'Learning' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>Learning</span>
                              </span>
                            )}
                            {visualState === 'Blocked' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Blocked</span>
                              </span>
                            )}

                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                isCritical
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {skill.importance}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Target: {skill.expected_proficiency}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{skill.name}</h4>
                        </div>

                        <button
                          onClick={() => onOpenAssessment(skill.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Take targeted knowledge check"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Assess</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {skill.why_matters}
                      </p>

                      {/* Evidence & Status notes */}
                      {studentState?.evidence && (
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-slate-700">Calibrated Evidence:</div>
                          <p className="text-slate-600 leading-relaxed">{studentState.evidence}</p>
                        </div>
                      )}

                      {/* Prerequisites & Blocker warning */}
                      {prereqStatuses.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                          <div className="font-semibold text-slate-700 flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-slate-400" />
                            <span>Prerequisites:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {prereqStatuses.map((p, idx) => (
                              <span
                                key={idx}
                                className={`text-[11px] px-2 py-0.5 rounded border font-medium flex items-center gap-1 ${
                                  p.isSatisfied
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {p.isSatisfied ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Lock className="w-3 h-3 text-rose-600" />
                                )}
                                <span>{p.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Level vs Target */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Current Level:</span>
                          <span className="font-semibold text-slate-800">
                            {studentState?.current_status || studentState?.assessed_proficiency || 'UNKNOWN'}
                          </span>
                        </div>

                        {studentState?.claimed && !studentState?.demonstrated && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Claimed (Unverified)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicit Dependency Relationships */}
      {skillMap.dependencies.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Dependency-Aware Skill Sequencing</h3>
          </div>
          <p className="text-xs text-slate-500">
            Roadmaps strictly respect these dependency ordering rules. Advanced topics are blocked until hard prerequisites are satisfied.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {skillMap.dependencies.map((dep, idx) => {
              const fromSkill = skillMap.skills.find((s) => s.id === dep.required_skill_id || s.name.toLowerCase() === dep.required_skill_id.toLowerCase());
              const toSkill = skillMap.skills.find((s) => s.id === dep.skill_id || s.name.toLowerCase() === dep.skill_id.toLowerCase());

              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {fromSkill?.name || dep.required_skill_id}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {toSkill?.name || dep.skill_id}
                    </span>
                  </div>
                  <p className="text-slate-600">{dep.rationale}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
