-- ====================================================================
-- CareerOS Phase 1 — Career Discovery Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ====================================================================

-- 1. career_discovery_sessions
CREATE TABLE IF NOT EXISTS career_discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('direct_goal', 'adaptive_discovery', 'compare_ideas')),
  status TEXT NOT NULL DEFAULT 'QUESTIONNAIRE' CHECK (status IN ('QUESTIONNAIRE', 'ANALYSIS', 'RESEARCH_READY', 'COMPLETED')),
  current_step INTEGER NOT NULL DEFAULT 1,
  initial_input TEXT,
  compare_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discovery sessions"
  ON career_discovery_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own discovery sessions"
  ON career_discovery_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovery sessions"
  ON career_discovery_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. career_discovery_answers
CREATE TABLE IF NOT EXISTS career_discovery_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  answer_value JSONB NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_discovery_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discovery answers"
  ON career_discovery_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery answers"
  ON career_discovery_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. career_profiles
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_data JSONB NOT NULL,
  inferred_confidence TEXT NOT NULL DEFAULT 'HIGH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career profiles"
  ON career_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update own career profiles"
  ON career_profiles FOR ALL
  USING (auth.uid() = user_id);

-- 4. career_roles (Global Knowledge Base)
CREATE TABLE IF NOT EXISTS career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  entry_barrier TEXT NOT NULL CHECK (entry_barrier IN ('Low', 'Moderate', 'High')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global career roles readable by all"
  ON career_roles FOR SELECT
  TO public
  USING (true);

-- 5. career_research (Global verified career role research)
CREATE TABLE IF NOT EXISTS career_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
  typical_responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  core_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  entry_level_expectations TEXT NOT NULL,
  current_market_signals TEXT NOT NULL,
  related_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  business_startup_relevance TEXT NOT NULL,
  last_researched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Career research readable by all"
  ON career_research FOR SELECT
  TO public
  USING (true);

-- 6. career_sources (Global verified occupational sources & citations)
CREATE TABLE IF NOT EXISTS career_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  evidence_excerpt TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('GOVERNMENT_LABOR', 'INDUSTRY_REPORT', 'EDUCATIONAL_STANDARDS', 'MARKET_ANALYSIS', 'OFFICIAL_OCCUPATIONAL')),
  validation_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (validation_status IN ('VERIFIED', 'UNCERTAIN', 'ESTIMATED'))
);

ALTER TABLE career_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Career sources readable by all"
  ON career_sources FOR SELECT
  TO public
  USING (true);

-- 7. career_recommendations (User Session Specific)
CREATE TABLE IF NOT EXISTS career_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_title TEXT NOT NULL,
  summary TEXT NOT NULL,
  profile_alignment TEXT NOT NULL CHECK (profile_alignment IN ('Strong', 'Moderate', 'Limited')),
  market_evidence_strength TEXT NOT NULL CHECK (market_evidence_strength IN ('Strong', 'Moderate', 'Limited')),
  entry_barrier TEXT NOT NULL CHECK (entry_barrier IN ('Low', 'Moderate', 'High')),
  why_recommended JSONB NOT NULL,
  research_snapshot JSONB NOT NULL,
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON career_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recommendations"
  ON career_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- 8. career_goals (Final Career Choice persisted)
CREATE TABLE IF NOT EXISTS career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_role TEXT NOT NULL,
  goal_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (goal_status IN ('ACTIVE', 'ARCHIVED', 'PAUSED')),
  goal_selected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  goal_source TEXT NOT NULL CHECK (goal_source IN ('CAREER_DISCOVERY', 'DIRECT_CONFIRMATION', 'COMPARE_CHOICE')),
  rationale_snapshot TEXT
);

ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career goals"
  ON career_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career goals"
  ON career_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career goals"
  ON career_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. career_profile_signals (Internal adaptive reasoning signals)
CREATE TABLE IF NOT EXISTS career_profile_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  signals JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_profile_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile signals"
  ON career_profile_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile signals"
  ON career_profile_signals FOR ALL
  USING (auth.uid() = user_id);

-- 10. career_question_history (Tracks sequential adaptive questions asked & context)
CREATE TABLE IF NOT EXISTS career_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  question_text TEXT NOT NULL,
  context_note TEXT,
  answer_value JSONB,
  is_clarification BOOLEAN NOT NULL DEFAULT false,
  asked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  answered_at TIMESTAMPTZ
);

ALTER TABLE career_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question history"
  ON career_question_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own question history"
  ON career_question_history FOR ALL
  USING (auth.uid() = user_id);

-- 11. career_contradictions (Tracks detected contradictions and clarifications)
CREATE TABLE IF NOT EXISTS career_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dimension TEXT NOT NULL,
  earlier_statement TEXT NOT NULL,
  conflicting_statement TEXT NOT NULL,
  clarification_question TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_value TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE career_contradictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contradictions"
  ON career_contradictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contradictions"
  ON career_contradictions FOR ALL
  USING (auth.uid() = user_id);

-- 12. career_candidate_paths (Dynamic candidate ranking state during discovery)
CREATE TABLE IF NOT EXISTS career_candidate_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES career_discovery_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_sufficient BOOLEAN NOT NULL DEFAULT false,
  stopping_rationale TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_candidate_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own candidate paths"
  ON career_candidate_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own candidate paths"
  ON career_candidate_paths FOR ALL
  USING (auth.uid() = user_id);

-- ====================================================================
-- PHASE 2 — PERSONALIZED CAREER ROADMAP & LEARNING ENGINE
-- ====================================================================

-- 13. career_skill_maps (Global verified career skill maps per role)
CREATE TABLE IF NOT EXISTS career_skill_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  validated_evidence_source TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE career_skill_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skill maps readable by all" ON career_skill_maps FOR SELECT TO public USING (true);

-- 14. career_skills (Skills within career maps)
CREATE TABLE IF NOT EXISTS career_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES career_skill_maps(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Core Skill', 'Supporting Skill', 'Tool', 'Concept', 'Domain Knowledge', 'Professional Skill')),
  importance TEXT NOT NULL CHECK (importance IN ('Critical', 'Important', 'Useful', 'Optional')),
  expected_proficiency TEXT NOT NULL CHECK (expected_proficiency IN ('Not Assessed', 'Beginner', 'Foundational', 'Intermediate', 'Advanced', 'Strong')),
  why_matters TEXT NOT NULL,
  career_relevance TEXT NOT NULL,
  suggested_evidence TEXT NOT NULL,
  UNIQUE(role_title, name)
);

ALTER TABLE career_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Career skills readable by all" ON career_skills FOR SELECT TO public USING (true);

-- 15. career_skill_dependencies (Skill prerequisites)
CREATE TABLE IF NOT EXISTS career_skill_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  required_skill_name TEXT NOT NULL,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('hard_prerequisite', 'recommended_before')),
  rationale TEXT NOT NULL
);

ALTER TABLE career_skill_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dependencies readable by all" ON career_skill_dependencies FOR SELECT TO public USING (true);

-- 16. student_skills (Student private skill assessment states)
CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  career_goal_id UUID REFERENCES career_goals(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT false,
  assessed_proficiency TEXT NOT NULL DEFAULT 'Not Assessed',
  demonstrated BOOLEAN NOT NULL DEFAULT false,
  learning_status TEXT NOT NULL DEFAULT 'not_started' CHECK (learning_status IN ('not_started', 'in_progress', 'completed', 'needs_review', 'blocked')),
  evidence_notes TEXT,
  last_assessed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, role_title, skill_name)
);

ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON student_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own skills" ON student_skills FOR ALL USING (auth.uid() = user_id);

-- 17. learning_roadmaps (Student personalized roadmap)
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  career_goal_id UUID NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  available_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  days_per_week INT NOT NULL DEFAULT 5,
  learning_preference TEXT NOT NULL DEFAULT 'mixed',
  estimated_total_weeks NUMERIC(5,1) NOT NULL,
  pace_description TEXT NOT NULL,
  overall_progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  current_stage_title TEXT,
  current_focus_skill TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, career_goal_id)
);

ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roadmap" ON learning_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own roadmap" ON learning_roadmaps FOR ALL USING (auth.uid() = user_id);

-- 18. learning_tasks (Daily actionable learning tasks)
CREATE TABLE IF NOT EXISTS learning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stage_title TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  estimated_minutes INT NOT NULL DEFAULT 30,
  priority TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review', 'blocked')),
  completion_criteria TEXT NOT NULL,
  is_remediation BOOLEAN NOT NULL DEFAULT false,
  remediation_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE learning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON learning_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON learning_tasks FOR ALL USING (auth.uid() = user_id);

-- 19. learning_resources (Global verified learning resources)
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('official_doc', 'video', 'course', 'book', 'article', 'practice_platform', 'tutorial')),
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'practice', 'alternative')),
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_free BOOLEAN NOT NULL DEFAULT true,
  why_recommended TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'UNCERTAIN', 'ESTIMATED')),
  retrieved_date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources readable by all" ON learning_resources FOR SELECT TO public USING (true);

-- 20. skill_assessment_results (Student knowledge check results)
CREATE TABLE IF NOT EXISTS skill_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  score_percentage INT NOT NULL,
  passed BOOLEAN NOT NULL,
  assessed_proficiency TEXT NOT NULL,
  weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_action TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE skill_assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessments" ON skill_assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own assessments" ON skill_assessment_results FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- PHASE 2.1 — CAREER REQUIREMENT RESEARCH ENGINE
-- ====================================================================

-- 21. career_research_runs (Traceable occupational requirement research runs)
CREATE TABLE IF NOT EXISTS career_research_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  career_goal_id TEXT,
  target_role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL')),
  what_career_involves TEXT NOT NULL DEFAULT '',
  typical_work_summary TEXT NOT NULL DEFAULT '',
  entry_level_expectations TEXT NOT NULL DEFAULT '',
  evidence_proof_expectations TEXT NOT NULL DEFAULT '',
  research_freshness TEXT NOT NULL DEFAULT '',
  error_message TEXT,
  is_cached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

ALTER TABLE career_research_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own research runs" ON career_research_runs FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own research runs" ON career_research_runs FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- 22. career_research_sources (Sources & citations attached to research runs)
CREATE TABLE IF NOT EXISTS career_research_sources (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES career_research_runs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  target_role TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  source_type TEXT NOT NULL,
  evidence_excerpt TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (validation_status IN ('VERIFIED', 'ESTIMATED', 'UNCERTAIN'))
);

ALTER TABLE career_research_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own research sources" ON career_research_sources FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own research sources" ON career_research_sources FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- 23. career_requirements (Structured requirements synthesized and validated)
CREATE TABLE IF NOT EXISTS career_requirements (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES career_research_runs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  target_role TEXT NOT NULL,
  skill_or_topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FOUNDATIONAL', 'CORE', 'SUPPORTING', 'SPECIALIZED')),
  skill_type TEXT NOT NULL CHECK (skill_type IN ('Knowledge', 'Skill', 'Tool/Technology', 'Professional Practice')),
  description TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('Strong', 'Moderate', 'Limited', 'Unknown')),
  prerequisite_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_expectation TEXT NOT NULL,
  typical_work_application TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_publisher TEXT NOT NULL,
  source_date TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  confidence TEXT NOT NULL CHECK (confidence IN ('Strong', 'Moderate', 'Limited', 'Unknown')),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('VERIFIED', 'ESTIMATED', 'UNCERTAIN'))
);

ALTER TABLE career_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own career requirements" ON career_requirements FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own career requirements" ON career_requirements FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- ====================================================================
-- PHASE 2.2 — DETERMINISTIC SKILL-PROGRESS & COMPETENCY ROADMAP
-- ====================================================================

-- 24. student_skill_progress (Deterministic audit log of skill status changes)
CREATE TABLE IF NOT EXISTS student_skill_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_title TEXT NOT NULL,
  target_skill TEXT NOT NULL,
  previous_status TEXT NOT NULL CHECK (previous_status IN ('UNKNOWN', 'NOT_STARTED', 'BEGINNER', 'DEVELOPING', 'PRACTICAL', 'STRONG')),
  new_status TEXT NOT NULL CHECK (new_status IN ('UNKNOWN', 'NOT_STARTED', 'BEGINNER', 'DEVELOPING', 'PRACTICAL', 'STRONG')),
  trigger_event TEXT NOT NULL,
  evidence_snapshot TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_skill_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skill progress" ON student_skill_progress FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own skill progress" ON student_skill_progress FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- 25. skill_assessments (Registry of diagnostic assessment checks)
CREATE TABLE IF NOT EXISTS skill_assessments (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  pass_threshold_percentage INT NOT NULL DEFAULT 60,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skill assessments readable by all" ON skill_assessments FOR SELECT TO public USING (true);

-- 26. learning_stages (Competency stages within student roadmap)
CREATE TABLE IF NOT EXISTS learning_stages (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  skills_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_hours NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE learning_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning stages" ON learning_stages FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own learning stages" ON learning_stages FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- 27. learning_topics (Competency topics within stages)
CREATE TABLE IF NOT EXISTS learning_topics (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  roadmap_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  target_skill TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  prerequisite JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_learning_effort TEXT NOT NULL,
  estimated_minutes INT NOT NULL DEFAULT 45,
  practice_requirement TEXT NOT NULL,
  completion_criteria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning topics" ON learning_topics FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own learning topics" ON learning_topics FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- ====================================================================
-- PHASE 2.3 — LEARNING RESOURCE ENGINE
-- ====================================================================

-- 28. resource_research_runs (Traceable resource discovery runs)
CREATE TABLE IF NOT EXISTS resource_research_runs (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  provider_used TEXT NOT NULL CHECK (provider_used IN ('YOUTUBE_API', 'VERIFIED_CATALOG', 'HYBRID')),
  api_configured BOOLEAN NOT NULL DEFAULT false,
  is_cached BOOLEAN NOT NULL DEFAULT false,
  resources_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE resource_research_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resource runs readable by all" ON resource_research_runs FOR SELECT TO public USING (true);
CREATE POLICY "Resource runs insertable by all" ON resource_research_runs FOR INSERT TO public WITH CHECK (true);

-- 29. topic_learning_resources (Validated learning resources)
CREATE TABLE IF NOT EXISTS topic_learning_resources (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES resource_research_runs(id) ON DELETE SET NULL,
  topic_id TEXT NOT NULL,
  topic_title TEXT,
  type TEXT NOT NULL CHECK (type IN ('youtube', 'official_doc', 'course', 'tutorial', 'book', 'article', 'practice_platform')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  provider TEXT NOT NULL,
  author_channel TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '',
  duration_seconds INT,
  published_at TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  relevance TEXT NOT NULL CHECK (relevance IN ('High', 'Moderate', 'Limited', 'General')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  coverage TEXT NOT NULL CHECK (coverage IN ('Comprehensive', 'Targeted', 'Overview')),
  status TEXT NOT NULL CHECK (status IN ('DISCOVERED', 'VALIDATED', 'AVAILABLE', 'UNAVAILABLE', 'REPLACED', 'ARCHIVED')),
  rank_tier TEXT NOT NULL DEFAULT 'Recommended' CHECK (rank_tier IN ('Top Pick', 'Recommended', 'Supplementary', 'Alternative')),
  rank_score INT NOT NULL DEFAULT 0,
  rank_rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE topic_learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topic resources readable by all" ON topic_learning_resources FOR SELECT TO public USING (true);
CREATE POLICY "Topic resources insertable by all" ON topic_learning_resources FOR ALL TO public USING (true);

-- 30. student_resource_states (Student state tracking: suggested, selected, primary, etc.)
CREATE TABLE IF NOT EXISTS student_resource_states (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('SUGGESTED', 'SELECTED', 'PRIMARY', 'COMPLETED', 'REJECTED', 'REPLACED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, resource_id)
);

ALTER TABLE student_resource_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own resource states" ON student_resource_states FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can manage own resource states" ON student_resource_states FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NULL);




