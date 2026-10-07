import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Layers,
  RotateCcw,
  Sparkles,
  AlertCircle,
  BookOpen,
  Youtube,
} from 'lucide-react';
import { LearningRoadmap, LearningTask, VerifiedResource } from '../../types/learning.ts';

interface PersonalizedRoadmapViewProps {
  roadmap: LearningRoadmap | null;
  onCompleteTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onOpenResource: (resource: VerifiedResource) => void;
  onOpenAssessment: (skillName: string) => void;
  onOpenPaceModal: () => void;
  onExploreTopicResources?: (topicTitle: string) => void;
}

export const PersonalizedRoadmapView: React.FC<PersonalizedRoadmapViewProps> = ({
  roadmap,
  onCompleteTask,
  onReopenTask,
  onSkipTask,
  onOpenResource,
  onOpenAssessment,
  onOpenPaceModal,
  onExploreTopicResources,
}) => {
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  if (!roadmap) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500">Generating personalized roadmap...</p>
      </div>
    );
  }

  const toggleStage = (stageId: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Personalized Learning Sequence
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {roadmap.stages.length} Stages • {roadmap.stages.reduce((acc, s) => acc + s.topics.reduce((tAcc, top) => tAcc + top.tasks.length, 0), 0)} Actionable Tasks
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{roadmap.target_role} Living Roadmap</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {roadmap.pace_description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPaceModal}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Adjust Pace ({roadmap.available_hours_per_day}h/day)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar (0-100% strictly calculated) */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Verifiable Roadmap Progress</span>
            <span className="font-bold text-blue-700 font-mono">{roadmap.overall_progress_percentage}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, roadmap.overall_progress_percentage))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Progress is derived deterministically from completed hands-on verification tasks and knowledge checks.
          </p>
        </div>
      </div>

      {/* Stages List */}
      <div className="space-y-4">
        {roadmap.stages.map((stage) => {
          const isCollapsed = collapsedStages[stage.id];
          const isStageCompleted = stage.status === 'completed';
          const isStageInProgress = stage.status === 'in_progress';

          let totalStageTasks = 0;
          let completedStageTasks = 0;
          stage.topics.forEach((top) => {
            top.tasks.forEach((tsk) => {
              totalStageTasks++;
              if (tsk.status === 'completed') completedStageTasks++;
            });
          });

          return (
            <div
              key={stage.id}
              className={`bg-white border transition-all rounded-xl overflow-hidden shadow-sm ${
                isStageCompleted
                  ? 'border-emerald-200'
                  : isStageInProgress
                  ? 'border-blue-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Stage Header Accordion Toggle */}
              <div
                onClick={() => toggleStage(stage.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      isStageCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isStageInProgress
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isStageCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : stage.order_index}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
                      {isStageCompleted && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Stage Completed
                        </span>
                      )}
                      {isStageInProgress && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Current Focus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-slate-700">
                      {completedStageTasks}/{totalStageTasks} Tasks Done
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">~{stage.estimated_hours} Hours</div>
                  </div>

                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Topics and Tasks inside Stage */}
              {!isCollapsed && (
                <div className="p-5 pt-0 border-t border-slate-100 space-y-6">
                  {stage.topics.map((topic) => (
                    <div key={topic.id} className="pt-4 first:pt-4 space-y-3">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              {topic.target_skill || 'Core Competency'}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>{topic.title}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-mono">
                              Effort: <strong className="text-slate-800">{topic.estimated_learning_effort || `~${topic.estimated_minutes} mins`}</strong>
                            </span>
                            {onExploreTopicResources && (
                              <button
                                onClick={() => onExploreTopicResources(topic.title)}
                                className="px-2 py-0.5 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                title="Discover verified YouTube learning resources"
                              >
                                <Youtube className="w-3 h-3 text-red-600" />
                                <span>Resources</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Objective */}
                        {topic.objective && (
                          <div className="text-xs text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-700">Objective:</span> {topic.objective}
                          </div>
                        )}

                        {/* Prerequisites & Practice Requirement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="font-semibold text-slate-700">Prerequisites:</span>{' '}
                            {topic.prerequisite && topic.prerequisite.length > 0 ? (
                              <span className="text-slate-600">{topic.prerequisite.join(', ')}</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">None (Entry Topic)</span>
                            )}
                          </div>

                          {topic.completion_criteria && (
                            <div>
                              <span className="font-semibold text-slate-700">Completion Criteria:</span>{' '}
                              <span className="text-slate-600">{topic.completion_criteria}</span>
                            </div>
                          )}
                        </div>

                        {topic.practice_requirement && (
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                            <span className="font-semibold text-slate-900">Practice Requirement:</span> {topic.practice_requirement}
                          </div>
                        )}
                      </div>

                      {/* Tasks in Topic */}
                      <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-slate-200">
                        {topic.tasks.map((task) => {
                          const isTaskDone = task.status === 'completed';
                          const isNeedsReview = task.status === 'needs_review';

                          return (
                            <div
                              key={task.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isTaskDone
                                  ? 'bg-emerald-50/20 border-emerald-200'
                                  : isNeedsReview
                                  ? 'bg-amber-50/20 border-amber-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {task.skill_name}
                                    </span>
                                    {task.is_remediation && (
                                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        Remediation
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.estimated_minutes} min
                                    </span>
                                  </div>

                                  <h5 className={`text-sm font-bold ${isTaskDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                    {task.title}
                                  </h5>

                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {task.description}
                                  </p>

                                  <div className="text-[11px] text-slate-500 pt-1">
                                    <span className="font-semibold text-slate-700">Criteria:</span> {task.completion_criteria}
                                  </div>

                                  {/* Verified Resources Link */}
                                  {task.resources && task.resources.length > 0 && (
                                    <div className="pt-2 flex flex-wrap gap-2">
                                      {task.resources.map((res) => (
                                        <button
                                          key={res.id}
                                          onClick={() => onOpenResource(res)}
                                          className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <BookOpen className="w-3 h-3 text-slate-400" />
                                          <span className="font-medium max-w-[160px] truncate">{res.title}</span>
                                          <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Task actions */}
                                <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                  {!isTaskDone ? (
                                    <button
                                      onClick={() => onCompleteTask(task.id)}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Complete</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onReopenTask(task.id)}
                                      className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Reopen</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onOpenAssessment(task.skill_name)}
                                    className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-blue-600" />
                                    <span>Knowledge Check</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
