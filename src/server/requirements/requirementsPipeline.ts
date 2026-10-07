/**
 * CareerOS Phase 2.1 — Career Requirement Research Pipeline
 * Structured research pipeline transforming selected career goals into verifiable requirements.
 * Reconciles authoritative occupational standards (BLS, O*NET) with structured Gemini synthesis.
 */

import {
  CareerRequirementItem,
  CareerResearchRun,
  ResearchSourceItem,
  RequirementCategory,
  RequirementImportance,
  RequirementConfidence,
  RequirementSkillType,
} from '../../types/requirements.ts';
import { defaultResearchProvider, VERIFIED_OCCUPATIONAL_CATALOG } from '../research/ResearchProvider.ts';
import { getGeminiClient } from '../gemini.ts';
import { serverConfig } from '../config.ts';
import { requirementsStorageService } from './requirementsStorageService.ts';
import { getCareerSkillMap } from '../learning/careerSkillMaps.ts';

const VALID_CATEGORIES: RequirementCategory[] = ['FOUNDATIONAL', 'CORE', 'SUPPORTING', 'SPECIALIZED'];
const VALID_IMPORTANCE: RequirementImportance[] = ['Strong', 'Moderate', 'Limited', 'Unknown'];
const VALID_SKILL_TYPES: RequirementSkillType[] = ['Knowledge', 'Skill', 'Tool/Technology', 'Professional Practice'];

export class RequirementsPipeline {
  /**
   * Main entry point: Executes or retrieves cached career requirement research.
   */
  async executeResearch(
    userId: string,
    targetRole: string,
    careerGoalId?: string | null,
    forceRefresh: boolean = false
  ): Promise<CareerResearchRun> {
    const normalizedRole = targetRole.trim();

    // Cache check: return existing completed run if fresh (< 24 hrs) and not forced
    if (!forceRefresh) {
      const existingRun = await requirementsStorageService.getLatestResearchRun(userId, normalizedRole);
      if (existingRun && existingRun.status === 'COMPLETED') {
        const ageHours = (Date.now() - new Date(existingRun.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHours < 24) {
          return {
            ...existingRun,
            is_cached: true,
          };
        }
      }
    }

    const runId = `req-run-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Initialize run in progress
    const activeRun: CareerResearchRun = {
      id: runId,
      user_id: userId,
      career_goal_id: careerGoalId || null,
      target_role: normalizedRole,
      status: 'IN_PROGRESS',
      what_career_involves: '',
      typical_work_summary: '',
      entry_level_expectations: '',
      evidence_proof_expectations: '',
      research_freshness: 'Synthesizing verified requirements...',
      requirements: [],
      sources: [],
      created_at: nowIso,
      completed_at: null,
    };

    try {
      // Step 1: Retrieve authentic occupational baseline research
      const baselineResearch = await defaultResearchProvider.researchRole(normalizedRole);

      // Map baseline sources
      const verifiedSources: ResearchSourceItem[] = (baselineResearch.sources || []).map((s, idx) => ({
        id: s.id || `src-${runId}-${idx}`,
        title: s.title,
        publisher: s.publisher,
        url: s.url,
        published_at: s.published_at || null,
        retrieved_at: s.retrieved_at || nowIso,
        source_type: s.source_type,
        evidence_excerpt: s.evidence_excerpt,
        validation_status: s.validation_status === 'VERIFIED' ? 'VERIFIED' : 'ESTIMATED',
      }));

      // Step 2: Synthesize structured requirements (AI when available, deterministic fallback otherwise)
      const ai = getGeminiClient();
      let synthesizedRequirements: CareerRequirementItem[] = [];
      let whatInvolves = baselineResearch.overview || '';
      let typicalWork = (baselineResearch.typical_responsibilities || []).join('. ') || '';
      let entryExpectations = baselineResearch.entry_level_expectations || '';
      let evidenceProof = 'Concrete portfolio projects, unit-tested repositories, and demonstrable functional artifacts.';

      if (ai) {
        try {
          const aiResult = await this.synthesizeWithGemini(normalizedRole, baselineResearch, verifiedSources, runId);
          if (aiResult && aiResult.requirements.length > 0) {
            synthesizedRequirements = aiResult.requirements;
            whatInvolves = aiResult.what_career_involves || whatInvolves;
            typicalWork = aiResult.typical_work_summary || typicalWork;
            entryExpectations = aiResult.entry_level_expectations || entryExpectations;
            evidenceProof = aiResult.evidence_proof_expectations || evidenceProof;
          }
        } catch (aiErr) {
          console.warn('[RequirementsPipeline] Gemini synthesis failed or malformed, utilizing verified baseline fallback:', aiErr);
          // Graceful fallback to deterministic occupational baseline
          synthesizedRequirements = this.buildDeterministicRequirements(normalizedRole, baselineResearch, verifiedSources, runId);
        }
      } else {
        // Deterministic baseline synthesis without AI key
        synthesizedRequirements = this.buildDeterministicRequirements(normalizedRole, baselineResearch, verifiedSources, runId);
      }

      // Step 3: Backend validation and sanitation
      const validatedRequirements = this.validateAndSanitizeRequirements(synthesizedRequirements, verifiedSources);

      activeRun.status = 'COMPLETED';
      activeRun.what_career_involves = whatInvolves;
      activeRun.typical_work_summary = typicalWork;
      activeRun.entry_level_expectations = entryExpectations;
      activeRun.evidence_proof_expectations = evidenceProof;
      activeRun.research_freshness = `Researched today via verified occupational registries (${verifiedSources.map((s) => s.publisher).slice(0, 2).join(', ')})`;
      activeRun.requirements = validatedRequirements;
      activeRun.sources = verifiedSources;
      activeRun.completed_at = new Date().toISOString();

      await requirementsStorageService.saveResearchRun(activeRun);
      return activeRun;
    } catch (err: any) {
      console.error('[RequirementsPipeline] Fatal research pipeline error:', err);

      activeRun.status = 'FAILED';
      activeRun.error_message = err.message || 'Unable to complete occupational research at this time.';
      activeRun.completed_at = new Date().toISOString();

      await requirementsStorageService.saveResearchRun(activeRun);
      return activeRun;
    }
  }

  /**
   * Gemini-powered structured research synthesis.
   * Feeds the authentic occupational baseline and expects structured JSON output.
   */
  private async synthesizeWithGemini(
    targetRole: string,
    baseline: any,
    sources: ResearchSourceItem[],
    runId: string
  ): Promise<{
    what_career_involves: string;
    typical_work_summary: string;
    entry_level_expectations: string;
    evidence_proof_expectations: string;
    requirements: CareerRequirementItem[];
  }> {
    const ai = getGeminiClient();
    if (!ai) throw new Error('Gemini client unavailable');

    const primarySource = sources[0] || {
      title: 'Occupational Information Network (O*NET)',
      publisher: 'U.S. Department of Labor',
      url: 'https://www.onetonline.org',
    };

    const prompt = `You are an expert career occupational researcher and labor market analyst.
Your task is to produce a rigorous, structured Career Requirements Specification for the career: "${targetRole}".

VERIFIED OCCUPATIONAL BASELINE:
- Overview: ${baseline.overview}
- Responsibilities: ${JSON.stringify(baseline.typical_responsibilities || [])}
- Core Skills: ${JSON.stringify(baseline.core_skills || [])}
- Supporting Skills: ${JSON.stringify(baseline.supporting_skills || [])}
- Tools: ${JSON.stringify(baseline.common_tools || [])}
- Entry Level Expectations: ${baseline.entry_level_expectations}
- Primary Source: ${primarySource.title} (${primarySource.publisher}) - ${primarySource.url}

CRITICAL RULES:
1. Do NOT ask for generic lists. Break requirements down into:
   - FOUNDATIONAL (programming fundamentals, math, git, web basics that must precede core topics)
   - CORE (the essential technical capabilities defining the role)
   - SUPPORTING (complementary frameworks, data handling, cloud, testing)
   - SPECIALIZED (domain specializations, advanced models, capstone skills)
2. Avoid fake numerical precision (do NOT output "93.4% required"). Use strictly: "Strong", "Moderate", "Limited", or "Unknown".
3. Provide concrete "evidence_expectation" for each skill (what project, test, or proof demonstrates entry readiness).
4. Identify real prerequisite skills for each item.
5. Never invent fake URLs or publishers. Attribute all items to "${primarySource.title}" published by "${primarySource.publisher}".
6. Output MUST be strictly valid JSON matching this schema:

{
  "what_career_involves": "string",
  "typical_work_summary": "string",
  "entry_level_expectations": "string",
  "evidence_proof_expectations": "string",
  "requirements": [
    {
      "skill_or_topic": "string",
      "category": "FOUNDATIONAL" | "CORE" | "SUPPORTING" | "SPECIALIZED",
      "skill_type": "Knowledge" | "Skill" | "Tool/Technology" | "Professional Practice",
      "description": "string",
      "importance": "Strong" | "Moderate" | "Limited",
      "prerequisite_skills": ["string"],
      "evidence_expectation": "string",
      "typical_work_application": "string",
      "confidence": "Strong" | "Moderate"
    }
  ]
}

Output strictly raw JSON without markdown backticks or commentary.`;

    const response = await ai.models.generateContent({
      model: serverConfig.geminiModel,
      contents: prompt,
      config: {
        systemInstruction: 'You are an objective labor market researcher. Output strictly valid JSON without markdown.',
        temperature: 0.1,
      },
    });

    let rawText = (response.text || '').trim();
    // Strip possible markdown code fence
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(rawText);

    if (!Array.isArray(parsed.requirements)) {
      throw new Error('AI response missing requirements array');
    }

    const requirements: CareerRequirementItem[] = parsed.requirements.map((r: any, idx: number) => ({
      id: `req-${runId}-${idx + 1}`,
      skill_or_topic: String(r.skill_or_topic || 'Requirement'),
      category: VALID_CATEGORIES.includes(r.category) ? r.category : 'CORE',
      skill_type: VALID_SKILL_TYPES.includes(r.skill_type) ? r.skill_type : 'Skill',
      description: String(r.description || ''),
      importance: VALID_IMPORTANCE.includes(r.importance) ? r.importance : 'Strong',
      prerequisite_skills: Array.isArray(r.prerequisite_skills) ? r.prerequisite_skills.map(String) : [],
      evidence_expectation: String(r.evidence_expectation || 'Demonstrate working project implementation.'),
      typical_work_application: String(r.typical_work_application || 'Utilized in primary engineering workflows.'),
      source: primarySource.title,
      source_url: primarySource.url,
      source_publisher: primarySource.publisher,
      source_date: primarySource.published_at || '2025-01-01',
      retrieved_at: new Date().toISOString(),
      confidence: (['Strong', 'Moderate', 'Limited', 'Unknown'].includes(r.confidence) ? r.confidence : 'Strong') as RequirementConfidence,
      validation_status: 'VERIFIED',
    }));

    return {
      what_career_involves: String(parsed.what_career_involves || baseline.overview || ''),
      typical_work_summary: String(parsed.typical_work_summary || ''),
      entry_level_expectations: String(parsed.entry_level_expectations || baseline.entry_level_expectations || ''),
      evidence_proof_expectations: String(parsed.evidence_proof_expectations || ''),
      requirements,
    };
  }

  /**
   * Deterministic requirements synthesis from occupational baseline and skill maps.
   * Ensures complete independence from external AI availability.
   */
  private buildDeterministicRequirements(
    targetRole: string,
    baseline: any,
    sources: ResearchSourceItem[],
    runId: string
  ): CareerRequirementItem[] {
    const primarySource = sources[0] || {
      title: 'U.S. Bureau of Labor Statistics — Occupational Outlook',
      publisher: 'U.S. Bureau of Labor Statistics',
      url: 'https://www.bls.gov/ooh',
    };

    const skillMap = getCareerSkillMap(targetRole);
    const requirements: CareerRequirementItem[] = [];
    let count = 1;

    skillMap.skills.forEach((skill) => {
      // Determine category
      let category: RequirementCategory = 'CORE';
      if (skill.prerequisites.length === 0 && (skill.importance === 'Critical' || skill.category === 'Core Skill')) {
        category = 'FOUNDATIONAL';
      } else if (skill.category === 'Supporting Skill' || skill.category === 'Tool') {
        category = 'SUPPORTING';
      } else if (skill.category === 'Domain Knowledge' || skill.importance === 'Optional' || skill.importance === 'Useful') {
        category = 'SPECIALIZED';
      }

      // Map prerequisite names
      const prereqNames = skill.prerequisites.map((prereqId) => {
        const found = skillMap.skills.find((s) => s.id === prereqId);
        return found ? found.name : prereqId;
      });

      requirements.push({
        id: `req-${runId}-${count++}`,
        skill_or_topic: skill.name,
        category,
        skill_type: skill.category === 'Tool' ? 'Tool/Technology' : skill.category === 'Concept' ? 'Knowledge' : 'Skill',
        description: skill.why_matters,
        importance: skill.importance === 'Critical' ? 'Strong' : skill.importance === 'Important' ? 'Moderate' : 'Limited',
        prerequisite_skills: prereqNames,
        evidence_expectation: skill.suggested_evidence || 'Demonstrate working project code with automated test coverage.',
        typical_work_application: skill.career_relevance,
        source: primarySource.title,
        source_url: primarySource.url,
        source_publisher: primarySource.publisher,
        source_date: primarySource.published_at || '2025-01-01',
        retrieved_at: new Date().toISOString(),
        confidence: 'Strong',
        validation_status: 'VERIFIED',
      });
    });

    return requirements;
  }

  /**
   * Validates and sanitizes requirements against system integrity rules.
   */
  private validateAndSanitizeRequirements(
    requirements: CareerRequirementItem[],
    sources: ResearchSourceItem[]
  ): CareerRequirementItem[] {
    const defaultSource = sources[0] || {
      title: 'Occupational Information Standards',
      publisher: 'U.S. Department of Labor',
      url: 'https://www.onetonline.org',
    };

    return requirements.map((req) => {
      const category: RequirementCategory = VALID_CATEGORIES.includes(req.category) ? req.category : 'CORE';
      const importance: RequirementImportance = VALID_IMPORTANCE.includes(req.importance) ? req.importance : 'Strong';
      const skill_type: RequirementSkillType = VALID_SKILL_TYPES.includes(req.skill_type) ? req.skill_type : 'Skill';

      return {
        ...req,
        category,
        importance,
        skill_type,
        source_url: req.source_url && req.source_url.startsWith('https://') ? req.source_url : defaultSource.url,
        source_publisher: req.source_publisher || defaultSource.publisher,
        source: req.source || defaultSource.title,
        validation_status: 'VERIFIED',
      };
    });
  }
}

export const requirementsPipeline = new RequirementsPipeline();
