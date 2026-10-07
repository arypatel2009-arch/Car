import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdaptiveEngineState,
  CareerDiscoverySession,
  CareerGoalRecord,
  CareerRoleResearch,
  ContradictionRecord,
  RawAnswerItem,
  RecommendationItem,
  RejectionPayload,
  StudentCareerProfile,
} from '../../types/career.ts';
import { serverConfig } from '../config.ts';


// In-memory fallback repository for local dev or when Supabase keys are pending
class MemoryStorage {
  sessions = new Map<string, CareerDiscoverySession>();
  answers = new Map<string, RawAnswerItem[]>(); // sessionId -> answers
  profiles = new Map<string, StudentCareerProfile>(); // sessionId -> profile
  recommendations = new Map<string, RecommendationItem[]>(); // sessionId -> recs
  rejections = new Map<string, RejectionPayload[]>(); // sessionId -> rejections
  goals = new Map<string, CareerGoalRecord[]>(); // userId -> goals
  adaptiveStates = new Map<string, AdaptiveEngineState>(); // sessionId -> state
  contradictions = new Map<string, ContradictionRecord[]>(); // sessionId -> contradictions
}


export class StorageService {
  private supabase: SupabaseClient | null = null;
  private memory = new MemoryStorage();

  constructor() {
    if (serverConfig.supabaseUrl && (serverConfig.supabaseServiceRoleKey || serverConfig.supabasePublishableKey)) {
      this.supabase = createClient(
        serverConfig.supabaseUrl,
        serverConfig.supabaseServiceRoleKey || serverConfig.supabasePublishableKey,
        {
          auth: {
            persistSession: false,
          },
        }
      );
    }
  }

  // --- SESSIONS ---
  async createSession(userId: string, mode: CareerDiscoverySession['mode'], initialInput?: string, compareRoles?: string[]): Promise<CareerDiscoverySession> {
    const session: CareerDiscoverySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      user_id: userId,
      mode,
      status: 'QUESTIONNAIRE',
      current_step: 1,
      initial_input: initialInput,
      compare_roles: compareRoles || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_discovery_sessions')
          .insert({
            id: session.id,
            user_id: userId,
            mode,
            status: session.status,
            current_step: session.current_step,
            initial_input: initialInput,
            compare_roles: compareRoles || [],
            created_at: session.created_at,
            updated_at: session.updated_at,
          })
          .select()
          .single();

        if (!error && data) {
          return data as CareerDiscoverySession;
        }
      } catch (err) {
        console.warn('[StorageService] Supabase session insert error, using local fallback:', err);
      }
    }

    this.memory.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string, userId: string): Promise<CareerDiscoverySession | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_discovery_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', userId)
          .single();

        if (!error && data) return data as CareerDiscoverySession;
      } catch (err) {
        console.warn('[StorageService] Supabase getSession error:', err);
      }
    }

    const session = this.memory.sessions.get(sessionId);
    if (session && session.user_id === userId) {
      return session;
    }
    return null;
  }

  async updateSessionStatus(sessionId: string, status: CareerDiscoverySession['status'], currentStep?: number): Promise<void> {
    const session = this.memory.sessions.get(sessionId);
    if (session) {
      session.status = status;
      if (typeof currentStep === 'number') session.current_step = currentStep;
      session.updated_at = new Date().toISOString();
    }

    if (this.supabase) {
      try {
        await this.supabase
          .from('career_discovery_sessions')
          .update({
            status,
            ...(typeof currentStep === 'number' ? { current_step: currentStep } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('[StorageService] Supabase updateSessionStatus error:', err);
      }
    }
  }

  // --- ANSWERS ---
  async saveAnswers(sessionId: string, userId: string, answers: RawAnswerItem[]): Promise<void> {
    this.memory.answers.set(sessionId, answers);

    if (this.supabase) {
      try {
        const rows = answers.map((a) => ({
          session_id: sessionId,
          user_id: userId,
          question_id: a.question_id,
          question_text: a.question_text,
          category: a.category,
          answer_value: a.answer_value,
          answered_at: a.answered_at || new Date().toISOString(),
        }));

        await this.supabase.from('career_discovery_answers').insert(rows);
      } catch (err) {
        console.warn('[StorageService] Supabase saveAnswers error:', err);
      }
    }
  }

  async getAnswers(sessionId: string, userId: string): Promise<RawAnswerItem[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_discovery_answers')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userId);

        if (!error && data) {
          return data.map((d: any) => ({
            question_id: d.question_id,
            question_text: d.question_text,
            category: d.category,
            answer_value: d.answer_value,
            answered_at: d.answered_at,
          }));
        }
      } catch (err) {
        console.warn('[StorageService] Supabase getAnswers error:', err);
      }
    }

    return this.memory.answers.get(sessionId) || [];
  }

  // --- PROFILES ---
  async saveProfile(sessionId: string, userId: string, profile: StudentCareerProfile): Promise<void> {
    this.memory.profiles.set(sessionId, profile);

    if (this.supabase) {
      try {
        await this.supabase.from('career_profiles').insert({
          session_id: sessionId,
          user_id: userId,
          profile_data: profile,
          inferred_confidence: profile.inferred_confidence,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[StorageService] Supabase saveProfile error:', err);
      }
    }
  }

  async getProfile(sessionId: string, userId: string): Promise<StudentCareerProfile | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_profiles')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data.profile_data as StudentCareerProfile;
        }
      } catch (err) {
        console.warn('[StorageService] Supabase getProfile error:', err);
      }
    }

    return this.memory.profiles.get(sessionId) || null;
  }

  // --- RECOMMENDATIONS ---
  async saveRecommendations(sessionId: string, userId: string, recommendations: RecommendationItem[]): Promise<void> {
    this.memory.recommendations.set(sessionId, recommendations);

    if (this.supabase) {
      try {
        const rows = recommendations.map((r) => ({
          id: r.id,
          session_id: sessionId,
          user_id: userId,
          role_title: r.role_title,
          summary: r.summary,
          profile_alignment: r.profile_alignment,
          market_evidence_strength: r.market_evidence_strength,
          entry_barrier: r.entry_barrier,
          why_recommended: r.why_recommended,
          research_snapshot: r.research,
          is_rejected: Boolean(r.is_rejected),
          rejection_reason: r.rejection_reason || null,
          rejected_at: r.rejected_at || null,
        }));

        await this.supabase.from('career_recommendations').upsert(rows);
      } catch (err) {
        console.warn('[StorageService] Supabase saveRecommendations error:', err);
      }
    }
  }

  async getRecommendations(sessionId: string, userId: string): Promise<RecommendationItem[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_recommendations')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            role_title: d.role_title,
            summary: d.summary,
            profile_alignment: d.profile_alignment,
            market_evidence_strength: d.market_evidence_strength,
            entry_barrier: d.entry_barrier,
            supporting_signals: d.supporting_signals || (d.why_recommended?.student_profile_signal ? [d.why_recommended.student_profile_signal] : []),
            potential_conflicts_or_missing: d.potential_conflicts_or_missing || (d.why_recommended?.uncertainty_or_limitations ? [d.why_recommended.uncertainty_or_limitations] : []),
            why_recommended: d.why_recommended,
            research: d.research_snapshot,
            is_rejected: d.is_rejected,
            rejection_reason: d.rejection_reason,
            rejected_at: d.rejected_at,
          }));
        }
      } catch (err) {
        console.warn('[StorageService] Supabase getRecommendations error:', err);
      }
    }

    return this.memory.recommendations.get(sessionId) || [];
  }

  // --- REJECTIONS ---
  async recordRejection(sessionId: string, userId: string, payload: RejectionPayload): Promise<void> {
    const list = this.memory.rejections.get(sessionId) || [];
    list.push(payload);
    this.memory.rejections.set(sessionId, list);

    const recs = this.memory.recommendations.get(sessionId) || [];
    const target = recs.find((r) => r.role_title.toLowerCase() === payload.role_title.toLowerCase());
    if (target) {
      target.is_rejected = true;
      target.rejection_reason = payload.reason_category;
      target.rejected_at = new Date().toISOString();
    }

    if (this.supabase) {
      try {
        await this.supabase
          .from('career_recommendations')
          .update({
            is_rejected: true,
            rejection_reason: payload.reason_category,
            rejected_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
          .eq('role_title', payload.role_title);
      } catch (err) {
        console.warn('[StorageService] Supabase recordRejection error:', err);
      }
    }
  }

  async getRejections(sessionId: string): Promise<RejectionPayload[]> {
    return this.memory.rejections.get(sessionId) || [];
  }

  // --- GOAL SELECTION ---
  async saveGoal(sessionId: string, userId: string, targetRole: string, goalSource: CareerGoalRecord['goal_source'], rationale?: string): Promise<CareerGoalRecord> {
    const record: CareerGoalRecord = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      session_id: sessionId,
      user_id: userId,
      target_role: targetRole,
      goal_status: 'ACTIVE',
      goal_selected_at: new Date().toISOString(),
      goal_source: goalSource,
      rationale_snapshot: rationale,
    };

    const userGoals = this.memory.goals.get(userId) || [];
    // Mark previous active goals as ARCHIVED
    userGoals.forEach((g) => {
      if (g.goal_status === 'ACTIVE') g.goal_status = 'ARCHIVED';
    });
    userGoals.push(record);
    this.memory.goals.set(userId, userGoals);

    if (this.supabase) {
      try {
        // Archive existing
        await this.supabase
          .from('career_goals')
          .update({ goal_status: 'ARCHIVED' })
          .eq('user_id', userId)
          .eq('goal_status', 'ACTIVE');

        // Insert new active goal
        await this.supabase.from('career_goals').insert({
          id: record.id,
          session_id: sessionId,
          user_id: userId,
          target_role: targetRole,
          goal_status: 'ACTIVE',
          goal_selected_at: record.goal_selected_at,
          goal_source: goalSource,
          rationale_snapshot: rationale,
        });
      } catch (err) {
        console.warn('[StorageService] Supabase saveGoal error:', err);
      }
    }

    return record;
  }

  async getActiveGoal(userId: string): Promise<CareerGoalRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('career_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('goal_status', 'ACTIVE')
          .order('goal_selected_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data as CareerGoalRecord;
        }
      } catch (err) {
        console.warn('[StorageService] Supabase getActiveGoal error:', err);
      }
    }

    const userGoals = this.memory.goals.get(userId) || [];
    return userGoals.find((g) => g.goal_status === 'ACTIVE') || null;
  }

  // --- ADAPTIVE ENGINE STATE ---
  async saveAdaptiveState(sessionId: string, userId: string, state: AdaptiveEngineState): Promise<void> {
    this.memory.adaptiveStates.set(sessionId, state);

    if (this.supabase) {
      try {
        await this.supabase.from('career_profile_signals').upsert({
          session_id: sessionId,
          user_id: userId,
          signals: state.signals,
          updated_at: new Date().toISOString(),
        });

        await this.supabase.from('career_candidate_paths').upsert({
          session_id: sessionId,
          user_id: userId,
          candidates: state.candidate_signals,
          is_sufficient: state.is_sufficient,
          stopping_rationale: state.stopping_rationale || null,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[StorageService] Supabase saveAdaptiveState error:', err);
      }
    }
  }

  async getAdaptiveState(sessionId: string): Promise<AdaptiveEngineState | null> {
    return this.memory.adaptiveStates.get(sessionId) || null;
  }
}

export const storageService = new StorageService();

