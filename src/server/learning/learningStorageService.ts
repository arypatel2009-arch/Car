/**
 * CareerOS Phase 2.2 — Learning Storage Service
 * Manages dual-mode persistence: Supabase PostgreSQL when available, resilient in-memory fallback.
 * Enforces strict user isolation across all student-private data.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  EvidenceSkillStatus,
  LearningRoadmap,
  SkillAssessmentResult,
  StudentSkillProgressLog,
  StudentSkillState,
} from '../../types/learning.ts';
import { storageService } from '../services/storageService.ts';

interface InMemoryLearningState {
  roadmaps: Map<string, LearningRoadmap>; // key: userId
  studentSkills: Map<string, StudentSkillState[]>; // key: userId
  assessmentResults: Map<string, SkillAssessmentResult[]>; // key: userId
  progressLogs: Map<string, StudentSkillProgressLog[]>; // key: userId
  resourceProgress: Map<string, Set<string>>; // key: userId -> set of resourceIds
}

export class LearningStorageService {
  private memory: InMemoryLearningState = {
    roadmaps: new Map(),
    studentSkills: new Map(),
    assessmentResults: new Map(),
    progressLogs: new Map(),
    resourceProgress: new Map(),
  };

  private get supabase(): SupabaseClient | null {
    // Access Supabase instance from main storageService if initialized
    return (storageService as any).supabase || null;
  }

  // --- STUDENT SKILLS ---
  async getStudentSkills(userId: string): Promise<StudentSkillState[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('student_skills')
          .select('*')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            skill_id: d.id,
            skill_name: d.skill_name || d.target_skill,
            category: d.category as any,
            claimed: d.claimed,
            assessed_proficiency: d.assessed_proficiency as any,
            demonstrated: d.demonstrated,
            learning_status: d.learning_status as any,
            evidence_notes: d.evidence_notes,
            last_assessed_at: d.last_assessed_at,

            // Phase 2.2 properties
            target_skill: d.target_skill || d.skill_name,
            current_status: (d.current_status || 'UNKNOWN') as EvidenceSkillStatus,
            evidence: d.evidence || d.evidence_notes || '',
            gap: d.gap || '',
            prerequisites: Array.isArray(d.prerequisites) ? d.prerequisites : [],
            recommended_learning_topics: Array.isArray(d.recommended_learning_topics) ? d.recommended_learning_topics : [],
            recommended_practice: d.recommended_practice || '',
            project_relevance: d.project_relevance || '',
            visual_state: d.visual_state || 'Learning',
          }));
        }
      } catch (err) {
        console.warn('[LearningStorage] Supabase getStudentSkills error:', err);
      }
    }

    return this.memory.studentSkills.get(userId) || [];
  }

  async saveStudentSkills(userId: string, skills: StudentSkillState[], roleTitle: string, goalId?: string): Promise<void> {
    this.memory.studentSkills.set(userId, [...skills]);

    if (this.supabase) {
      try {
        const rows = skills.map((s) => ({
          user_id: userId,
          career_goal_id: goalId || null,
          role_title: roleTitle,
          skill_name: s.target_skill || s.skill_name,
          category: s.category,
          claimed: Boolean(s.claimed),
          assessed_proficiency: s.assessed_proficiency || 'Not Assessed',
          demonstrated: Boolean(s.demonstrated),
          learning_status: s.learning_status || 'not_started',
          evidence_notes: s.evidence || s.evidence_notes || null,
          last_assessed_at: s.last_assessed_at || null,

          // Phase 2.2
          target_skill: s.target_skill || s.skill_name,
          current_status: s.current_status || 'UNKNOWN',
          evidence: s.evidence || s.evidence_notes || '',
          gap: s.gap || '',
          prerequisites: s.prerequisites || [],
          recommended_learning_topics: s.recommended_learning_topics || [],
          recommended_practice: s.recommended_practice || '',
          project_relevance: s.project_relevance || '',
          visual_state: s.visual_state || 'Learning',
        }));

        await this.supabase.from('student_skills').upsert(rows, { onConflict: 'user_id,role_title,skill_name' });
      } catch (err) {
        console.warn('[LearningStorage] Supabase saveStudentSkills error:', err);
      }
    }
  }

  // --- STUDENT SKILL PROGRESS LOGS ---
  async logSkillProgressChange(
    userId: string,
    roleTitle: string,
    targetSkill: string,
    previousStatus: EvidenceSkillStatus,
    newStatus: EvidenceSkillStatus,
    triggerEvent: StudentSkillProgressLog['trigger_event'],
    evidenceSnapshot: string
  ): Promise<void> {
    const log: StudentSkillProgressLog = {
      id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      role_title: roleTitle,
      target_skill: targetSkill,
      previous_status: previousStatus,
      new_status: newStatus,
      trigger_event: triggerEvent,
      evidence_snapshot: evidenceSnapshot,
      created_at: new Date().toISOString(),
    };

    const userLogs = this.memory.progressLogs.get(userId) || [];
    userLogs.push(log);
    this.memory.progressLogs.set(userId, userLogs);

    if (this.supabase) {
      try {
        await this.supabase.from('student_skill_progress').insert({
          id: log.id,
          user_id: userId,
          role_title: roleTitle,
          target_skill: targetSkill,
          previous_status: previousStatus,
          new_status: newStatus,
          trigger_event: triggerEvent,
          evidence_snapshot: evidenceSnapshot,
          created_at: log.created_at,
        });
      } catch (err) {
        console.warn('[LearningStorage] Supabase logSkillProgressChange error:', err);
      }
    }
  }

  async getSkillProgressLogs(userId: string): Promise<StudentSkillProgressLog[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('student_skill_progress')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as StudentSkillProgressLog[];
        }
      } catch (err) {
        console.warn('[LearningStorage] Supabase getSkillProgressLogs error:', err);
      }
    }

    return this.memory.progressLogs.get(userId) || [];
  }

  // --- ROADMAP PERSISTENCE ---
  async getRoadmap(userId: string): Promise<LearningRoadmap | null> {
    return this.memory.roadmaps.get(userId) || null;
  }

  async saveRoadmap(userId: string, roadmap: LearningRoadmap): Promise<void> {
    this.memory.roadmaps.set(userId, roadmap);

    if (this.supabase) {
      try {
        await this.supabase.from('learning_roadmaps').upsert({
          id: roadmap.id,
          user_id: userId,
          career_goal_id: roadmap.career_goal_id,
          target_role: roadmap.target_role,
          available_hours_per_day: roadmap.available_hours_per_day,
          days_per_week: roadmap.days_per_week,
          learning_preference: roadmap.learning_preference,
          estimated_total_weeks: roadmap.estimated_total_weeks,
          pace_description: roadmap.pace_description,
          overall_progress_percentage: roadmap.overall_progress_percentage,
          current_stage_title: roadmap.current_stage_title,
          current_focus_skill: roadmap.current_focus_skill,
          updated_at: new Date().toISOString(),
        });

        // Persist competency stages
        if (roadmap.stages && roadmap.stages.length > 0) {
          const stageRows = roadmap.stages.map((stg) => ({
            id: stg.id,
            roadmap_id: roadmap.id,
            user_id: userId,
            order_index: stg.order_index,
            title: stg.title,
            description: stg.description,
            status: stg.status,
            skills_covered: stg.skills_covered,
            estimated_hours: stg.estimated_hours,
          }));
          await this.supabase.from('learning_stages').upsert(stageRows);

          // Persist competency topics
          const topicRows: any[] = [];
          roadmap.stages.forEach((stg) => {
            (stg.topics || []).forEach((tpc) => {
              topicRows.push({
                id: tpc.id,
                stage_id: stg.id,
                roadmap_id: roadmap.id,
                user_id: userId,
                target_skill: tpc.target_skill || tpc.skill_id,
                title: tpc.title,
                objective: tpc.objective || tpc.description,
                prerequisite: tpc.prerequisite || [],
                estimated_learning_effort: tpc.estimated_learning_effort || `${tpc.estimated_minutes} mins`,
                estimated_minutes: tpc.estimated_minutes,
                practice_requirement: tpc.practice_requirement || '',
                completion_criteria: tpc.completion_criteria || '',
                status: tpc.status,
                tasks: tpc.tasks || [],
              });
            });
          });

          if (topicRows.length > 0) {
            await this.supabase.from('learning_topics').upsert(topicRows);
          }
        }
      } catch (err) {
        console.warn('[LearningStorage] Supabase saveRoadmap error:', err);
      }
    }
  }

  // --- ASSESSMENT RESULTS ---
  async saveAssessmentResult(userId: string, result: SkillAssessmentResult): Promise<void> {
    const list = this.memory.assessmentResults.get(userId) || [];
    list.push(result);
    this.memory.assessmentResults.set(userId, list);

    if (this.supabase) {
      try {
        await this.supabase.from('skill_assessment_results').insert({
          id: result.id,
          user_id: userId,
          skill_name: result.skill_name,
          score_percentage: result.score_percentage,
          passed: result.passed,
          assessed_proficiency: result.assessed_proficiency,
          weak_areas: result.weak_areas,
          recommended_action: result.recommended_action,
          submitted_at: result.submitted_at,
        });
      } catch (err) {
        console.warn('[LearningStorage] Supabase saveAssessmentResult error:', err);
      }
    }
  }

  async getAssessmentResults(userId: string): Promise<SkillAssessmentResult[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('skill_assessment_results')
          .select('*')
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false });

        if (!error && data) {
          return data as SkillAssessmentResult[];
        }
      } catch (err) {
        console.warn('[LearningStorage] Supabase getAssessmentResults error:', err);
      }
    }

    return this.memory.assessmentResults.get(userId) || [];
  }
}

export const learningStorageService = new LearningStorageService();
