/**
 * CareerOS Phase 1 — Career Discovery Types
 */

export type DiscoveryMode = 'direct_goal' | 'adaptive_discovery' | 'compare_ideas';

export type QualitativeAlignment = 'Strong' | 'Moderate' | 'Limited' | 'Unclear';
export type EntryBarrierLevel = 'Low' | 'Moderate' | 'High' | 'Unclear';
export type MarketEvidenceStrength = 'Strong' | 'Moderate' | 'Limited' | 'Unavailable';
export type ValidationStatus = 'VERIFIED' | 'UNCERTAIN' | 'ESTIMATED';

export interface ResearchSource {
  id: string;
  source: string;
  title: string;
  publisher: string;
  url: string;
  published_at?: string;
  retrieved_at: string;
  evidence_excerpt: string;
  source_type: 'GOVERNMENT_LABOR' | 'INDUSTRY_REPORT' | 'EDUCATIONAL_STANDARDS' | 'MARKET_ANALYSIS' | 'OFFICIAL_OCCUPATIONAL';
  validation_status: ValidationStatus;
}

export interface CareerRoleResearch {
  role_id: string;
  role_title: string;
  overview: string;
  typical_responsibilities: string[];
  core_skills: string[];
  supporting_skills: string[];
  common_tools: string[];
  industries: string[];
  entry_level_expectations: string;
  entry_barrier: EntryBarrierLevel;
  current_market_signals: string;
  related_roles: string[];
  business_startup_relevance: string;
  sources: ResearchSource[];
}

export interface StudentCareerProfile {
  interests: string[];
  work_preferences: string[];
  coding_preference: 'loves_coding' | 'practical_coding' | 'no_code_or_minimal' | 'undecided';
  math_interest: 'comfortable_with_math' | 'practical_applied_math' | 'minimal_math';
  problem_solving_preference: 'analytical_logical' | 'creative_open_ended' | 'people_centric' | 'hands_on';
  creativity_preference: 'high_visual_design' | 'system_solution_architecture' | 'content_storytelling' | 'moderate';
  business_interest: 'high_commercial_focus' | 'moderate' | 'low';
  research_interest: 'deep_inquiry_science' | 'moderate' | 'applied_industry';
  entrepreneurship_interest: 'wants_to_build_startup' | 'interested_in_small_teams' | 'prefers_established_orgs';
  earning_importance: 'high_priority' | 'balanced' | 'lifestyle_first';
  job_opportunity_importance: 'urgent_high_demand' | 'balanced' | 'niche_specialist';
  stability_preference: 'high_stability_corporate' | 'high_growth_dynamic' | 'balanced';
  remote_preference: 'remote_first' | 'hybrid' | 'in_person' | 'flexible';
  available_time_hours: number;
  experience_level: 'beginner_student' | 'some_projects' | 'career_switcher' | 'intermediate' | 'advanced' | 'beginner';
  education_background: string;
  industry_interests: string[];
  inferred_confidence: 'HIGH' | 'MEDIUM' | 'PROVISIONAL';
  tools_used?: string[];
  previous_projects?: string;
}

export interface RawAnswerItem {
  question_id: string;
  question_text: string;
  answer_value: string | string[] | number;
  category: string;
  answered_at: string;
}

export interface RecommendationItem {
  id: string;
  role_title: string;
  summary: string;
  profile_alignment: QualitativeAlignment;
  market_evidence_strength: MarketEvidenceStrength;
  entry_barrier: EntryBarrierLevel;
  supporting_signals: string[];
  potential_conflicts_or_missing: string[];
  why_recommended: {
    student_profile_signal: string;
    career_requirement: string;
    research_evidence: string;
    alignment_reason: string;
    uncertainty_or_limitations: string;
  };
  research: CareerRoleResearch;
  is_rejected?: boolean;
  rejection_reason?: string;
  rejected_at?: string;
}


export interface RejectionPayload {
  recommendation_id: string;
  role_title: string;
  reason_category:
    | "I don't like coding"
    | "I don't like mathematics"
    | "I don't like this type of work"
    | "I prefer creativity"
    | "I prefer business"
    | "I prefer people-focused work"
    | "I want something different"
    | "Other";
  notes?: string;
}

export interface CareerGoalRecord {
  id: string;
  session_id: string;
  user_id: string;
  target_role: string;
  goal_status: 'ACTIVE' | 'ARCHIVED' | 'PAUSED';
  goal_selected_at: string;
  goal_source: 'CAREER_DISCOVERY' | 'DIRECT_CONFIRMATION' | 'COMPARE_CHOICE';
  rationale_snapshot?: string;
}

export interface CareerDiscoverySession {
  id: string;
  user_id: string;
  mode: DiscoveryMode;
  status: 'QUESTIONNAIRE' | 'ANALYSIS' | 'RESEARCH_READY' | 'COMPLETED';
  current_step: number;
  created_at: string;
  updated_at: string;
  initial_input?: string; // used for direct goal or compare ideas
  compare_roles?: string[];
}

export interface ComparisonDimensionRow {
  dimension: string;
  description: string;
  values: Record<string, string | QualitativeAlignment | EntryBarrierLevel | string[]>;
}

export interface ComparisonMatrixData {
  roles: string[];
  dimensions: ComparisonDimensionRow[];
  sources_by_role: Record<string, ResearchSource[]>;
}

// ==========================================
// ADAPTIVE QUESTION ENGINE TYPES
// ==========================================

export interface QuestionOption {
  value: string;
  label: string;
  desc?: string;
}

export interface AdaptiveQuestion {
  question_id: string;
  dimension: string;
  question_text: string;
  context_note?: string; // Conversational feedback from previous answers
  answer_type: 'single' | 'multiple' | 'scale' | 'clarification';
  options: QuestionOption[];
  scale_config?: { min: number; max: number; step: number; unit: string; defaultValue: number };
  is_clarification?: boolean;
  clarification_target?: {
    original_dimension: string;
    conflicting_statement: string;
  };
}

export interface CareerSignalMap {
  coding_affinity: number; // 0.0 to 1.0
  math_affinity: number;
  visual_creativity: number;
  system_architecture: number;
  data_analysis: number;
  business_product: number;
  security_systems: number;
  people_leadership: number;
  research_depth: number;
  autonomy_startup: number;
  time_bandwidth_hours: number;
}

export interface ContradictionRecord {
  id: string;
  dimension: string;
  earlier_statement: string;
  conflicting_statement: string;
  clarification_question: string;
  resolved: boolean;
  resolved_value?: string;
  detected_at: string;
}

export interface CandidateCareerSignal {
  role_title: string;
  score: number; // internal normalized heuristic for ranking, not shown directly as decimal precision
  alignment: QualitativeAlignment;
  supporting_signals: string[];
  opposing_signals: string[];
  unresolved_dimensions: string[];
}

export interface AdaptiveEngineState {
  session_id: string;
  mode: DiscoveryMode;
  questions_answered_count: number;
  is_sufficient: boolean;
  stopping_rationale?: string;
  current_focus_area: string; // e.g. "Distinguishing between AI Engineering and Data Science"
  current_question: AdaptiveQuestion | null;
  answered_dimensions: string[];
  unresolved_dimensions: string[];
  active_contradictions: ContradictionRecord[];
  candidate_signals: CandidateCareerSignal[];
  signals: CareerSignalMap;
}
