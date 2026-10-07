/**
 * CareerOS Phase 2 — Personalized Learning Roadmap Engine
 * Builds dependency-aware, student-specific roadmaps based on verified skill gaps and available hours.
 */

import {
  CareerSkillMap,
  LearningRoadmap,
  LearningStage,
  LearningTask,
  LearningTopic,
  SkillGapItem,
  StudentSkillState,
} from '../../types/learning.ts';
import { findResourcesForTopic } from './resourceCatalog.ts';

export class RoadmapEngine {
  /**
   * Generates a personalized roadmap for a student given their skill gaps and pace preferences.
   */
  generateRoadmap(
    userId: string,
    careerGoalId: string,
    skillMap: CareerSkillMap,
    skillGaps: SkillGapItem[],
    availableHoursDaily: number = 2.0,
    daysPerWeek: number = 5,
    learningPreference: 'video' | 'reading' | 'practice' | 'mixed' = 'mixed'
  ): LearningRoadmap {
    const roadmapId = `rdm-${userId}-${Date.now().toString(36)}`;
    const stages: LearningStage[] = [];

    // Group gaps by their dependency-satisfaction and natural progression
    // Filter out skills that are 'Already Covered'
    const skillsToLearn = skillGaps.filter((g) => g.gap_category !== 'Already Covered');
    const coveredSkills = skillGaps.filter((g) => g.gap_category === 'Already Covered');

    // Build stages dynamically based on what the student actually needs
    // Stage 1: Immediate Foundational Bottlenecks (P0 skills ready now)
    const p0Ready = skillsToLearn.filter((g) => g.priority_tier === 'P0' || (g.dependencies_satisfied && g.skill.prerequisites.length === 0));
    // Stage 2: Secondary Foundations / Intermediate Skills
    const p1Ready = skillsToLearn.filter((g) => !p0Ready.includes(g) && (g.priority_tier === 'P1' || g.skill.importance === 'Critical'));
    // Stage 3: Advanced / Capstone / Supporting Skills
    const downstream = skillsToLearn.filter((g) => !p0Ready.includes(g) && !p1Ready.includes(g));

    let stageIndex = 1;

    // Helper to build stage
    const createStage = (title: string, desc: string, items: SkillGapItem[]): LearningStage | null => {
      if (items.length === 0) return null;

      const stageId = `stg-${stageIndex}-${roadmapId.slice(-6)}`;
      const stageTopics: LearningTopic[] = [];
      let stageEstimatedMinutes = 0;

      items.forEach((item, itemIdx) => {
        const skill = item.skill;
        const topicId = `tpc-${stageId}-${itemIdx + 1}`;
        const resources = findResourcesForTopic(skill.name, learningPreference === 'mixed' ? undefined : learningPreference);

        // Build 2 actionable tasks per topic
        const task1: LearningTask = {
          id: `tsk-${topicId}-1`,
          roadmap_id: roadmapId,
          stage_id: stageId,
          skill_id: skill.id,
          skill_name: skill.name,
          topic_title: `${skill.name} Core Principles`,
          title: `Study ${skill.name} Fundamentals & Architecture`,
          description: `Focus on ${skill.why_matters.toLowerCase()} Review official documentation and conceptual mechanics.`,
          why_it_matters: skill.why_matters,
          estimated_minutes: 40,
          priority: item.priority_tier === 'P0' ? 'HIGH' : 'MEDIUM',
          status: 'not_started',
          resource_ids: resources.slice(0, 2).map((r) => r.id),
          resources: resources.slice(0, 2),
          completion_criteria: `Understand core definitions and explain career relevance in ${skill.role_title}.`,
        };

        const task2: LearningTask = {
          id: `tsk-${topicId}-2`,
          roadmap_id: roadmapId,
          stage_id: stageId,
          skill_id: skill.id,
          skill_name: skill.name,
          topic_title: `${skill.name} Practical Application`,
          title: `Hands-on Practice: ${skill.suggested_evidence}`,
          description: `Implement real code exercises demonstrating ${skill.suggested_evidence.toLowerCase()}`,
          why_it_matters: `Hands-on proof ensures retention and bridges theoretical knowledge into verifiable capability.`,
          estimated_minutes: 50,
          priority: 'HIGH',
          status: 'not_started',
          resource_ids: resources.slice(1, 3).map((r) => r.id),
          resources: resources.slice(1, 3),
          completion_criteria: `Execute practice exercises without syntax or runtime errors.`,
        };

        const topicEstimated = task1.estimated_minutes + task2.estimated_minutes;
        stageEstimatedMinutes += topicEstimated;

        stageTopics.push({
          id: topicId,
          stage_id: stageId,
          skill_id: skill.id,
          title: `${skill.name}: Foundation & Practice`,
          description: skill.why_matters,
          estimated_minutes: topicEstimated,
          status: 'not_started',
          tasks: [task1, task2],
          resources,
        });
      });

      const stage: LearningStage = {
        id: stageId,
        roadmap_id: roadmapId,
        order_index: stageIndex++,
        title,
        description: desc,
        estimated_hours: Math.round((stageEstimatedMinutes / 60) * 10) / 10,
        status: 'not_started',
        skills_covered: items.map((i) => i.skill.name),
        topics: stageTopics,
      };

      return stage;
    };

    if (p0Ready.length > 0) {
      const s = createStage(
        `Stage 1 — Primary Foundations & Prerequisite Resolution`,
        `Directly addresses immediate bottlenecks and prerequisite dependencies required for downstream modules.`,
        p0Ready
      );
      if (s) stages.push(s);
    }

    if (p1Ready.length > 0) {
      const s = createStage(
        `Stage 2 — Core Technical Proficiency & Modeling`,
        `Deepens core methods, analytical modeling, and framework implementations.`,
        p1Ready
      );
      if (s) stages.push(s);
    }

    if (downstream.length > 0) {
      const s = createStage(
        `Stage 3 — Advanced Systems & Production Deployment`,
        `Integrates modular subsystems, end-to-end pipelines, and production-grade engineering practices.`,
        downstream
      );
      if (s) stages.push(s);
    }

    // Edge case: If all skills already covered!
    if (stages.length === 0) {
      const s = createStage(
        `Stage 1 — Advanced Mastery & Portfolio Optimization`,
        `All foundational requirements already demonstrated. Focus on advanced edge cases and production reliability.`,
        skillGaps.slice(0, 2)
      );
      if (s) stages.push(s);
    }

    // Calculate total hours needed across all generated tasks
    let totalMinutes = 0;
    stages.forEach((stg) => {
      stg.topics.forEach((tpc) => {
        tpc.tasks.forEach((tsk) => {
          totalMinutes += tsk.estimated_minutes;
        });
      });
    });

    const totalHours = Math.max(1, totalMinutes / 60);
    const weeklyHours = Math.max(1, availableHoursDaily * daysPerWeek);
    const estimatedTotalWeeks = Math.max(1, Math.ceil((totalHours / weeklyHours) * 10) / 10);

    const paceDescription = `At your committed pace of ${availableHoursDaily} hr/day (${daysPerWeek} days/week), this personalized roadmap is estimated to take approximately ${estimatedTotalWeeks} weeks, assuming consistent progress.`;

    const firstStage = stages[0];
    const firstSkill = firstStage?.skills_covered[0] || 'Foundations';

    return {
      id: roadmapId,
      user_id: userId,
      career_goal_id: careerGoalId,
      target_role: skillMap.role_title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      available_hours_per_day: availableHoursDaily,
      days_per_week: daysPerWeek,
      learning_preference: learningPreference,
      estimated_total_weeks: estimatedTotalWeeks,
      pace_description: paceDescription,
      stages,
      overall_progress_percentage: 0,
      current_stage_id: firstStage?.id || 'stage-1',
      current_stage_title: firstStage?.title || 'Stage 1',
      current_focus_skill: firstSkill,
    };
  }

  /**
   * Recalculates progress percentage and active stage/focus deterministically.
   */
  recalculateRoadmapProgress(roadmap: LearningRoadmap): LearningRoadmap {
    let totalTasks = 0;
    let completedTasks = 0;
    let foundFirstIncomplete = false;
    let currentStageId = roadmap.stages[0]?.id || '';
    let currentStageTitle = roadmap.stages[0]?.title || '';
    let currentFocusSkill = roadmap.stages[0]?.skills_covered[0] || '';

    roadmap.stages.forEach((stage) => {
      let stageTotal = 0;
      let stageCompleted = 0;

      stage.topics.forEach((topic) => {
        let topicTotal = 0;
        let topicCompleted = 0;

        topic.tasks.forEach((task) => {
          totalTasks++;
          stageTotal++;
          topicTotal++;

          if (task.status === 'completed') {
            completedTasks++;
            stageCompleted++;
            topicCompleted++;
          } else if (!foundFirstIncomplete) {
            foundFirstIncomplete = true;
            currentStageId = stage.id;
            currentStageTitle = stage.title;
            currentFocusSkill = task.skill_name;
          }
        });

        if (topicCompleted === topicTotal && topicTotal > 0) {
          topic.status = 'completed';
        } else if (topicCompleted > 0) {
          topic.status = 'in_progress';
        } else {
          topic.status = 'not_started';
        }
      });

      if (stageCompleted === stageTotal && stageTotal > 0) {
        stage.status = 'completed';
      } else if (stageCompleted > 0) {
        stage.status = 'in_progress';
      } else {
        stage.status = 'not_started';
      }
    });

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...roadmap,
      overall_progress_percentage: progressPercentage,
      current_stage_id: currentStageId,
      current_stage_title: currentStageTitle,
      current_focus_skill: currentFocusSkill,
      updated_at: new Date().toISOString(),
    };
  }
}

export const roadmapEngine = new RoadmapEngine();
