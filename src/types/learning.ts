/**
 * CareerOS Phase 2 — Personalized Career Roadmap & Learning Engine Types
 */

export type SkillCategory =
  | 'Core Skill'
  | 'Supporting Skill'
  | 'Tool'
  | 'Concept'
  | 'Domain Knowledge'
  | 'Professional Skill';

export type SkillImportance =
  | 'Critical'
  | 'Important'
  | 'Useful'
  | 'Optional';

export type SkillProficiency =
  | 'Not Assessed'
  | 'Beginner'
  | 'Foundational'
  | 'Intermediate'
  | 'Advanced'
  | 'Strong';

export type EvidenceSkillStatus =
  | 'UNKNOWN'
  | 'NOT_STARTED'
  | 'BEGINNER'
  | 'DEVELOPING'
  | 'PRACTICAL'
  | 'STRONG';

export type SkillVisualState = 'Known' | 'Learning' | 'Blocked' | 'Completed';

export type SkillGapCategory =
  | 'Already Covered'
  | 'Needs Refresh'
  | 'Must Learn'
  | 'Should Learn'
  | 'Optional Later';

export type LearningTaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'needs_review'
  | 'blocked';

export type LearningResourceType =
  | 'official_doc'
  | 'video'
  | 'course'
  | 'book'
  | 'article'
  | 'practice_platform'
  | 'tutorial';

export type ResourceRole = 'primary' | 'practice' | 'alternative';

export interface VerifiedResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  type: LearningResourceType;
  role: ResourceRole;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_free: boolean;
  why_recommended: string;
  verification_status: 'VERIFIED' | 'UNCERTAIN' | 'ESTIMATED';
  retrieved_date: string;
}

export interface CareerSkill {
  id: string;
  role_title: string;
  name: string;
  category: SkillCategory;
  importance: SkillImportance;
  expected_proficiency: SkillProficiency;
  why_matters: string;
  career_relevance: string;
  suggested_evidence: string;
  prerequisites: string[]; // skill IDs or skill names
}

export interface CareerSkillDependency {
  skill_id: string;
  required_skill_id: string;
  dependency_type: 'hard_prerequisite' | 'recommended_before';
  rationale: string;
}

export interface CareerSkillMap {
  id: string;
  role_title: string;
  description: string;
  validated_evidence_source: string;
  skills: CareerSkill[];
  dependencies: CareerSkillDependency[];
  last_updated: string;
}

export interface StudentSkillState {
  skill_id: string;
  skill_name: string;
  category: SkillCategory;
  claimed: boolean;
  assessed_proficiency: SkillProficiency;
  demonstrated: boolean;
  learning_status: LearningTaskStatus;
  evidence_notes?: string;
  last_assessed_at?: string;

  // Phase 2.2 Competency Model
  target_skill?: string;
  current_status?: EvidenceSkillStatus;
  evidence?: string;
  gap?: string;
  prerequisites?: string[];
  recommended_learning_topics?: string[];
  recommended_practice?: string;
  project_relevance?: string;
  visual_state?: SkillVisualState;
}

export interface SkillGapItem {
  skill: CareerSkill;
  student_state: StudentSkillState;
  gap_category: SkillGapCategory;
  priority_score: number; // calculated deterministically: importance * dependency impact / current level
  priority_tier: 'P0' | 'P1' | 'P2' | 'P3';
  why_prioritized: string;
  dependencies_satisfied: boolean;
  unsatisfied_prerequisites: string[];
}

export interface LearningTask {
  id: string;
  roadmap_id: string;
  stage_id: string;
  skill_id: string;
  skill_name: string;
  topic_title: string;
  title: string;
  description: string;
  why_it_matters: string;
  estimated_minutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: LearningTaskStatus;
  resource_ids: string[];
  resources: VerifiedResource[];
  completion_criteria: string;
  completed_at?: string;
  skipped_at?: string;
  is_remediation?: boolean;
  remediation_reason?: string;
}

export interface LearningTopic {
  id: string;
  stage_id: string;
  skill_id: string;
  target_skill?: string;
  title: string;
  description: string;
  objective?: string;
  prerequisite?: string[];
  estimated_learning_effort?: string;
  estimated_minutes: number;
  practice_requirement?: string;
  completion_criteria?: string;
  status: LearningTaskStatus;
  tasks: LearningTask[];
  resources: VerifiedResource[];
}

export interface LearningStage {
  id: string;
  roadmap_id: string;
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  status: LearningTaskStatus;
  skills_covered: string[];
  topics: LearningTopic[];
}

export interface LearningRoadmap {
  id: string;
  user_id: string;
  career_goal_id: string;
  target_role: string;
  created_at: string;
  updated_at: string;
  available_hours_per_day: number;
  days_per_week: number;
  learning_preference: 'video' | 'reading' | 'practice' | 'mixed';
  estimated_total_weeks: number;
  estimated_workload_hours?: number;
  pace_description: string;
  stages: LearningStage[];
  overall_progress_percentage: number; // 0-100 derived deterministically
  current_stage_id: string;
  current_stage_title: string;
  current_topic_id?: string;
  current_topic_title?: string;
  current_focus_skill: string;
  next_action?: string;
}

export interface DailyLearningPlan {
  date: string;
  context_where_am_i: string;
  context_where_am_going: string;
  context_what_now: string;
  context_why_matters: string;
  today_tasks: LearningTask[];
  completed_tasks_count: number;
  total_tasks_count: number;
  total_estimated_minutes: number;
  active_streak_days: number;
}

export interface WeeklyLearningPlan {
  week_number: number;
  title: string;
  objectives: string[];
  target_skills: string[];
  target_hours: number;
  completed_hours: number;
  scheduled_tasks: LearningTask[];
}

export interface SkillAssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  targeted_concept: string;
}

export interface SkillAssessment {
  id: string;
  skill_id: string;
  skill_name: string;
  role_title: string;
  questions: SkillAssessmentQuestion[];
  pass_threshold_percentage: number;
}

export interface SkillAssessmentResult {
  id: string;
  assessment_id: string;
  skill_id: string;
  skill_name: string;
  user_id: string;
  score_percentage: number;
  passed: boolean;
  assessed_proficiency: SkillProficiency;
  assessed_status?: EvidenceSkillStatus;
  weak_areas: string[];
  strong_areas: string[];
  recommended_action: string;
  submitted_at: string;
}

export interface LearningOverviewSummary {
  selected_career: string;
  goal_source: string;
  goal_selected_at: string;
  current_skill_level?: string;
  skill_gap_summary?: string;
  overall_progress_percentage: number;
  current_stage_title: string;
  current_topic_title?: string;
  current_focus_skill: string;
  next_action?: string;
  top_skill_gaps: SkillGapItem[];
  today_plan: DailyLearningPlan;
  weekly_plan: WeeklyLearningPlan;
  estimated_total_weeks: number;
  estimated_workload_hours?: number;
  daily_pace_hours: number;
  total_skills_count: number;
  mastered_skills_count: number;
  in_progress_skills_count: number;
}

export interface StudentSkillProgressLog {
  id: string;
  user_id: string;
  role_title: string;
  target_skill: string;
  previous_status: EvidenceSkillStatus;
  new_status: EvidenceSkillStatus;
  trigger_event: 'INITIAL_DISCOVERY' | 'ASSESSMENT_COMPLETED' | 'TASK_COMPLETED' | 'CONTRADICTION_CALIBRATED' | 'GOAL_CHANGED';
  evidence_snapshot: string;
  created_at: string;
}

// ====================================================================
// PHASE 2.3 — LEARNING RESOURCE ENGINE TYPES
// ====================================================================

export type ResourceStatus =
  | 'DISCOVERED'
  | 'VALIDATED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'REPLACED'
  | 'ARCHIVED';

export type StudentResourceState =
  | 'SUGGESTED'
  | 'SELECTED'
  | 'PRIMARY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'REPLACED';

export type TopicLearningResourceType =
  | 'youtube'
  | 'official_doc'
  | 'course'
  | 'tutorial'
  | 'book'
  | 'article'
  | 'practice_platform';

export type ResourceRelevance = 'High' | 'Moderate' | 'Limited' | 'General';
export type ResourceDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ResourceCoverage = 'Comprehensive' | 'Targeted' | 'Overview';

export interface TopicLearningResource {
  resource_id: string;
  topic_id: string;
  topic_title?: string;
  type: TopicLearningResourceType;
  title: string;
  description: string;
  url: string;
  thumbnail_url?: string;
  provider: string;
  author_channel: string;
  author?: string;
  channel?: string;
  content_scope?: string;
  duration: string;
  duration_seconds?: number;
  published_at?: string;
  discovered_at: string;
  source_metadata: Record<string, any>;
  quality_signals: string[];
  relevance: ResourceRelevance;
  difficulty: ResourceDifficulty;
  coverage: ResourceCoverage;
  status: ResourceStatus;
  student_state?: StudentResourceState;
  rank_tier: 'Top Pick' | 'Recommended' | 'Supplementary' | 'Alternative';
  rank_score?: number;
  rank_rationale?: string;
}

export interface ResourceResearchRun {
  run_id: string;
  topic_id: string;
  topic_title: string;
  target_role: string;
  provider_used: 'YOUTUBE_API' | 'VERIFIED_CATALOG' | 'HYBRID';
  api_configured: boolean;
  is_cached: boolean;
  retrieved_at: string;
  resources_count: number;
  results: TopicLearningResource[];
  status_message?: string;
  has_verified_resources?: boolean;
}
