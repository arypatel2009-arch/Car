import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  GitBranch,
  HelpCircle,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import {
  CareerRequirementItem,
  CareerRequirementsOverview,
  RequirementCategory,
} from '../../types/requirements.ts';
import { api } from '../../lib/api.ts';

interface CareerRequirementsViewProps {
  targetRole: string;
  onNavigateToDiscovery?: () => void;
}

export const CareerRequirementsView: React.FC<CareerRequirementsViewProps> = ({
  targetRole,
  onNavigateToDiscovery,
}) => {
  const [overview, setOverview] = useState<CareerRequirementsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<RequirementCategory | 'ALL'>('ALL');

  const loadRequirements = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      if (force) {
        const res = await api.runCareerRequirements(targetRole, true);
        if (res.overview) setOverview(res.overview);
      } else {
        const res = await api.getCareerRequirements(targetRole);
        if (res.overview) setOverview(res.overview);
        else if (res.message) setError(res.message);
      }
    } catch (err: any) {
      console.error('Failed to load career requirements:', err);
      setError(err.message || 'Unable to load requirements specification.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequirements(false);
  }, [targetRole]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Synthesizing entry-level requirements for <span className="font-semibold text-slate-900">{targetRole}</span>...
        </p>
        <p className="text-xs text-slate-400">Consulting verified occupational standards and labor market research.</p>
      </div>
    );
  }

  if (error || !overview || overview.run.status === 'FAILED') {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Requirements Research Unavailable</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {overview?.run.error_message || error || 'We were unable to synthesize requirements for this career at this time.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => loadRequirements(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Research</span>
          </button>
          {onNavigateToDiscovery && (
            <button
              onClick={onNavigateToDiscovery}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
            >
              Back to Career Discovery
            </button>
          )}
        </div>
      </div>
    );
  }

  const { run, foundational_requirements, core_requirements, supporting_requirements, specialized_requirements, tools_and_technologies, skill_dependencies } = overview;

  // Filter requirements by selected category
  const allReqs = run.requirements || [];
  const displayedReqs = activeCategoryFilter === 'ALL'
    ? allReqs
    : allReqs.filter((r) => r.category === activeCategoryFilter);

  return (
    <div className="space-y-8">
      {/* 1. Target Career Header & Freshness */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Phase 2.1 • Occupational Requirement Spec
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Evidence-Validated
              </span>
              {run.is_cached && (
                <span className="text-xs text-slate-500 font-mono">
                  (Cached snapshot)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {targetRole} Requirements Specification
            </h1>

            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{run.research_freshness}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadRequirements(true)}
              disabled={isRefreshing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh occupational research from verified sources"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Re-researching...' : 'Refresh Research'}</span>
            </button>
          </div>
        </div>

        {/* 2. What this career actually involves & Work Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              What It Involves
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {run.what_career_involves || 'Engineering scalable software solutions.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Typical Work Activities
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {run.typical_work_summary || 'Designing, building, testing, and deploying systems.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              Entry-Level Expectations
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {run.entry_level_expectations || 'Command of core fundamentals, reproducible project proof, and Git collaboration.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Required Competencies & Evidence</h2>
          <p className="text-xs text-slate-500">
            Categorized by foundational hierarchy so you know what must come first.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${allReqs.length})` },
            { id: 'FOUNDATIONAL', label: `Foundational (${foundational_requirements.length})` },
            { id: 'CORE', label: `Core (${core_requirements.length})` },
            { id: 'SUPPORTING', label: `Supporting (${supporting_requirements.length})` },
            { id: 'SPECIALIZED', label: `Specialized (${specialized_requirements.length})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategoryFilter === cat.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Requirements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedReqs.map((req) => {
          const categoryColors: Record<RequirementCategory, { badge: string; border: string }> = {
            FOUNDATIONAL: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', border: 'border-emerald-200/80' },
            CORE: { badge: 'bg-blue-50 text-blue-800 border-blue-200', border: 'border-blue-200/80' },
            SUPPORTING: { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', border: 'border-slate-200' },
            SPECIALIZED: { badge: 'bg-purple-50 text-purple-800 border-purple-200', border: 'border-slate-200' },
          };

          const style = categoryColors[req.category] || categoryColors.CORE;

          return (
            <div
              key={req.id}
              className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors ${style.border}`}
            >
              <div className="space-y-2.5">
                {/* Badges row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                      {req.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-100">
                      {req.skill_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Importance: <span className="font-semibold text-slate-900">{req.importance}</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Confidence: <span className="font-semibold text-slate-700">{req.confidence}</span>
                    </span>
                  </div>
                </div>

                {/* Skill Name */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">{req.skill_or_topic}</h3>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                {/* Concrete Evidence & Proof Expectation */}
                <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Evidence / Proof Expectation:
                  </span>
                  <p className="text-blue-950/80 leading-relaxed">{req.evidence_expectation}</p>
                </div>

                {/* Prerequisites if any */}
                {req.prerequisite_skills && req.prerequisite_skills.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Prerequisites:</span>
                    <div className="flex flex-wrap gap-1">
                      {req.prerequisite_skills.map((p, pIdx) => (
                        <span key={pIdx} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Source Citation */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[260px]" title={`${req.source} (${req.source_publisher})`}>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {req.validation_status}
                  </span>
                  <span className="truncate">
                    Source: <span className="font-medium text-slate-700">{req.source_publisher}</span>
                  </span>
                </div>
                <a
                  href={req.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium shrink-0"
                >
                  <span>Verify Spec</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Tools & Technologies Grid */}
      {tools_and_technologies.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Standard Tools & Technologies</h3>
          </div>
          <p className="text-xs text-slate-500">
            Industry tools and platforms expected in day-to-day engineering workflows for {targetRole}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {tools_and_technologies.map((tool) => (
              <div key={tool.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{tool.skill_or_topic}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{tool.importance}</span>
                </div>
                <p className="text-[11px] text-slate-600">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Skill Dependencies Relationships */}
      {skill_dependencies.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Skill Dependency Pathways</h3>
          </div>
          <p className="text-xs text-slate-500">
            CareerOS enforces these prerequisite dependencies so you never struggle with advanced material before mastering prerequisites.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {skill_dependencies.map((dep, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {dep.requires.join(', ')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {dep.skill}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{dep.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Evidence & Proof Expectations Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span>Proof & Readiness Principle</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold">What Actually Convinces Technical Hiring Managers?</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          {run.evidence_proof_expectations}
        </p>
      </div>

      {/* 8. Sources & Citations Section */}
      {run.sources && run.sources.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Authoritative Research Sources</h3>
          </div>
          <p className="text-xs text-slate-500">
            All requirements are derived from official labor statistics and occupational documentation (no synthetic data).
          </p>

          <div className="space-y-2 pt-2">
            {run.sources.map((source) => (
              <div
                key={source.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">{source.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Publisher: {source.publisher} • Status: {source.validation_status}
                  </div>
                  {source.evidence_excerpt && (
                    <p className="text-[11px] text-slate-600 italic">"{source.evidence_excerpt}"</p>
                  )}
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span>Official Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
