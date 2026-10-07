import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  GitBranch,
  Layers,
  ListTodo,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Youtube,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import {
  CareerSkillMap,
  DailyLearningPlan,
  LearningOverviewSummary,
  LearningRoadmap,
  LearningTask,
  SkillAssessmentResult,
  SkillGapItem,
  StudentSkillState,
  VerifiedResource,
  WeeklyLearningPlan,
} from '../../types/learning.ts';
import { TodayPlanView } from './TodayPlanView.tsx';
import { PersonalizedRoadmapView } from './PersonalizedRoadmapView.tsx';
import { SkillGapView } from './SkillGapView.tsx';
import { SkillMapView } from './SkillMapView.tsx';
import { WeeklyPlanView } from './WeeklyPlanView.tsx';
import { VerifiedResourcesView } from './VerifiedResourcesView.tsx';
import { CareerRequirementsView } from './CareerRequirementsView.tsx';
import { SkillAssessmentModal } from './SkillAssessmentModal.tsx';
import { PacePreferenceModal } from './PacePreferenceModal.tsx';

interface LearningOverviewProps {
  onNavigateToDiscovery: () => void;
  initialTab?: LearningTab;
}

export type LearningTab =
  | 'requirements'
  | 'today'
  | 'roadmap'
  | 'gaps'
  | 'skill_map'
  | 'weekly'
  | 'resources';

export const LearningOverview: React.FC<LearningOverviewProps> = ({
  onNavigateToDiscovery,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab || 'requirements');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Learning State
  const [hasGoal, setHasGoal] = useState<boolean>(false);
  const [summary, setSummary] = useState<LearningOverviewSummary | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [skillMap, setSkillMap] = useState<CareerSkillMap | null>(null);
  const [studentSkills, setStudentSkills] = useState<StudentSkillState[]>([]);

  // Modals & Resource Filter
  const [assessmentSkill, setAssessmentSkill] = useState<string | null>(null);
  const [isPaceModalOpen, setIsPaceModalOpen] = useState(false);
  const [selectedResourceTopic, setSelectedResourceTopic] = useState<string>('');

  const loadLearningData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.getLearningOverview();
      setHasGoal(res.has_goal);

      if (res.has_goal && res.summary) {
        setSummary(res.summary);
        setRoadmap(res.roadmap || null);
        setGaps(res.gaps || []);
        setSkillMap(res.skillMap || null);

        // Also fetch student skills
        const gapsRes = await api.getSkillGaps();
        setStudentSkills(gapsRes.studentSkills || []);
      }
    } catch (err: any) {
      console.error('Failed to load learning overview:', err);
      setError(err.message || 'Failed to load learning engine data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  // Task Actions
  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await api.completeLearningTask(taskId);
      setRoadmap(res.roadmap);

      // Refresh today & weekly summaries
      const [todayRes, weekRes] = await Promise.all([api.getTodayPlan(), api.getWeeklyPlan()]);

      if (summary) {
        setSummary({
          ...summary,
          overall_progress_percentage: res.overall_progress_percentage,
          today_plan: todayRes.todayPlan,
          weekly_plan: weekRes.weeklyPlan,
        });
      }
    } catch (err: any) {
      console.error('Task complete failed:', err);
    }
  };

  const handleReopenTask = async (taskId: string) => {
    try {
      const res = await api.reopenLearningTask(taskId);
      setRoadmap(res.roadmap);

      const [todayRes, weekRes] = await Promise.all([api.getTodayPlan(), api.getWeeklyPlan()]);
      if (summary) {
        setSummary({
          ...summary,
          overall_progress_percentage: res.overall_progress_percentage,
          today_plan: todayRes.todayPlan,
          weekly_plan: weekRes.weeklyPlan,
        });
      }
    } catch (err: any) {
      console.error('Task reopen failed:', err);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    try {
      const res = await api.skipLearningTask(taskId);
      setRoadmap(res.roadmap);

      const [todayRes, weekRes] = await Promise.all([api.getTodayPlan(), api.getWeeklyPlan()]);
      if (summary) {
        setSummary({
          ...summary,
          overall_progress_percentage: res.overall_progress_percentage,
          today_plan: todayRes.todayPlan,
          weekly_plan: weekRes.weeklyPlan,
        });
      }
    } catch (err: any) {
      console.error('Task skip failed:', err);
    }
  };

  const handleAssessmentCompleted = (result: SkillAssessmentResult) => {
    // Reload learning overview to pull updated roadmap, skills, and gaps
    loadLearningData();
  };

  const handleOpenResource = (res: VerifiedResource) => {
    window.open(res.url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Synthesizing your personalized CareerOS roadmap...
        </p>
      </div>
    );
  }

  // Case: No active career goal exists -> Route student back to Phase 1 Discovery
  if (!hasGoal || !summary) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Choose a Career Goal First</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Phase 2 transforms an established career goal into a personalized roadmap and daily learning plan. Complete Phase 1 Career Discovery to select and confirm your target role.
          </p>
        </div>

        <button
          onClick={onNavigateToDiscovery}
          className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Compass className="w-4 h-4" />
          <span>Launch Career Discovery</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Top Card: Selected Career & Verifiable Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Career Goal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Confirmed via {summary.goal_source.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.selected_career}
              </h1>
              <button
                onClick={onNavigateToDiscovery}
                className="text-xs font-medium text-slate-500 hover:text-blue-700 underline cursor-pointer"
                title="Explore or switch career goal in Phase 1"
              >
                Change Goal
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Current Stage: <span className="font-semibold text-slate-800">{summary.current_stage_title}</span> • Current Focus: <span className="font-semibold text-blue-700">{summary.current_focus_skill}</span>
            </p>
          </div>

          {/* Progress & Pace Snapshot */}
          <div className="flex items-center gap-6 sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">Roadmap Progress</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-700">
                {summary.overall_progress_percentage}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {summary.mastered_skills_count} of {summary.total_skills_count} skills verified
              </div>
            </div>

            <div className="text-right hidden lg:block">
              <div className="text-xs font-medium text-slate-500">Estimated Duration</div>
              <div className="text-lg font-bold font-mono text-slate-800">
                ~{summary.estimated_total_weeks} Wks
              </div>
              <div className="text-[11px] text-slate-400">
                {summary.daily_pace_hours} hrs/day
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, summary.overall_progress_percentage))}%` }}
          />
        </div>

        {/* Phase 2.2 Deterministic Learning Overview Dashboard (6 Key Indicators) */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Career Goal */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Career Goal</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium">Active</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate" title={summary.selected_career}>
              {summary.selected_career}
            </div>
            <div className="text-[11px] text-slate-500 truncate font-mono">
              Source: {summary.goal_source.replace('_', ' ')}
            </div>
          </div>

          {/* 2. Current Skill Level */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Current Skill Level</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-medium">Evidence-Based</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate" title={summary.current_skill_level || 'Diagnostic Calibration'}>
              {summary.current_skill_level || 'Diagnostic Calibration'}
            </div>
            <div className="text-[11px] text-slate-500">
              {summary.mastered_skills_count} verified • {summary.total_skills_count - summary.mastered_skills_count} in progression
            </div>
          </div>

          {/* 3. Skill Gap */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Skill Gap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">Dependency-Aware</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate" title={summary.skill_gap_summary || `${gaps.length} gaps`}>
              {summary.skill_gap_summary || `${gaps.length} verified gaps remaining`}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {gaps.filter(g => g.priority_tier === 'P0').length} immediate prerequisite blockers
            </div>
          </div>

          {/* 4. Current Stage */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Current Stage</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-medium">In Progress</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate" title={summary.current_stage_title}>
              {summary.current_stage_title}
            </div>
            <div className="text-[11px] text-slate-500">
              Focus: <span className="font-semibold text-blue-700">{summary.current_focus_skill}</span>
            </div>
          </div>

          {/* 5. Current Topic */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Current Topic</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-medium">Topic Focus</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate" title={summary.current_topic_title || roadmap?.current_topic_title || 'Core Foundations'}>
              {summary.current_topic_title || roadmap?.current_topic_title || 'Core Foundations'}
            </div>
            <div className="text-[11px] text-slate-500">
              Competency-driven learning unit
            </div>
          </div>

          {/* 6. Next Action */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 flex items-center justify-between">
              <span>Next Action</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-medium">Recommended</span>
            </div>
            <div className="text-sm font-bold text-blue-900 line-clamp-1" title={summary.next_action || roadmap?.next_action || 'Continue roadmap'}>
              {summary.next_action || roadmap?.next_action || 'Start first hands-on topic exercise'}
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-blue-600">Actionable step</span>
              <button
                onClick={() => setActiveTab('today')}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Go to task &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'requirements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Requirements Spec</span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'today'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Today's Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roadmap'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Personalized Roadmap</span>
        </button>

        <button
          onClick={() => setActiveTab('gaps')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gaps'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Skill Gaps ({gaps.filter((g) => g.gap_category !== 'Already Covered').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('skill_map')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'skill_map'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Skill Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'weekly'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Rhythm</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'resources'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-600" />
          <span>Learning Resources</span>
        </button>
      </div>

      {/* Active Tab Screen Content */}
      <div className="pt-2">
        {activeTab === 'requirements' && (
          <CareerRequirementsView
            targetRole={summary.selected_career}
            onNavigateToDiscovery={onNavigateToDiscovery}
          />
        )}

        {activeTab === 'today' && (
          <TodayPlanView
            todayPlan={summary.today_plan}
            targetRole={summary.selected_career}
            onCompleteTask={handleCompleteTask}
            onReopenTask={handleReopenTask}
            onSkipTask={handleSkipTask}
            onOpenResource={handleOpenResource}
            onOpenAssessment={(skill) => setAssessmentSkill(skill)}
          />
        )}

        {activeTab === 'roadmap' && (
          <PersonalizedRoadmapView
            roadmap={roadmap}
            onCompleteTask={handleCompleteTask}
            onReopenTask={handleReopenTask}
            onSkipTask={handleSkipTask}
            onOpenResource={handleOpenResource}
            onOpenAssessment={(skill) => setAssessmentSkill(skill)}
            onOpenPaceModal={() => setIsPaceModalOpen(true)}
            onExploreTopicResources={(topicTitle) => {
              setSelectedResourceTopic(topicTitle);
              setActiveTab('resources');
            }}
          />
        )}

        {activeTab === 'gaps' && (
          <SkillGapView
            gaps={gaps}
            targetRole={summary.selected_career}
            onOpenAssessment={(skill) => setAssessmentSkill(skill)}
          />
        )}

        {activeTab === 'skill_map' && (
          <SkillMapView
            skillMap={skillMap}
            studentSkills={studentSkills}
            onOpenAssessment={(skill) => setAssessmentSkill(skill)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyPlanView
            weeklyPlan={summary.weekly_plan}
            targetRole={summary.selected_career}
            onCompleteTask={handleCompleteTask}
            onOpenResource={handleOpenResource}
          />
        )}

        {activeTab === 'resources' && (
          <VerifiedResourcesView
            initialTopicTitle={
              selectedResourceTopic ||
              summary.current_topic_title ||
              roadmap?.current_topic_title ||
              'Python Programming'
            }
            initialRole={summary.selected_career}
            onSelectResource={(r: any) => handleOpenResource(r)}
          />
        )}
      </div>

      {/* Diagnostic Skill Assessment Modal */}
      {assessmentSkill && (
        <SkillAssessmentModal
          skillName={assessmentSkill}
          roleTitle={summary.selected_career}
          onClose={() => setAssessmentSkill(null)}
          onAssessmentCompleted={handleAssessmentCompleted}
        />
      )}

      {/* Pace Preference Adjustment Modal */}
      {isPaceModalOpen && roadmap && (
        <PacePreferenceModal
          currentHours={roadmap.available_hours_per_day}
          currentDays={roadmap.days_per_week}
          onClose={() => setIsPaceModalOpen(false)}
          onPaceUpdated={(updated) => {
            setRoadmap(updated);
            if (summary) {
              setSummary({
                ...summary,
                daily_pace_hours: updated.available_hours_per_day,
                estimated_total_weeks: updated.estimated_total_weeks,
              });
            }
          }}
        />
      )}
    </div>
  );
};
