/**
 * CareerOS Phase 2.1 — Career Requirement Research Engine Types
 * Grounded occupational research, evidence expectations, and transparent qualitative classifications.
 */

export type RequirementCategory =
  | 'FOUNDATIONAL'
  | 'CORE'
  | 'SUPPORTING'
  | 'SPECIALIZED';

export type RequirementImportance =
  | 'Strong'
  | 'Moderate'
  | 'Limited'
  | 'Unknown';

export type RequirementConfidence =
  | 'Strong'
  | 'Moderate'
  | 'Limited'
  | 'Unknown';

export type RequirementValidationStatus =
  | 'VERIFIED'
  | 'ESTIMATED'
  | 'UNCERTAIN';

export type RequirementSkillType =
  | 'Knowledge'
  | 'Skill'
  | 'Tool/Technology'
  | 'Professional Practice';

export interface CareerRequirementItem {
  id: string;
  skill_or_topic: string;
  category: RequirementCategory;
  skill_type: RequirementSkillType;
  description: string;
  importance: RequirementImportance;
  prerequisite_skills: string[];
  evidence_expectation: string;
  typical_work_application: string;
  source: string;
  source_url: string;
  source_publisher: string;
  source_date: string | null;
  retrieved_at: string;
  confidence: RequirementConfidence;
  validation_status: RequirementValidationStatus;
}

export interface ResearchSourceItem {
  id: string;
  title: string;
  publisher: string;
  url: string;
  published_at: string | null;
  retrieved_at: string;
  source_type: string;
  evidence_excerpt: string;
  validation_status: RequirementValidationStatus;
}

export type ResearchRunStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface CareerResearchRun {
  id: string;
  user_id: string;
  career_goal_id: string | null;
  target_role: string;
  status: ResearchRunStatus;
  what_career_involves: string;
  typical_work_summary: string;
  entry_level_expectations: string;
  evidence_proof_expectations: string;
  research_freshness: string;
  requirements: CareerRequirementItem[];
  sources: ResearchSourceItem[];
  error_message?: string | null;
  is_cached?: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface SkillDependencyEdge {
  skill: string;
  requires: string[];
  category: RequirementCategory;
  rationale?: string;
}

export interface CareerRequirementsOverview {
  target_role: string;
  run: CareerResearchRun;
  foundational_requirements: CareerRequirementItem[];
  core_requirements: CareerRequirementItem[];
  supporting_requirements: CareerRequirementItem[];
  specialized_requirements: CareerRequirementItem[];
  tools_and_technologies: CareerRequirementItem[];
  skill_dependencies: SkillDependencyEdge[];
}
