/**
 * CareerOS Phase 2 — Adaptive Roadmap Engine
 * Manages the living learning plan: handles task completions, skips, assessment-driven remediation,
 * and pace adaptations.
 */

import {
  LearningRoadmap,
  LearningTask,
  SkillAssessmentResult,
} from '../../types/learning.ts';
import { roadmapEngine } from './roadmapEngine.ts';
import { findResourcesForTopic } from './resourceCatalog.ts';

export class AdaptiveRoadmapEngine {
  /**
   * Completes a task and updates the roadmap progress deterministically.
   */
  completeTask(roadmap: LearningRoadmap, taskId: string): { roadmap: LearningRoadmap; completedTask: LearningTask | null } {
    let completedTask: LearningTask | null = null;

    for (const stage of roadmap.stages) {
      for (const topic of stage.topics) {
        for (const task of topic.tasks) {
          if (task.id === taskId) {
            task.status = 'completed';
            task.completed_at = new Date().toISOString();
            completedTask = task;
            break;
          }
        }
      }
    }

    const updated = roadmapEngine.recalculateRoadmapProgress(roadmap);
    return { roadmap: updated, completedTask };
  }

  /**
   * Reopens a completed or skipped task.
   */
  reopenTask(roadmap: LearningRoadmap, taskId: string): { roadmap: LearningRoadmap; task: LearningTask | null } {
    let targetTask: LearningTask | null = null;

    for (const stage of roadmap.stages) {
      for (const topic of stage.topics) {
        for (const task of topic.tasks) {
          if (task.id === taskId) {
            task.status = 'not_started';
            task.completed_at = undefined;
            task.skipped_at = undefined;
            targetTask = task;
            break;
          }
        }
      }
    }

    const updated = roadmapEngine.recalculateRoadmapProgress(roadmap);
    return { roadmap: updated, task: targetTask };
  }

  /**
   * Skips a task.
   */
  skipTask(roadmap: LearningRoadmap, taskId: string): { roadmap: LearningRoadmap; skippedTask: LearningTask | null } {
    let skippedTask: LearningTask | null = null;

    for (const stage of roadmap.stages) {
      for (const topic of stage.topics) {
        for (const task of topic.tasks) {
          if (task.id === taskId) {
            task.status = 'needs_review';
            task.skipped_at = new Date().toISOString();
            skippedTask = task;
            break;
          }
        }
      }
    }

    const updated = roadmapEngine.recalculateRoadmapProgress(roadmap);
    return { roadmap: updated, skippedTask };
  }

  /**
   * Adapts the roadmap based on knowledge check assessment results.
   * If failed: Injects remediation practice.
   * If passed: Accelerates progress and unlocks downstream tasks.
   */
  adaptFromAssessment(
    roadmap: LearningRoadmap,
    result: SkillAssessmentResult
  ): LearningRoadmap {
    if (!result.passed) {
      // Injects remediation task in the active stage
      const activeStage = roadmap.stages.find((s) => s.id === roadmap.current_stage_id) || roadmap.stages[0];
      if (activeStage && activeStage.topics.length > 0) {
        const remediationResources = findResourcesForTopic(result.skill_name);
        const remediationTask: LearningTask = {
          id: `remed-${Date.now().toString(36)}`,
          roadmap_id: roadmap.id,
          stage_id: activeStage.id,
          skill_id: result.skill_id,
          skill_name: result.skill_name,
          topic_title: `${result.skill_name} Concept Remediation`,
          title: `Targeted Review: ${result.weak_areas.join(' & ')}`,
          description: `Knowledge check highlighted conceptual uncertainty in: ${result.weak_areas.join(', ')}. Review official references and re-test before advancing.`,
          why_it_matters: `Remediating core fundamentals now avoids persistent debugging roadblocks in downstream advanced modules.`,
          estimated_minutes: 35,
          priority: 'HIGH',
          status: 'not_started',
          resource_ids: remediationResources.map((r) => r.id),
          resources: remediationResources,
          completion_criteria: `Review the weak concept documentation and demonstrate understanding of edge cases.`,
          is_remediation: true,
          remediation_reason: `Diagnostic assessment score was ${result.score_percentage}% (threshold: 60%).`,
        };

        // Insert at the front of the active topic's tasks
        activeStage.topics[0].tasks.unshift(remediationTask);
      }
    } else {
      // Passed: If assessment was strong (>= 85%), we can mark any remaining beginner review tasks in this skill as completed
      if (result.assessed_proficiency === 'Strong') {
        for (const stage of roadmap.stages) {
          for (const topic of stage.topics) {
            for (const task of topic.tasks) {
              if (task.skill_name.toLowerCase() === result.skill_name.toLowerCase() && task.priority !== 'HIGH') {
                task.status = 'completed';
                task.completed_at = new Date().toISOString();
              }
            }
          }
        }
      }
    }

    return roadmapEngine.recalculateRoadmapProgress(roadmap);
  }

  /**
   * Adapts roadmap pace when available daily/weekly hours change.
   */
  adaptPace(
    roadmap: LearningRoadmap,
    newHoursDaily: number,
    newDaysWeekly: number
  ): LearningRoadmap {
    let remainingMinutes = 0;
    roadmap.stages.forEach((stg) => {
      stg.topics.forEach((tpc) => {
        tpc.tasks.forEach((tsk) => {
          if (tsk.status !== 'completed') {
            remainingMinutes += tsk.estimated_minutes;
          }
        });
      });
    });

    const remainingHours = Math.max(1, remainingMinutes / 60);
    const weeklyHours = Math.max(1, newHoursDaily * newDaysWeekly);
    const estimatedWeeks = Math.max(1, Math.ceil((remainingHours / weeklyHours) * 10) / 10);

    const paceDescription = `At your updated pace of ${newHoursDaily} hr/day (${newDaysWeekly} days/week), remaining roadmap tasks are estimated to take approximately ${estimatedWeeks} weeks.`;

    return {
      ...roadmap,
      available_hours_per_day: newHoursDaily,
      days_per_week: newDaysWeekly,
      estimated_total_weeks: estimatedWeeks,
      pace_description: paceDescription,
      updated_at: new Date().toISOString(),
    };
  }
}

export const adaptiveRoadmapEngine = new AdaptiveRoadmapEngine();
