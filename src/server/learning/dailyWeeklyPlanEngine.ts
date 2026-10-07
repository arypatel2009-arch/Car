/**
 * CareerOS Phase 2 — Daily and Weekly Learning Plan Engine
 * Connects immediate tasks directly to Career Goal -> Skill -> Gap -> Learning Objective.
 * Explicitly surfaces: Where am I? Where am I going? What should I do now? Why?
 */

import {
  DailyLearningPlan,
  LearningRoadmap,
  LearningTask,
  WeeklyLearningPlan,
} from '../../types/learning.ts';

export class DailyWeeklyPlanEngine {
  /**
   * Extracts actionable Today's Plan from the active roadmap.
   */
  generateDailyPlan(roadmap: LearningRoadmap): DailyLearningPlan {
    const today = new Date().toISOString().split('T')[0];
    const incompleteTasks: LearningTask[] = [];

    // Find all incomplete tasks in sequence
    for (const stage of roadmap.stages) {
      for (const topic of stage.topics) {
        for (const task of topic.tasks) {
          if (task.status !== 'completed' && task.status !== 'blocked') {
            incompleteTasks.push(task);
          }
        }
      }
    }

    // Select today's primary tasks based on available hours (e.g. 2 hours = ~120 min)
    const budgetMinutes = Math.round(roadmap.available_hours_per_day * 60);
    const todayTasks: LearningTask[] = [];
    let allocatedMinutes = 0;

    for (const task of incompleteTasks) {
      if (allocatedMinutes + task.estimated_minutes <= budgetMinutes || todayTasks.length === 0) {
        todayTasks.push(task);
        allocatedMinutes += task.estimated_minutes;
      } else {
        break;
      }
    }

    const priorityTask = todayTasks[0];
    const whereAmI = roadmap.current_stage_title || 'Foundations';
    const whereAmIGoing = `Advancing toward full competency in ${roadmap.target_role}`;
    const whatNow = priorityTask
      ? `${priorityTask.title} (${priorityTask.estimated_minutes} min)`
      : 'All current stage tasks completed! Review assessments or advance to next stage.';
    const whyMatters = priorityTask
      ? `${priorityTask.why_it_matters} Required to clear this bottleneck before advancing to downstream components.`
      : `Consistent incremental practice compounds into verified career capability.`;

    const completedToday = todayTasks.filter((t) => t.status === 'completed').length;

    return {
      date: today,
      context_where_am_i: whereAmI,
      context_where_am_going: whereAmIGoing,
      context_what_now: whatNow,
      context_why_matters: whyMatters,
      today_tasks: todayTasks,
      completed_tasks_count: completedToday,
      total_tasks_count: todayTasks.length,
      total_estimated_minutes: allocatedMinutes,
      active_streak_days: completedToday > 0 ? 1 : 0,
    };
  }

  /**
   * Generates Weekly Learning Plan for the current active cycle.
   */
  generateWeeklyPlan(roadmap: LearningRoadmap, weekNumber: number = 1): WeeklyLearningPlan {
    const scheduledTasks: LearningTask[] = [];
    const targetSkillsSet = new Set<string>();
    let totalScheduledMinutes = 0;

    // Collect first 6-8 tasks of the active stage
    for (const stage of roadmap.stages) {
      if (stage.status !== 'completed') {
        for (const topic of stage.topics) {
          for (const task of topic.tasks) {
            if (scheduledTasks.length < 8) {
              scheduledTasks.push(task);
              targetSkillsSet.add(task.skill_name);
              totalScheduledMinutes += task.estimated_minutes;
            }
          }
        }
        break;
      }
    }

    const targetSkills = Array.from(targetSkillsSet);
    const targetHours = Math.round((totalScheduledMinutes / 60) * 10) / 10;
    const completedMinutes = scheduledTasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.estimated_minutes, 0);
    const completedHours = Math.round((completedMinutes / 60) * 10) / 10;

    return {
      week_number: weekNumber,
      title: `Week ${weekNumber}: ${targetSkills.slice(0, 2).join(' & ')} Proficiency`,
      objectives: [
        `Master foundational syntax and execution patterns for ${targetSkills[0] || 'core topics'}.`,
        `Complete hands-on verification exercises with automated tests or clean code proof.`,
        `Satisfy prerequisite milestones to unlock downstream ${roadmap.target_role} stages.`,
      ],
      target_skills: targetSkills,
      target_hours: targetHours,
      completed_hours: completedHours,
      scheduled_tasks: scheduledTasks,
    };
  }
}

export const dailyWeeklyPlanEngine = new DailyWeeklyPlanEngine();
