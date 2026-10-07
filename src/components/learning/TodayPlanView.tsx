import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { DailyLearningPlan, LearningTask, VerifiedResource } from '../../types/learning.ts';

interface TodayPlanViewProps {
  todayPlan: DailyLearningPlan | null;
  targetRole: string;
  onCompleteTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onOpenResource: (resource: VerifiedResource) => void;
  onOpenAssessment: (skillName: string) => void;
}

export const TodayPlanView: React.FC<TodayPlanViewProps> = ({
  todayPlan,
  targetRole,
  onCompleteTask,
  onReopenTask,
  onSkipTask,
  onOpenResource,
  onOpenAssessment,
}) => {
  if (!todayPlan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500">Loading today's actionable learning plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Banner: The 4 Core Questions */}
      <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            OS
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Learning Focus</h2>
            <p className="text-xs text-slate-500 font-medium">
              Grounded orientation for your target career: <span className="text-blue-700 font-semibold">{targetRole}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Where am I? */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Where am I?
            </div>
            <p className="text-sm font-semibold text-slate-900">{todayPlan.context_where_am_i}</p>
          </div>

          {/* Where am I going? */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Where am I going?
            </div>
            <p className="text-sm font-semibold text-slate-900">{todayPlan.context_where_am_going}</p>
          </div>

          {/* What should I do now? */}
          <div className="p-4 bg-white border border-blue-200 bg-blue-50/30 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              What should I do now?
            </div>
            <p className="text-sm font-semibold text-slate-900">{todayPlan.context_what_now}</p>
          </div>

          {/* Why? */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Why does this matter?
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{todayPlan.context_why_matters}</p>
          </div>
        </div>
      </div>

      {/* Task Queue Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Today's Actionable Tasks</h3>
          <p className="text-xs text-slate-500">
            {todayPlan.completed_tasks_count} of {todayPlan.total_tasks_count} tasks completed today (~{todayPlan.total_estimated_minutes} min scheduled)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Committed pace: ~{todayPlan.total_estimated_minutes} mins</span>
        </div>
      </div>

      {/* Task List */}
      {todayPlan.today_tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">You're All Caught Up for Today!</h4>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You have completed all scheduled tasks for today's budget. You can inspect your full roadmap, review verified resources, or test your comprehension with a skill assessment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayPlan.today_tasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';
            const isNeedsReview = task.status === 'needs_review';

            return (
              <div
                key={task.id}
                className={`bg-white border transition-all rounded-xl p-5 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isNeedsReview
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Task #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {task.skill_name}
                      </span>
                      {task.priority === 'HIGH' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Priority Bottleneck
                        </span>
                      )}
                      {task.is_remediation && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Remediation Practice
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        {task.estimated_minutes} min
                      </span>
                    </div>

                    <h4 className={`text-base font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>

                    <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>

                    {/* Why this specific task matters */}
                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        Why this task is prioritized:
                      </div>
                      <p>{task.why_it_matters}</p>
                    </div>

                    {/* Completion Criteria */}
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                      <span className="font-medium text-slate-700">Verification Criteria:</span>
                      <span>{task.completion_criteria}</span>
                    </div>

                    {/* Linked Verified Resources */}
                    {task.resources && task.resources.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          Verified Learning Resources:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.resources.map((res) => (
                            <button
                              key={res.id}
                              onClick={() => onOpenResource(res)}
                              className="text-xs text-left px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-1.5 transition-colors group"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="font-medium text-slate-800 group-hover:text-blue-700 max-w-[220px] truncate">
                                {res.title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">({res.provider})</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task Action Buttons */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    {!isCompleted ? (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="w-full px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Complete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onReopenTask(task.id)}
                        className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => onSkipTask(task.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Skip for now and review later"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip for later</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenAssessment(task.skill_name)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Take Diagnostic</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
