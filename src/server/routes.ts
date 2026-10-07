import express, { Request, Response } from 'express';
import { getSystemConfigStatus } from './config.ts';
import { storageService } from './services/storageService.ts';
import { profileService } from './services/profileService.ts';
import { candidateService } from './services/candidateService.ts';
import { defaultResearchProvider } from './research/ResearchProvider.ts';
import { comparisonService } from './services/comparisonService.ts';
import { adaptiveEngine } from './services/adaptiveEngine.ts';
import { RawAnswerItem, RejectionPayload } from '../types/career.ts';
import { learningRouter } from './learningRoutes.ts';

export const apiRouter = express.Router();

// Mount Phase 2 Learning Engine routes
apiRouter.use('/learning', learningRouter);


// Helper to resolve user ID from request headers or default student ID
function getRequestUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  if (headerUser && typeof headerUser === 'string') {
    return headerUser.trim();
  }
  return 'student-default-user';
}

/**
 * Health check & developer configuration status
 * Never reveals secret values.
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  const status = getSystemConfigStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: status,
  });
});

/**
 * POST /api/career-discovery/session
 * Starts a new session or restores an existing one
 */
apiRouter.post('/career-discovery/session', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { mode, initial_input, compare_roles } = req.body;

    if (!mode || !['direct_goal', 'adaptive_discovery', 'compare_ideas'].includes(mode)) {
      res.status(400).json({ error: 'Valid mode is required: direct_goal, adaptive_discovery, or compare_ideas' });
      return;
    }

    const session = await storageService.createSession(userId, mode, initial_input, compare_roles);
    res.json({ session });
  } catch (err: any) {
    console.error('Session error:', err);
    res.status(500).json({ error: err.message || 'Failed to create discovery session' });
  }
});

/**
 * POST /api/career-discovery/adaptive/start
 * Initializes adaptive conversation engine for the session
 */
apiRouter.post('/career-discovery/adaptive/start', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { mode, initial_input, compare_roles } = req.body;

    const session = await storageService.createSession(userId, mode || 'adaptive_discovery', initial_input, compare_roles);
    const state = adaptiveEngine.initializeState(session.id, session.mode, initial_input, compare_roles);
    await storageService.saveAdaptiveState(session.id, userId, state);

    res.json({ session, state });
  } catch (err: any) {
    console.error('Adaptive start error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/adaptive/answer
 * Ingests single answer, updates signals, checks contradictions, and returns next best question or sufficiency
 */
apiRouter.post('/career-discovery/adaptive/answer', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, question_id, answer_value, question_text } = req.body;

    if (!session_id || !question_id || answer_value === undefined) {
      res.status(400).json({ error: 'session_id, question_id, and answer_value are required' });
      return;
    }

    // 1. Fetch current session and raw answers
    let rawAnswers = await storageService.getAnswers(session_id, userId);
    const newAnswerItem: RawAnswerItem = {
      question_id,
      question_text: question_text || question_id,
      category: 'adaptive',
      answer_value,
      answered_at: new Date().toISOString(),
    };
    rawAnswers = [...rawAnswers, newAnswerItem];
    await storageService.saveAnswers(session_id, userId, rawAnswers);

    // 2. Fetch current adaptive state (or initialize if not yet saved)
    let state = await storageService.getAdaptiveState(session_id);
    if (!state) {
      const session = await storageService.getSession(session_id, userId);
      state = adaptiveEngine.initializeState(session_id, session?.mode || 'adaptive_discovery', session?.initial_input, session?.compare_roles);
    }

    // 3. Process answer in Adaptive Engine
    const updatedState = await adaptiveEngine.processAnswer(state, question_id, answer_value, rawAnswers);
    await storageService.saveAdaptiveState(session_id, userId, updatedState);

    // 4. If sufficiency is reached: generate profile and build recommendations
    let recommendations: any[] = [];
    let profile: any = null;

    if (updatedState.is_sufficient) {
      profile = await profileService.interpretProfile(rawAnswers);
      await storageService.saveProfile(session_id, userId, profile);

      const candidateTitles = updatedState.candidate_signals.slice(0, 4).map((c) => c.role_title);
      const rejections = await storageService.getRejections(session_id);
      recommendations = await candidateService.buildRecommendations(profile, candidateTitles, rejections);
      await storageService.saveRecommendations(session_id, userId, recommendations);
      await storageService.updateSessionStatus(session_id, 'RESEARCH_READY', 3);
    }

    res.json({
      state: updatedState,
      is_sufficient: updatedState.is_sufficient,
      recommendations,
      profile,
    });
  } catch (err: any) {
    console.error('Adaptive answer error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/career-discovery/adaptive/state/:sessionId
 */
apiRouter.get('/career-discovery/adaptive/state/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const state = await storageService.getAdaptiveState(req.params.sessionId);
    if (!state) {
      res.status(404).json({ error: 'Adaptive state not found' });
      return;
    }
    const answers = await storageService.getAnswers(req.params.sessionId, userId);
    const recommendations = await storageService.getRecommendations(req.params.sessionId, userId);
    res.json({ state, answers, recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/career-discovery/session/:id

 */
apiRouter.get('/career-discovery/session/:id', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const session = await storageService.getSession(req.params.id, userId);
    if (!session) {
      res.status(404).json({ error: 'Discovery session not found' });
      return;
    }

    const answers = await storageService.getAnswers(session.id, userId);
    const profile = await storageService.getProfile(session.id, userId);
    const recommendations = await storageService.getRecommendations(session.id, userId);

    res.json({ session, answers, profile, recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/answers
 * Saves raw questionnaire answers
 */
apiRouter.post('/career-discovery/answers', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, answers } = req.body;

    if (!session_id || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: 'session_id and non-empty answers array are required' });
      return;
    }

    const validAnswers: RawAnswerItem[] = answers.map((a: any) => ({
      question_id: String(a.question_id || 'q_general'),
      question_text: String(a.question_text || ''),
      category: String(a.category || 'general'),
      answer_value: a.answer_value,
      answered_at: a.answered_at || new Date().toISOString(),
    }));

    await storageService.saveAnswers(session_id, userId, validAnswers);
    await storageService.updateSessionStatus(session_id, 'ANALYSIS', 2);

    res.json({ success: true, count: validAnswers.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/profile
 * Interprets raw answers into structured Student Career Profile
 */
apiRouter.post('/career-discovery/profile', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id } = req.body;

    if (!session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    const rawAnswers = await storageService.getAnswers(session_id, userId);
    if (rawAnswers.length === 0) {
      res.status(400).json({ error: 'No answers found for this session. Complete questionnaire first.' });
      return;
    }

    const profile = await profileService.interpretProfile(rawAnswers);
    await storageService.saveProfile(session_id, userId, profile);

    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/survey
 * Direct survey profile ingestion and seeding
 */
apiRouter.post('/career-discovery/survey', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, answers, profile } = req.body;
    if (!session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }
    const resolvedProfile = profile || {
      interests: answers?.interests || [],
      work_preferences: answers?.work_preferences || [],
      coding_preference: answers?.coding_preference || 'practical_coding',
      math_interest: answers?.math_interest || 'practical_applied_math',
      problem_solving_preference: answers?.problem_solving_preference || 'analytical_logical',
      creativity_preference: answers?.creativity_preference || 'moderate',
      business_interest: answers?.business_interest || 'moderate',
      research_interest: answers?.research_interest || 'applied_industry',
      entrepreneurship_interest: answers?.entrepreneurship_interest || 'prefers_established_orgs',
      earning_importance: answers?.earning_importance || 'balanced',
      job_opportunity_importance: answers?.job_opportunity_importance || 'balanced',
      stability_preference: answers?.stability_preference || 'balanced',
      remote_preference: answers?.remote_preference || 'flexible',
      available_time_hours: answers?.weekly_hours || 10,
      experience_level: answers?.experience_level || 'beginner_student',
      education_background: answers?.education_background || 'General',
      industry_interests: answers?.industry_interests || [],
      inferred_confidence: 'HIGH' as const,
      tools_used: answers?.tools_used || [],
      previous_projects: answers?.previous_projects || '',
    };
    await storageService.saveProfile(session_id, userId, resolvedProfile);
    res.json({ success: true, profile: resolvedProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/candidates
 * Pipeline: Profile -> Candidates -> Research -> Validation -> Recommendations
 */
apiRouter.post('/career-discovery/candidates', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id } = req.body;

    if (!session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    let profile = await storageService.getProfile(session_id, userId);
    if (!profile) {
      const answers = await storageService.getAnswers(session_id, userId);
      profile = await profileService.interpretProfile(answers);
      await storageService.saveProfile(session_id, userId, profile);
    }

    const rejections = await storageService.getRejections(session_id);
    const candidateTitles = await candidateService.generateCandidateTitles(profile, rejections);
    const recommendations = await candidateService.buildRecommendations(profile, candidateTitles, rejections);

    await storageService.saveRecommendations(session_id, userId, recommendations);
    await storageService.updateSessionStatus(session_id, 'RESEARCH_READY', 3);

    res.json({ recommendations, candidate_titles: candidateTitles });
  } catch (err: any) {
    console.error('Candidate pipeline error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/research
 * Researches any single role title using the provider abstraction
 */
apiRouter.post('/career-discovery/research', async (req: Request, res: Response) => {
  try {
    const { role_title } = req.body;
    if (!role_title || typeof role_title !== 'string') {
      res.status(400).json({ error: 'role_title string is required' });
      return;
    }

    const research = await defaultResearchProvider.researchRole(role_title.trim());
    res.json({ research });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/compare
 * Transparent qualitative comparison across 2-5 roles
 */
apiRouter.post('/career-discovery/compare', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, role_titles } = req.body;

    if (!Array.isArray(role_titles) || role_titles.length < 2 || role_titles.length > 5) {
      res.status(400).json({ error: 'role_titles must be an array of 2 to 5 career titles' });
      return;
    }

    const existingRecs = session_id ? await storageService.getRecommendations(session_id, userId) : [];
    const comparison = await comparisonService.compareRoles(role_titles, existingRecs);

    res.json({ comparison });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/career-discovery/recommendations
 */
apiRouter.get('/career-discovery/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      res.status(400).json({ error: 'session_id query parameter is required' });
      return;
    }

    const recommendations = await storageService.getRecommendations(sessionId, userId);
    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/career-discovery/career/:id
 */
apiRouter.get('/career-discovery/career/:id', async (req: Request, res: Response) => {
  try {
    const roleTitle = req.params.id.replace(/-/g, ' ');
    const research = await defaultResearchProvider.researchRole(roleTitle);
    res.json({ research });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/recommendations/:id/reject
 * Records rejection feedback reason and refines recommendations
 */
apiRouter.post('/career-discovery/recommendations/:id/reject', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, role_title, reason_category, notes } = req.body;

    if (!session_id || !role_title || !reason_category) {
      res.status(400).json({ error: 'session_id, role_title, and reason_category are required' });
      return;
    }

    const payload: RejectionPayload = {
      recommendation_id: req.params.id,
      role_title,
      reason_category,
      notes,
    };

    await storageService.recordRejection(session_id, userId, payload);

    // Regenerate replenished candidates
    const profile = await storageService.getProfile(session_id, userId);
    if (profile) {
      const allRejections = await storageService.getRejections(session_id);
      const newCandidateTitles = await candidateService.generateCandidateTitles(profile, allRejections);
      const newRecommendations = await candidateService.buildRecommendations(profile, newCandidateTitles, allRejections);
      await storageService.saveRecommendations(session_id, userId, newRecommendations);

      res.json({
        success: true,
        message: 'Rejection feedback recorded. Recommendations updated without altering your raw profile answers.',
        recommendations: newRecommendations,
      });
      return;
    }

    res.json({ success: true, message: 'Rejection feedback recorded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/career-discovery/goal
 * Student makes the final career choice
 */
apiRouter.post('/career-discovery/goal', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { session_id, target_role, goal_source, rationale_snapshot } = req.body;

    if (!session_id || !target_role) {
      res.status(400).json({ error: 'session_id and target_role are required' });
      return;
    }

    const goal = await storageService.saveGoal(
      session_id,
      userId,
      target_role,
      goal_source || 'CAREER_DISCOVERY',
      rationale_snapshot
    );

    await storageService.updateSessionStatus(session_id, 'COMPLETED', 4);

    res.json({
      success: true,
      goal,
      message: `Final goal "${target_role}" saved as ACTIVE in database.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/career-discovery/goal
 * Retrieves active goal for user
 */
apiRouter.get('/career-discovery/goal', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);
    res.json({ goal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
