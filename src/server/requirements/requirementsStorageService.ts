/**
 * CareerOS Phase 2.1 — Requirements Storage Service
 * Manages dual-mode persistence for Career Research Runs, Requirements, and Sources.
 * Enforces strict user isolation across all records.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CareerRequirementItem,
  CareerResearchRun,
  ResearchSourceItem,
} from '../../types/requirements.ts';
import { storageService } from '../services/storageService.ts';

interface InMemoryRequirementsState {
  runs: Map<string, CareerResearchRun>; // key: runId
  userRuns: Map<string, string[]>; // key: userId -> array of runIds
}

export class RequirementsStorageService {
  private memory: InMemoryRequirementsState = {
    runs: new Map(),
    userRuns: new Map(),
  };

  private get supabase(): SupabaseClient | null {
    return (storageService as any).supabase || null;
  }

  async saveResearchRun(run: CareerResearchRun): Promise<void> {
    // Save in memory
    this.memory.runs.set(run.id, { ...run });
    const userList = this.memory.userRuns.get(run.user_id) || [];
    if (!userList.includes(run.id)) {
      userList.push(run.id);
      this.memory.userRuns.set(run.user_id, userList);
    }

    // Persist to Supabase if configured
    if (this.supabase) {
      try {
        await this.supabase.from('career_research_runs').upsert({
          id: run.id,
          user_id: run.user_id,
          career_goal_id: run.career_goal_id,
          target_role: run.target_role,
          status: run.status,
          what_career_involves: run.what_career_involves,
          typical_work_summary: run.typical_work_summary,
          entry_level_expectations: run.entry_level_expectations,
          evidence_proof_expectations: run.evidence_proof_expectations,
          research_freshness: run.research_freshness,
          error_message: run.error_message || null,
          is_cached: Boolean(run.is_cached),
          created_at: run.created_at,
          completed_at: run.completed_at || null,
        });

        // Insert / upsert sources
        if (run.sources && run.sources.length > 0) {
          const sourceRows = run.sources.map((s) => ({
            id: s.id,
            run_id: run.id,
            user_id: run.user_id,
            target_role: run.target_role,
            title: s.title,
            publisher: s.publisher,
            url: s.url,
            published_at: s.published_at || null,
            retrieved_at: s.retrieved_at,
            source_type: s.source_type,
            evidence_excerpt: s.evidence_excerpt,
            validation_status: s.validation_status,
          }));
          await this.supabase.from('career_research_sources').upsert(sourceRows);
        }

        // Insert / upsert requirements
        if (run.requirements && run.requirements.length > 0) {
          const reqRows = run.requirements.map((r) => ({
            id: r.id,
            run_id: run.id,
            user_id: run.user_id,
            target_role: run.target_role,
            skill_or_topic: r.skill_or_topic,
            category: r.category,
            skill_type: r.skill_type,
            description: r.description,
            importance: r.importance,
            prerequisite_skills: r.prerequisite_skills,
            evidence_expectation: r.evidence_expectation,
            typical_work_application: r.typical_work_application,
            source: r.source,
            source_url: r.source_url,
            source_publisher: r.source_publisher,
            source_date: r.source_date || null,
            retrieved_at: r.retrieved_at,
            confidence: r.confidence,
            validation_status: r.validation_status,
          }));
          await this.supabase.from('career_requirements').upsert(reqRows);
        }
      } catch (err) {
        console.warn('[RequirementsStorage] Supabase saveResearchRun error:', err);
      }
    }
  }

  async getLatestResearchRun(userId: string, targetRole: string): Promise<CareerResearchRun | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_research_runs')
          .select('*')
          .eq('user_id', userId)
          .ilike('target_role', targetRole)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          // Fetch linked requirements & sources
          const [{ data: reqs }, { data: sources }] = await Promise.all([
            this.supabase.from('career_requirements').select('*').eq('run_id', data.id),
            this.supabase.from('career_research_sources').select('*').eq('run_id', data.id),
          ]);

          return {
            id: data.id,
            user_id: data.user_id,
            career_goal_id: data.career_goal_id,
            target_role: data.target_role,
            status: data.status,
            what_career_involves: data.what_career_involves,
            typical_work_summary: data.typical_work_summary,
            entry_level_expectations: data.entry_level_expectations,
            evidence_proof_expectations: data.evidence_proof_expectations,
            research_freshness: data.research_freshness,
            requirements: (reqs || []) as CareerRequirementItem[],
            sources: (sources || []) as ResearchSourceItem[],
            error_message: data.error_message,
            is_cached: data.is_cached,
            created_at: data.created_at,
            completed_at: data.completed_at,
          };
        }
      } catch (err) {
        console.warn('[RequirementsStorage] Supabase getLatestResearchRun error:', err);
      }
    }

    // In-memory lookup
    const runIds = this.memory.userRuns.get(userId) || [];
    const matching = runIds
      .map((id) => this.memory.runs.get(id))
      .filter((r): r is CareerResearchRun => Boolean(r && r.target_role.toLowerCase() === targetRole.toLowerCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return matching[0] || null;
  }

  async getResearchRunById(runId: string, userId: string): Promise<CareerResearchRun | null> {
    const run = this.memory.runs.get(runId);
    if (run && run.user_id === userId) {
      return run;
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_research_runs')
          .select('*')
          .eq('id', runId)
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          const [{ data: reqs }, { data: sources }] = await Promise.all([
            this.supabase.from('career_requirements').select('*').eq('run_id', runId),
            this.supabase.from('career_research_sources').select('*').eq('run_id', runId),
          ]);

          return {
            ...data,
            requirements: reqs || [],
            sources: sources || [],
          };
        }
      } catch (err) {
        console.warn('[RequirementsStorage] Supabase getResearchRunById error:', err);
      }
    }

    return null;
  }

  async getResearchRunsForUser(userId: string): Promise<CareerResearchRun[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_research_runs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as CareerResearchRun[];
        }
      } catch (err) {
        console.warn('[RequirementsStorage] Supabase getResearchRunsForUser error:', err);
      }
    }

    const runIds = this.memory.userRuns.get(userId) || [];
    return runIds
      .map((id) => this.memory.runs.get(id))
      .filter((r): r is CareerResearchRun => Boolean(r))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export const requirementsStorageService = new RequirementsStorageService();
