/**
 * CareerOS Phase 2 — Learning Engine API Routes
 * Production-ready Express endpoints with user isolation and error handling.
 */

import express, { Request, Response } from 'express';
import { storageService } from './services/storageService.ts';
import { learningStorageService } from './learning/learningStorageService.ts';
import { getCareerSkillMap } from './learning/careerSkillMaps.ts';
import { skillAssessmentService } from './learning/skillAssessmentService.ts';
import { skillGapEngine } from './learning/skillGapEngine.ts';
import { roadmapEngine } from './learning/roadmapEngine.ts';
import { competencyRoadmapEngine } from './learning/competencyRoadmapEngine.ts';
import { deterministicSkillProgressModel } from './learning/deterministicSkillProgressModel.ts';
import { dailyWeeklyPlanEngine } from './learning/dailyWeeklyPlanEngine.ts';
import { adaptiveRoadmapEngine } from './learning/adaptiveRoadmapEngine.ts';
import { VERIFIED_RESOURCE_CATALOG, findResourcesForTopic } from './learning/resourceCatalog.ts';
import { requirementsPipeline } from './requirements/requirementsPipeline.ts';
import { requirementsStorageService } from './requirements/requirementsStorageService.ts';
import { CareerRequirementsOverview, CareerResearchRun } from '../types/requirements.ts';
import { EvidenceSkillStatus, ResourceStatus, StudentResourceState } from '../types/learning.ts';
import { learningResourceEngine } from './learning/resourceEngine.ts';
import { youtubeClient } from './learning/youtubeClient.ts';
import { getSystemConfigStatus } from './config.ts';

export const learningRouter = express.Router();

function getRequestUserId(req: Request): string {
  const customId = req.headers['x-user-id'] as string;
  if (customId && customId.trim()) return customId.trim();
  return 'anonymous_student';
}

/**
 * GET /api/learning/career
 * Reads confirmed Phase 1 active career goal
 */
learningRouter.get('/career', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal || goal.goal_status !== 'ACTIVE') {
      res.json({
        has_goal: false,
        goal: null,
        message: 'Choose a career goal first.',
      });
      return;
    }

    res.json({
      has_goal: true,
      goal,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/skill-map
 * Retrieves structured Career Skill Map for the confirmed active goal
 */
learningRouter.get('/skill-map', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal) {
      res.status(400).json({ error: 'No active career goal. Choose a career goal first.' });
      return;
    }

    const skillMap = getCareerSkillMap(goal.target_role);
    res.json({ skillMap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/skill-gaps
 * Compares career skill requirements vs student current skill state
 */
learningRouter.get('/skill-gaps', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal) {
      res.status(400).json({ error: 'No active career goal. Choose a career goal first.' });
      return;
    }

    const skillMap = getCareerSkillMap(goal.target_role);
    const profile = await storageService.getProfile(goal.session_id, userId);
    let existingSkills = await learningStorageService.getStudentSkills(userId);
    const assessmentResults = await learningStorageService.getAssessmentResults(userId);

    // Evaluate skills using deterministic skill progress model
    const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
      skillMap,
      studentProfile: profile,
      existingSkills,
      assessmentResults,
    });

    // Sync studentSkills array with evaluatedSkills
    const studentSkills = evaluatedSkills.map((ev) => {
      const match = existingSkills.find(
        (s) => (s.target_skill || s.skill_name).toLowerCase() === ev.target_skill.toLowerCase()
      );
      return {
        skill_id: match?.skill_id || `skill-${ev.target_skill.toLowerCase().replace(/\s+/g, '-')}`,
        skill_name: ev.target_skill,
        category: (ev.category as any) || 'Core Skill',
        claimed: Boolean(match?.claimed),
        assessed_proficiency: (ev.current_status === 'STRONG' ? 'Strong' : ev.current_status === 'PRACTICAL' ? 'Intermediate' : ev.current_status === 'DEVELOPING' ? 'Foundational' : 'Beginner') as any,
        demonstrated: ev.current_status === 'PRACTICAL' || ev.current_status === 'STRONG',
        learning_status: (ev.visual_state === 'Completed' ? 'completed' : ev.visual_state === 'Blocked' ? 'blocked' : 'in_progress') as any,
        evidence_notes: ev.evidence,
        last_assessed_at: match?.last_assessed_at,
        target_skill: ev.target_skill,
        current_status: ev.current_status,
        evidence: ev.evidence,
        gap: ev.gap,
        prerequisites: ev.prerequisites,
        recommended_learning_topics: ev.recommended_learning_topics,
        recommended_practice: ev.recommended_practice,
        project_relevance: ev.project_relevance,
        visual_state: ev.visual_state,
      };
    });

    await learningStorageService.saveStudentSkills(userId, studentSkills, goal.target_role, goal.id);

    const gaps = skillGapEngine.analyzeGaps(skillMap, studentSkills, 2.0);
    res.json({ gaps, studentSkills, evaluatedSkills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/evaluated-skills
 * Directly returns Phase 2.2 evaluated skills
 */
learningRouter.get('/evaluated-skills', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal) {
      res.status(400).json({ error: 'No active career goal. Choose a career goal first.' });
      return;
    }

    const skillMap = getCareerSkillMap(goal.target_role);
    const profile = await storageService.getProfile(goal.session_id, userId);
    const existingSkills = await learningStorageService.getStudentSkills(userId);
    const assessmentResults = await learningStorageService.getAssessmentResults(userId);

    const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
      skillMap,
      studentProfile: profile,
      existingSkills,
      assessmentResults,
    });

    res.json({ targetRole: goal.target_role, evaluatedSkills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/roadmap/generate
 * Generates personalized dependency-aware learning roadmap
 */
learningRouter.post('/roadmap/generate', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal) {
      res.status(400).json({ error: 'No active career goal. Choose a career goal first.' });
      return;
    }

    const { available_hours_per_day, days_per_week, learning_preference } = req.body;

    const skillMap = getCareerSkillMap(goal.target_role);
    const profile = await storageService.getProfile(goal.session_id, userId);
    let existingSkills = await learningStorageService.getStudentSkills(userId);
    const assessmentResults = await learningStorageService.getAssessmentResults(userId);

    const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
      skillMap,
      studentProfile: profile,
      existingSkills,
      assessmentResults,
    });

    const hoursDaily = Number(available_hours_per_day) || 2.0;
    const daysWeekly = Number(days_per_week) || 5;
    const pref = learning_preference || 'mixed';

    const gaps = skillGapEngine.analyzeGaps(skillMap, existingSkills, hoursDaily);
    const roadmap = competencyRoadmapEngine.generateCompetencyRoadmap(
      userId,
      goal.id,
      goal.target_role,
      skillMap,
      evaluatedSkills,
      hoursDaily,
      daysWeekly,
      pref
    );

    await learningStorageService.saveRoadmap(userId, roadmap);

    res.json({ roadmap, gaps, evaluatedSkills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/roadmap
 * Retrieves student roadmap or auto-generates if not yet created (or if goal changed)
 */
learningRouter.get('/roadmap', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal) {
      res.status(400).json({ error: 'No active career goal. Choose a career goal first.' });
      return;
    }

    let roadmap = await learningStorageService.getRoadmap(userId);

    // If no roadmap OR if goal role has changed, re-generate dependency-aware roadmap
    if (!roadmap || roadmap.target_role.toLowerCase() !== goal.target_role.toLowerCase()) {
      const skillMap = getCareerSkillMap(goal.target_role);
      const profile = await storageService.getProfile(goal.session_id, userId);
      const existingSkills = await learningStorageService.getStudentSkills(userId);
      const assessmentResults = await learningStorageService.getAssessmentResults(userId);

      const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
        skillMap,
        studentProfile: profile,
        existingSkills,
        assessmentResults,
        changedCareerGoal: Boolean(roadmap && roadmap.target_role.toLowerCase() !== goal.target_role.toLowerCase()),
      });

      roadmap = competencyRoadmapEngine.generateCompetencyRoadmap(
        userId,
        goal.id,
        goal.target_role,
        skillMap,
        evaluatedSkills,
        roadmap?.available_hours_per_day || 2.0,
        roadmap?.days_per_week || 5,
        roadmap?.learning_preference || 'mixed'
      );
      await learningStorageService.saveRoadmap(userId, roadmap);
    }

    res.json({ roadmap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/today
 * Actionable daily learning plan answering: Where am I? Where am I going? What now? Why?
 */
learningRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    let roadmap = await learningStorageService.getRoadmap(userId);

    if (!roadmap) {
      const goal = await storageService.getActiveGoal(userId);
      if (!goal) {
        res.status(400).json({ error: 'No active career goal.' });
        return;
      }
      const skillMap = getCareerSkillMap(goal.target_role);
      let studentSkills = await learningStorageService.getStudentSkills(userId);
      if (studentSkills.length === 0) {
        const profile = await storageService.getProfile(goal.session_id, userId);
        studentSkills = skillAssessmentService.seedStudentSkillsFromProfile(skillMap.skills, profile);
        await learningStorageService.saveStudentSkills(userId, studentSkills, goal.target_role, goal.id);
      }
      const gaps = skillGapEngine.analyzeGaps(skillMap, studentSkills, 2.0);
      roadmap = roadmapEngine.generateRoadmap(userId, goal.id, skillMap, gaps, 2.0, 5, 'mixed');
      await learningStorageService.saveRoadmap(userId, roadmap);
    }

    const todayPlan = dailyWeeklyPlanEngine.generateDailyPlan(roadmap);
    res.json({ todayPlan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/week
 * Weekly learning plan
 */
learningRouter.get('/week', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const roadmap = await learningStorageService.getRoadmap(userId);

    if (!roadmap) {
      res.status(400).json({ error: 'Roadmap not found.' });
      return;
    }

    const weeklyPlan = dailyWeeklyPlanEngine.generateWeeklyPlan(roadmap, 1);
    res.json({ weeklyPlan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/tasks/:id/complete
 * Marks task completed and adapts roadmap progress deterministically
 */
learningRouter.post('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const taskId = req.params.id;
    const roadmap = await learningStorageService.getRoadmap(userId);

    if (!roadmap) {
      res.status(404).json({ error: 'Roadmap not found.' });
      return;
    }

    const { roadmap: updatedRoadmap, completedTask } = adaptiveRoadmapEngine.completeTask(roadmap, taskId);
    await learningStorageService.saveRoadmap(userId, updatedRoadmap);

    res.json({
      success: true,
      completedTask,
      overall_progress_percentage: updatedRoadmap.overall_progress_percentage,
      roadmap: updatedRoadmap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/tasks/:id/reopen
 * Reopens task
 */
learningRouter.post('/tasks/:id/reopen', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const taskId = req.params.id;
    const roadmap = await learningStorageService.getRoadmap(userId);

    if (!roadmap) {
      res.status(404).json({ error: 'Roadmap not found.' });
      return;
    }

    const { roadmap: updatedRoadmap, task } = adaptiveRoadmapEngine.reopenTask(roadmap, taskId);
    await learningStorageService.saveRoadmap(userId, updatedRoadmap);

    res.json({
      success: true,
      task,
      overall_progress_percentage: updatedRoadmap.overall_progress_percentage,
      roadmap: updatedRoadmap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/tasks/:id/skip
 * Skips task
 */
learningRouter.post('/tasks/:id/skip', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const taskId = req.params.id;
    const roadmap = await learningStorageService.getRoadmap(userId);

    if (!roadmap) {
      res.status(404).json({ error: 'Roadmap not found.' });
      return;
    }

    const { roadmap: updatedRoadmap, skippedTask } = adaptiveRoadmapEngine.skipTask(roadmap, taskId);
    await learningStorageService.saveRoadmap(userId, updatedRoadmap);

    res.json({
      success: true,
      skippedTask,
      overall_progress_percentage: updatedRoadmap.overall_progress_percentage,
      roadmap: updatedRoadmap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/skill-assessment/start
 * Retrieves targeted assessment questions
 */
learningRouter.post('/skill-assessment/start', async (req: Request, res: Response) => {
  try {
    const { skill_name, role_title } = req.body;
    if (!skill_name) {
      res.status(400).json({ error: 'skill_name is required' });
      return;
    }

    const assessment = skillAssessmentService.getAssessment(skill_name, role_title || 'General');
    res.json({ assessment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/skill-assessment/submit
 * Submits assessment, calculates evidence-backed level, adapts roadmap
 */
learningRouter.post('/skill-assessment/submit', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { skill_name, role_title, answers } = req.body;

    if (!skill_name || !answers) {
      res.status(400).json({ error: 'skill_name and answers dictionary are required' });
      return;
    }

    const assessment = skillAssessmentService.getAssessment(skill_name, role_title || 'General');
    const result = skillAssessmentService.evaluateAssessment(assessment, userId, answers);

    await learningStorageService.saveAssessmentResult(userId, result);

    const resolvedRole = role_title || 'AI Engineer';
    const goal = await storageService.getActiveGoal(userId);
    const existingSkillsBefore = await learningStorageService.getStudentSkills(userId);
    const prevSkill = existingSkillsBefore.find((s) => s.skill_name.toLowerCase() === skill_name.toLowerCase());
    const prevStatus = prevSkill?.current_status || 'UNKNOWN';

    const newStatus: EvidenceSkillStatus = result.score_percentage >= 85
      ? 'STRONG'
      : result.score_percentage >= 70
      ? 'PRACTICAL'
      : result.score_percentage >= 50
      ? 'DEVELOPING'
      : 'BEGINNER';

    await learningStorageService.logSkillProgressChange(
      userId,
      resolvedRole,
      skill_name,
      prevStatus,
      newStatus,
      'ASSESSMENT_COMPLETED',
      `Assessment score: ${result.score_percentage}%. Passed: ${result.passed}.`
    );

    // Re-evaluate skills with deterministic model
    const skillMap = getCareerSkillMap(goal?.target_role || resolvedRole);
    const profile = goal ? await storageService.getProfile(goal.session_id, userId) : null;
    const allAssessments = await learningStorageService.getAssessmentResults(userId);

    const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
      skillMap,
      studentProfile: profile,
      existingSkills: existingSkillsBefore,
      assessmentResults: allAssessments,
    });

    // Sync studentSkills array with evaluatedSkills
    const studentSkills = evaluatedSkills.map((ev) => ({
      skill_id: `skill-${ev.target_skill.toLowerCase().replace(/\s+/g, '-')}`,
      skill_name: ev.target_skill,
      category: (ev.category as any) || 'Core Skill',
      claimed: true,
      assessed_proficiency: (ev.current_status === 'STRONG' ? 'Strong' : ev.current_status === 'PRACTICAL' ? 'Intermediate' : ev.current_status === 'DEVELOPING' ? 'Foundational' : 'Beginner') as any,
      demonstrated: ev.current_status === 'PRACTICAL' || ev.current_status === 'STRONG',
      learning_status: (ev.visual_state === 'Completed' ? 'completed' : ev.visual_state === 'Blocked' ? 'blocked' : 'in_progress') as any,
      evidence_notes: ev.evidence,
      last_assessed_at: result.submitted_at,
      target_skill: ev.target_skill,
      current_status: ev.current_status,
      evidence: ev.evidence,
      gap: ev.gap,
      prerequisites: ev.prerequisites,
      recommended_learning_topics: ev.recommended_learning_topics,
      recommended_practice: ev.recommended_practice,
      project_relevance: ev.project_relevance,
      visual_state: ev.visual_state,
    }));

    await learningStorageService.saveStudentSkills(userId, studentSkills, resolvedRole, goal?.id);

    // Adapt active roadmap if present
    let roadmap = await learningStorageService.getRoadmap(userId);
    if (roadmap) {
      if (!result.passed) {
        roadmap = adaptiveRoadmapEngine.adaptFromAssessment(roadmap, result);
      } else {
        roadmap = competencyRoadmapEngine.generateCompetencyRoadmap(
          userId,
          goal?.id || 'goal-1',
          resolvedRole,
          skillMap,
          evaluatedSkills,
          roadmap.available_hours_per_day || 2.0,
          roadmap.days_per_week || 5,
          roadmap.learning_preference || 'mixed'
        );
      }
      await learningStorageService.saveRoadmap(userId, roadmap);
    }

    res.json({
      result,
      updated_proficiency: result.assessed_proficiency,
      assessed_status: newStatus,
      roadmap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/preferences/time
 * Updates committed learning hours and adapts roadmap timeline
 */
learningRouter.post('/preferences/time', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { available_hours_per_day, days_per_week } = req.body;

    const hours = Number(available_hours_per_day);
    const days = Number(days_per_week);

    if (!hours || hours <= 0 || !days || days <= 0) {
      res.status(400).json({ error: 'Valid positive available_hours_per_day and days_per_week are required' });
      return;
    }

    let roadmap = await learningStorageService.getRoadmap(userId);
    if (!roadmap) {
      res.status(404).json({ error: 'Roadmap not found.' });
      return;
    }

    roadmap = adaptiveRoadmapEngine.adaptPace(roadmap, hours, days);
    await learningStorageService.saveRoadmap(userId, roadmap);

    res.json({
      success: true,
      roadmap,
      estimated_total_weeks: roadmap.estimated_total_weeks,
      pace_description: roadmap.pace_description,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/resources
 * Catalog of genuine verified resources
 */
learningRouter.get('/resources', (req: Request, res: Response) => {
  res.json({ resources: VERIFIED_RESOURCE_CATALOG });
});

/**
 * GET /api/learning/resources/config
 * Returns configuration status of YouTube Data API integration (safe without leaking keys)
 */
learningRouter.get('/resources/config', (_req: Request, res: Response) => {
  const telemetry = youtubeClient.getQuotaTelemetry();
  res.json({
    youtube: {
      configured: telemetry.configured,
      status: telemetry.status,
      message: telemetry.configured
        ? 'YouTube Data API v3 active'
        : 'YOUTUBE_API_NOT_CONFIGURED',
    },
    status: telemetry.status,
    has_api_key: telemetry.configured,
    active_mode: telemetry.configured ? 'LIVE_YOUTUBE_API' : 'VERIFIED_CURATED_CATALOG',
    quota: telemetry,
  });
});

/**
 * GET /api/learning/resources/youtube-status
 * Dedicated Admin/Developer Configuration Check endpoint for Phase 2.4.
 * Returns YOUTUBE_API_NOT_CONFIGURED when YOUTUBE_API_KEY is omitted.
 * Never exposes the API key to client or responses.
 */
learningRouter.get('/resources/youtube-status', (_req: Request, res: Response) => {
  const telemetry = youtubeClient.getQuotaTelemetry();
  res.json({
    status: telemetry.status,
    configured: telemetry.configured,
    message: telemetry.configured
      ? 'YouTube Data API v3 integration active and ready.'
      : 'YOUTUBE_API_NOT_CONFIGURED',
    instructions: telemetry.configured
      ? 'YouTube Data API v3 is configured with YOUTUBE_API_KEY. Quota monitoring and fingerprint caching active.'
      : 'To activate live YouTube Data API queries, define YOUTUBE_API_KEY in your server-side environment variables (.env). This key is protected server-side and never exposed to clients.',
    quota: telemetry,
  });
});

/**
 * POST /api/learning/resources/youtube-check
 * Tests connectivity or returns simulated diagnostic check without crashing.
 */
learningRouter.post('/resources/youtube-check', async (req: Request, res: Response) => {
  try {
    const testTopic = (req.body?.topic as string) || 'Python Programming';
    const testRole = (req.body?.role as string) || 'Software Engineer';
    const response = await youtubeClient.searchEducationalVideos(testTopic, testRole, 2, false);

    res.json({
      success: response.status === 'YOUTUBE_API_READY',
      status: response.status,
      message: response.message,
      sample_count: response.items.length,
      quota: youtubeClient.getQuotaTelemetry(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: err.message,
    });
  }
});

/**
 * GET /api/learning/resources/topic
 * Discovers and deterministically ranks learning resources for a topic (YouTube prioritized)
 */
learningRouter.get('/resources/topic', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const topicId = (req.query.topic_id as string) || 'python-variables';
    let topicTitle = (req.query.topic_title as string) || '';
    let targetRole = (req.query.target_role as string) || '';
    const forceRefresh = req.query.force_refresh === 'true';

    // If topicTitle or targetRole not provided, infer from active goal and roadmap
    if (!topicTitle || !targetRole) {
      const goal = await storageService.getActiveGoal(userId);
      if (goal) {
        targetRole = targetRole || goal.target_role;
      }
      const roadmap = await learningStorageService.getRoadmap(userId);
      if (roadmap) {
        topicTitle = topicTitle || roadmap.current_topic_title || 'Foundations';
      }
    }

    if (!topicTitle) topicTitle = 'Python Programming Foundations';
    if (!targetRole) targetRole = 'AI Engineer';

    const run = await learningResourceEngine.discoverResourcesForTopic(
      topicId,
      topicTitle,
      targetRole,
      {
        forceRefresh,
      }
    );

    // Attach student resource state for current user
    const enrichedResults = await Promise.all(
      run.results.map(async (res) => {
        const studentState = await learningResourceEngine.getStudentResourceState(userId, res.resource_id);
        return {
          ...res,
          student_state: studentState,
        };
      })
    );

    res.json({
      run: {
        ...run,
        results: enrichedResults,
      },
      resources: enrichedResults,
      config: {
        youtube_configured: youtubeClient.isConfigured(),
        status: youtubeClient.isConfigured() ? 'YOUTUBE_API_READY' : 'YOUTUBE_API_NOT_CONFIGURED',
        status_message: youtubeClient.isConfigured()
          ? 'Live YouTube Data API v3 Active'
          : 'YouTube integration not configured (Using verified educational catalog)',
        quota: youtubeClient.getQuotaTelemetry(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/resources/state
 * Updates student interaction state for a resource (SUGGESTED, SELECTED, PRIMARY, COMPLETED, REJECTED, REPLACED)
 */
learningRouter.post('/resources/state', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { resource_id, topic_id, state } = req.body;

    if (!resource_id || !topic_id || !state) {
      res.status(400).json({ error: 'resource_id, topic_id, and state are required' });
      return;
    }

    const validStates: StudentResourceState[] = [
      'SUGGESTED',
      'SELECTED',
      'PRIMARY',
      'COMPLETED',
      'REJECTED',
      'REPLACED',
    ];

    if (!validStates.includes(state)) {
      res.status(400).json({ error: `Invalid state. Must be one of: ${validStates.join(', ')}` });
      return;
    }

    await learningResourceEngine.setStudentResourceState(userId, resource_id, topic_id, state);

    res.json({
      success: true,
      user_id: userId,
      resource_id,
      topic_id,
      state,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/resources/status
 * Updates system status for a learning resource (DISCOVERED, VALIDATED, AVAILABLE, UNAVAILABLE, REPLACED, ARCHIVED)
 */
learningRouter.post('/resources/status', async (req: Request, res: Response) => {
  try {
    const { resource_id, status } = req.body;

    if (!resource_id || !status) {
      res.status(400).json({ error: 'resource_id and status are required' });
      return;
    }

    const validStatuses: ResourceStatus[] = [
      'DISCOVERED',
      'VALIDATED',
      'AVAILABLE',
      'UNAVAILABLE',
      'REPLACED',
      'ARCHIVED',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const updated = await learningResourceEngine.updateResourceStatus(resource_id, status);

    res.json({
      success: true,
      resource_id,
      status,
      updated_in_catalog: updated,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/resources/runs
 * Retrieves traceable discovery runs
 */
learningRouter.get('/resources/runs', async (_req: Request, res: Response) => {
  try {
    const runs = await learningResourceEngine.getAllRuns();
    res.json({ runs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/overview
 * Comprehensive dashboard summary endpoint
 */
learningRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const goal = await storageService.getActiveGoal(userId);

    if (!goal || goal.goal_status !== 'ACTIVE') {
      res.json({
        has_goal: false,
        summary: null,
      });
      return;
    }

    let roadmap = await learningStorageService.getRoadmap(userId);
    const skillMap = getCareerSkillMap(goal.target_role);
    const profile = await storageService.getProfile(goal.session_id, userId);
    let existingSkills = await learningStorageService.getStudentSkills(userId);
    const assessmentResults = await learningStorageService.getAssessmentResults(userId);

    // Evaluate skills with deterministic skill-progress model
    const evaluatedSkills = deterministicSkillProgressModel.evaluateStudentSkillProgress({
      skillMap,
      studentProfile: profile,
      existingSkills,
      assessmentResults,
      changedCareerGoal: Boolean(roadmap && roadmap.target_role.toLowerCase() !== goal.target_role.toLowerCase()),
    });

    // If no roadmap OR if goal changed, regenerate competency roadmap
    if (!roadmap || roadmap.target_role.toLowerCase() !== goal.target_role.toLowerCase()) {
      roadmap = competencyRoadmapEngine.generateCompetencyRoadmap(
        userId,
        goal.id,
        goal.target_role,
        skillMap,
        evaluatedSkills,
        2.0,
        5,
        'mixed'
      );
      await learningStorageService.saveRoadmap(userId, roadmap);
    }

    const gaps = skillGapEngine.analyzeGaps(skillMap, existingSkills, 2.0);
    const todayPlan = dailyWeeklyPlanEngine.generateDailyPlan(roadmap);
    const weeklyPlan = dailyWeeklyPlanEngine.generateWeeklyPlan(roadmap, 1);

    const strongCount = evaluatedSkills.filter((s) => s.current_status === 'STRONG').length;
    const practicalCount = evaluatedSkills.filter((s) => s.current_status === 'PRACTICAL').length;
    const developingCount = evaluatedSkills.filter((s) => s.current_status === 'DEVELOPING').length;

    const currentSkillLevel = strongCount > 0 || practicalCount > 0
      ? `${strongCount} Strong • ${practicalCount} Practical • ${developingCount} Developing`
      : developingCount > 0
      ? `${developingCount} Developing Skills (Foundational)`
      : 'Starting from Zero (Beginner)';

    const p0Count = gaps.filter((g) => g.priority_tier === 'P0').length;
    const mustLearnCount = gaps.filter((g) => g.gap_category === 'Must Learn').length;
    const skillGapSummary = `${mustLearnCount} Core Skills Required (${p0Count} immediate bottlenecks)`;

    res.json({
      has_goal: true,
      summary: {
        selected_career: goal.target_role,
        goal_source: goal.goal_source,
        goal_selected_at: goal.goal_selected_at,
        current_skill_level: currentSkillLevel,
        skill_gap_summary: skillGapSummary,
        overall_progress_percentage: roadmap.overall_progress_percentage,
        current_stage_title: roadmap.current_stage_title,
        current_topic_title: roadmap.current_topic_title || (roadmap.stages[0]?.topics[0]?.title) || 'Foundations',
        current_focus_skill: roadmap.current_focus_skill,
        next_action: roadmap.next_action || (roadmap.stages[0]?.topics[0]?.tasks[0]?.title) || 'Begin first topic',
        top_skill_gaps: gaps.slice(0, 4),
        today_plan: todayPlan,
        weekly_plan: weeklyPlan,
        estimated_total_weeks: roadmap.estimated_total_weeks,
        estimated_workload_hours: roadmap.estimated_workload_hours || Math.round(roadmap.estimated_total_weeks * 10),
        daily_pace_hours: roadmap.available_hours_per_day,
        total_skills_count: skillMap.skills.length,
        mastered_skills_count: strongCount + practicalCount,
        in_progress_skills_count: developingCount,
      },
      roadmap,
      gaps,
      skillMap,
      evaluatedSkills,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function buildRequirementsOverview(run: CareerResearchRun): CareerRequirementsOverview {
  const reqs = run.requirements || [];
  const foundational = reqs.filter((r) => r.category === 'FOUNDATIONAL');
  const core = reqs.filter((r) => r.category === 'CORE');
  const supporting = reqs.filter((r) => r.category === 'SUPPORTING');
  const specialized = reqs.filter((r) => r.category === 'SPECIALIZED');
  const tools = reqs.filter((r) => r.skill_type === 'Tool/Technology');

  const dependencies = reqs
    .filter((r) => r.prerequisite_skills && r.prerequisite_skills.length > 0)
    .map((r) => ({
      skill: r.skill_or_topic,
      requires: r.prerequisite_skills,
      category: r.category,
      rationale: `${r.skill_or_topic} requires foundational prerequisite readiness.`,
    }));

  return {
    target_role: run.target_role,
    run,
    foundational_requirements: foundational,
    core_requirements: core,
    supporting_requirements: supporting,
    specialized_requirements: specialized,
    tools_and_technologies: tools,
    skill_dependencies: dependencies,
  };
}

/**
 * GET /api/learning/requirements
 * Retrieves career requirement research for the student's active career goal
 */
learningRouter.get('/requirements', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const queryRole = typeof req.query.role === 'string' ? req.query.role.trim() : '';

    let targetRole = queryRole;
    let goalId: string | null = null;

    if (!targetRole) {
      const goal = await storageService.getActiveGoal(userId);
      if (!goal || goal.goal_status !== 'ACTIVE') {
        res.json({
          has_goal: false,
          overview: null,
          message: 'Choose a career goal first.',
        });
        return;
      }
      targetRole = goal.target_role;
      goalId = goal.id;
    }

    const run = await requirementsPipeline.executeResearch(userId, targetRole, goalId, false);
    const overview = buildRequirementsOverview(run);

    res.json({
      has_goal: true,
      overview,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/learning/requirements/run
 * Forces a new research run or executes research for an arbitrary career role
 */
learningRouter.post('/requirements/run', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const { role_title, force_refresh } = req.body;

    let targetRole = typeof role_title === 'string' ? role_title.trim() : '';
    let goalId: string | null = null;

    if (!targetRole) {
      const goal = await storageService.getActiveGoal(userId);
      if (!goal) {
        res.status(400).json({ error: 'No active career goal. Provide role_title or choose a career goal first.' });
        return;
      }
      targetRole = goal.target_role;
      goalId = goal.id;
    }

    const run = await requirementsPipeline.executeResearch(userId, targetRole, goalId, Boolean(force_refresh));
    const overview = buildRequirementsOverview(run);

    res.json({
      success: run.status === 'COMPLETED' || run.status === 'PARTIAL',
      status: run.status,
      overview,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/learning/requirements/runs
 * Traceable history of all research runs for current student
 */
learningRouter.get('/requirements/runs', async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const runs = await requirementsStorageService.getResearchRunsForUser(userId);
    res.json({ runs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

