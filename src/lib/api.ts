import {
  AdaptiveEngineState,
  CareerDiscoverySession,
  CareerGoalRecord,
  CareerRoleResearch,
  RawAnswerItem,
  RecommendationItem,
  RejectionPayload,
  StudentCareerProfile,
} from '../types/career.ts';

const USER_ID_KEY = 'careeros_user_id';

export function getCurrentUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `student-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-user-id', getCurrentUserId());

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  getHealth: () => request<{ status: string; config: any }>('/api/health'),

  // Adaptive Discovery Endpoints
  startAdaptiveSession: (mode: CareerDiscoverySession['mode'], initialInput?: string, compareRoles?: string[]) =>
    request<{ session: CareerDiscoverySession; state: AdaptiveEngineState }>('/api/career-discovery/adaptive/start', {
      method: 'POST',
      body: JSON.stringify({ mode, initial_input: initialInput, compare_roles: compareRoles }),
    }),

  answerAdaptiveQuestion: (sessionId: string, questionId: string, answerValue: any, questionText?: string) =>
    request<{
      state: AdaptiveEngineState;
      is_sufficient: boolean;
      recommendations: RecommendationItem[];
      profile: StudentCareerProfile | null;
    }>('/api/career-discovery/adaptive/answer', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        answer_value: answerValue,
        question_text: questionText,
      }),
    }),

  getAdaptiveState: (sessionId: string) =>
    request<{
      state: AdaptiveEngineState;
      answers: RawAnswerItem[];
      recommendations: RecommendationItem[];
    }>(`/api/career-discovery/adaptive/state/${sessionId}`),

  createSession: (mode: CareerDiscoverySession['mode'], initialInput?: string, compareRoles?: string[]) =>
    request<{ session: CareerDiscoverySession }>('/api/career-discovery/session', {
      method: 'POST',
      body: JSON.stringify({ mode, initial_input: initialInput, compare_roles: compareRoles }),
    }),

  getSession: (sessionId: string) =>
    request<{

      session: CareerDiscoverySession;
      answers: RawAnswerItem[];
      profile: StudentCareerProfile | null;
      recommendations: RecommendationItem[];
    }>(`/api/career-discovery/session/${sessionId}`),

  saveAnswers: (sessionId: string, answers: RawAnswerItem[]) =>
    request<{ success: boolean; count: number }>('/api/career-discovery/answers', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, answers }),
    }),

  generateProfile: (sessionId: string) =>
    request<{ profile: StudentCareerProfile }>('/api/career-discovery/profile', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  generateCandidates: (sessionId: string) =>
    request<{ recommendations: RecommendationItem[]; candidate_titles: string[] }>(
      '/api/career-discovery/candidates',
      {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }
    ),

  researchRole: (roleTitle: string) =>
    request<{ research: CareerRoleResearch }>('/api/career-discovery/research', {
      method: 'POST',
      body: JSON.stringify({ role_title: roleTitle }),
    }),

  compareRoles: (roleTitles: string[], sessionId?: string) =>
    request<{ comparison: any }>('/api/career-discovery/compare', {
      method: 'POST',
      body: JSON.stringify({ role_titles: roleTitles, session_id: sessionId }),
    }),

  getRecommendations: (sessionId: string) =>
    request<{ recommendations: RecommendationItem[] }>(`/api/career-discovery/recommendations?session_id=${sessionId}`),

  getCareerDetail: (careerSlugOrId: string) =>
    request<{ research: CareerRoleResearch }>(`/api/career-discovery/career/${careerSlugOrId}`),

  rejectRecommendation: (sessionId: string, payload: RejectionPayload) =>
    request<{ success: boolean; message: string; recommendations?: RecommendationItem[] }>(
      `/api/career-discovery/recommendations/${payload.recommendation_id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          role_title: payload.role_title,
          reason_category: payload.reason_category,
          notes: payload.notes,
        }),
      }
    ),

  saveGoal: (sessionId: string, targetRole: string, goalSource: CareerGoalRecord['goal_source'], rationale?: string) =>
    request<{ success: boolean; goal: CareerGoalRecord; message: string }>('/api/career-discovery/goal', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        target_role: targetRole,
        goal_source: goalSource,
        rationale_snapshot: rationale,
      }),
    }),

  getActiveGoal: () => request<{ goal: CareerGoalRecord | null }>('/api/career-discovery/goal'),

  // --- PHASE 2: LEARNING ENGINE ---
  getLearningCareer: () =>
    request<{ has_goal: boolean; goal: CareerGoalRecord | null; message?: string }>('/api/learning/career'),

  getSkillMap: () =>
    request<{ skillMap: import('../types/learning.ts').CareerSkillMap }>('/api/learning/skill-map'),

  getSkillGaps: () =>
    request<{
      gaps: import('../types/learning.ts').SkillGapItem[];
      studentSkills: import('../types/learning.ts').StudentSkillState[];
    }>('/api/learning/skill-gaps'),

  generateRoadmap: (options?: {
    available_hours_per_day?: number;
    days_per_week?: number;
    learning_preference?: string;
  }) =>
    request<{
      roadmap: import('../types/learning.ts').LearningRoadmap;
      gaps: import('../types/learning.ts').SkillGapItem[];
    }>('/api/learning/roadmap/generate', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),

  getRoadmap: () =>
    request<{ roadmap: import('../types/learning.ts').LearningRoadmap }>('/api/learning/roadmap'),

  getTodayPlan: () =>
    request<{ todayPlan: import('../types/learning.ts').DailyLearningPlan }>('/api/learning/today'),

  getWeeklyPlan: () =>
    request<{ weeklyPlan: import('../types/learning.ts').WeeklyLearningPlan }>('/api/learning/week'),

  completeLearningTask: (taskId: string) =>
    request<{
      success: boolean;
      completedTask: import('../types/learning.ts').LearningTask;
      overall_progress_percentage: number;
      roadmap: import('../types/learning.ts').LearningRoadmap;
    }>(`/api/learning/tasks/${taskId}/complete`, { method: 'POST' }),

  reopenLearningTask: (taskId: string) =>
    request<{
      success: boolean;
      task: import('../types/learning.ts').LearningTask;
      overall_progress_percentage: number;
      roadmap: import('../types/learning.ts').LearningRoadmap;
    }>(`/api/learning/tasks/${taskId}/reopen`, { method: 'POST' }),

  skipLearningTask: (taskId: string) =>
    request<{
      success: boolean;
      skippedTask: import('../types/learning.ts').LearningTask;
      overall_progress_percentage: number;
      roadmap: import('../types/learning.ts').LearningRoadmap;
    }>(`/api/learning/tasks/${taskId}/skip`, { method: 'POST' }),

  startSkillAssessment: (skillName: string, roleTitle: string) =>
    request<{ assessment: import('../types/learning.ts').SkillAssessment }>('/api/learning/skill-assessment/start', {
      method: 'POST',
      body: JSON.stringify({ skill_name: skillName, role_title: roleTitle }),
    }),

  submitSkillAssessment: (skillName: string, roleTitle: string, answers: Record<string, number>) =>
    request<{
      result: import('../types/learning.ts').SkillAssessmentResult;
      updated_proficiency: import('../types/learning.ts').SkillProficiency;
      roadmap?: import('../types/learning.ts').LearningRoadmap;
    }>('/api/learning/skill-assessment/submit', {
      method: 'POST',
      body: JSON.stringify({ skill_name: skillName, role_title: roleTitle, answers }),
    }),

  updateTimePreferences: (availableHoursPerDay: number, daysPerWeek: number) =>
    request<{
      success: boolean;
      roadmap: import('../types/learning.ts').LearningRoadmap;
      estimated_total_weeks: number;
      pace_description: string;
    }>('/api/learning/preferences/time', {
      method: 'POST',
      body: JSON.stringify({
        available_hours_per_day: availableHoursPerDay,
        days_per_week: daysPerWeek,
      }),
    }),

  getVerifiedResources: () =>
    request<{ resources: import('../types/learning.ts').VerifiedResource[] }>('/api/learning/resources'),

  getLearningOverview: () =>
    request<{
      has_goal: boolean;
      summary: import('../types/learning.ts').LearningOverviewSummary | null;
      roadmap?: import('../types/learning.ts').LearningRoadmap;
      gaps?: import('../types/learning.ts').SkillGapItem[];
      skillMap?: import('../types/learning.ts').CareerSkillMap;
    }>('/api/learning/overview'),

  // --- PHASE 2.1: CAREER REQUIREMENT RESEARCH ENGINE ---
  getCareerRequirements: (role?: string) =>
    request<{
      has_goal: boolean;
      overview: import('../types/requirements.ts').CareerRequirementsOverview | null;
      message?: string;
    }>(`/api/learning/requirements${role ? `?role=${encodeURIComponent(role)}` : ''}`),

  runCareerRequirements: (roleTitle?: string, forceRefresh?: boolean) =>
    request<{
      success: boolean;
      status: import('../types/requirements.ts').ResearchRunStatus;
      overview: import('../types/requirements.ts').CareerRequirementsOverview;
    }>('/api/learning/requirements/run', {
      method: 'POST',
      body: JSON.stringify({ role_title: roleTitle, force_refresh: forceRefresh }),
    }),

  getRequirementsRuns: () =>
    request<{ runs: import('../types/requirements.ts').CareerResearchRun[] }>('/api/learning/requirements/runs'),

  // --- PHASE 2.3: LEARNING RESOURCE ENGINE ---
  getTopicLearningResources: (topicId?: string, topicTitle?: string, targetRole?: string, forceRefresh?: boolean) =>
    request<{
      run: import('../types/learning.ts').ResourceResearchRun;
      resources: import('../types/learning.ts').TopicLearningResource[];
      config: {
        youtube_configured: boolean;
        status_message: string;
      };
    }>(
      `/api/learning/resources/topic?${new URLSearchParams({
        ...(topicId ? { topic_id: topicId } : {}),
        ...(topicTitle ? { topic_title: topicTitle } : {}),
        ...(targetRole ? { target_role: targetRole } : {}),
        ...(forceRefresh ? { force_refresh: 'true' } : {}),
      }).toString()}`
    ),

  updateStudentResourceState: (resourceId: string, topicId: string, state: import('../types/learning.ts').StudentResourceState) =>
    request<{
      success: boolean;
      resource_id: string;
      topic_id: string;
      state: import('../types/learning.ts').StudentResourceState;
    }>('/api/learning/resources/state', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId, topic_id: topicId, state }),
    }),

  updateResourceStatus: (resourceId: string, status: import('../types/learning.ts').ResourceStatus) =>
    request<{
      success: boolean;
      resource_id: string;
      status: import('../types/learning.ts').ResourceStatus;
      updated_in_catalog: boolean;
    }>('/api/learning/resources/status', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId, status }),
    }),

  getResourceRuns: () =>
    request<{ runs: import('../types/learning.ts').ResourceResearchRun[] }>('/api/learning/resources/runs'),

  getResourceEngineConfig: () =>
    request<{
      youtube: {
        configured: boolean;
        status: string;
        message: string;
      };
      status: string;
      has_api_key: boolean;
      active_mode: string;
      quota?: any;
    }>('/api/learning/resources/config'),

  getYouTubeStatus: () =>
    request<{
      status: string;
      configured: boolean;
      message: string;
      instructions: string;
      quota: {
        configured: boolean;
        status: string;
        quotaUnitsUsedToday: number;
        quotaBudget: number;
        quotaUnitsRemaining: number;
        cacheHitsCount: number;
        totalRequestsCount: number;
        cacheHitRate: string;
        lastResetDate: string;
        activeFingerprintsCount: number;
      };
    }>('/api/learning/resources/youtube-status'),

  checkYouTubeConnectivity: (topic?: string, role?: string) =>
    request<{
      success: boolean;
      status: string;
      message: string;
      sample_count: number;
      quota: any;
    }>('/api/learning/resources/youtube-check', {
      method: 'POST',
      body: JSON.stringify({ topic, role }),
    }),
};


