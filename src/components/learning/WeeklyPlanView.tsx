import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { LearningTask, VerifiedResource, WeeklyLearningPlan } from '../../types/learning.ts';

interface WeeklyPlanViewProps {
  weeklyPlan: WeeklyLearningPlan | null;
  targetRole: string;
  onCompleteTask: (taskId: string) => void;
  onOpenResource: (resource: VerifiedResource) => void;
}

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  weeklyPlan,
  targetRole,
  onCompleteTask,
  onOpenResource,
}) => {
  if (!weeklyPlan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500">Loading weekly plan...</p>
      </div>
    );
  }

  const progressPercent = weeklyPlan.target_hours > 0
    ? Math.min(100, Math.round((weeklyPlan.completed_hours / weeklyPlan.target_hours) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Weekly Plan Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Weekly Rhythm
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {weeklyPlan.scheduled_tasks.length} Scheduled Tasks
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{weeklyPlan.title}</h2>
            <p className="text-xs text-slate-600 mt-1">
              Target Career: <span className="font-semibold text-slate-800">{targetRole}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">Weekly Commitment</div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {weeklyPlan.completed_hours} / {weeklyPlan.target_hours} hrs
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Weekly Target Progress</span>
            <span className="font-bold text-blue-700 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Objectives */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Key Weekly Milestones</h3>
        </div>

        <ul className="space-y-2">
          {weeklyPlan.objectives.map((obj, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Scheduled Tasks for the Week */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Scheduled Weekly Tasks</h3>

        <div className="space-y-3">
          {weeklyPlan.scheduled_tasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {task.skill_name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes} min
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-600">{task.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!isCompleted ? (
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
