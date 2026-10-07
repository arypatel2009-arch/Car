import {
  CareerRoleResearch,
  CareerSignalMap,
  EntryBarrierLevel,
  MarketEvidenceStrength,
  QualitativeAlignment,
  RawAnswerItem,
  RecommendationItem,
  RejectionPayload,
  StudentCareerProfile,
} from '../../types/career.ts';
import { defaultResearchProvider } from '../research/ResearchProvider.ts';
import { getGeminiClient } from '../gemini.ts';
import { serverConfig } from '../config.ts';

// -------------------------------------------------------------
// STRUCTURED CAREER REQUIREMENT MATRIX
// -------------------------------------------------------------
export interface CareerRequirement {
  role_title: string;
  core_domain: string;
  core_signals: {
    name: string;
    check: (profile: StudentCareerProfile, signals?: CareerSignalMap) => boolean;
    description: string;
  }[];
  supporting_signals: {
    name: string;
    check: (profile: StudentCareerProfile, signals?: CareerSignalMap) => boolean;
    description: string;
  }[];
  conflicts: {
    name: string;
    is_major: boolean;
    check: (profile: StudentCareerProfile, signals?: CareerSignalMap) => boolean;
    reason: string;
  }[];
  missing_verifications: {
    name: string;
    check: (profile: StudentCareerProfile) => boolean;
    question_topic: string;
  }[];
}

export const CAREER_REQUIREMENTS: Record<string, CareerRequirement> = {
  'UI/UX Designer': {
    role_title: 'UI/UX Designer',
    core_domain: 'Design & Human-Computer Interaction',
    core_signals: [
      {
        name: 'Visual Design Affinity',
        check: (p) => p.creativity_preference === 'high_visual_design' || p.interests.some((i) => /visual|design|interface/i.test(i)),
        description: 'Demonstrated interest in visual layouts, aesthetics, typography, and interactive design',
      },
      {
        name: 'Creative Problem Solving',
        check: (p) => p.problem_solving_preference === 'creative_open_ended' || p.problem_solving_preference === 'people_centric',
        description: 'Preference for open-ended exploration, user empathy, and heuristic design',
      },
    ],
    supporting_signals: [
      {
        name: 'Low-Code Compatibility',
        check: (p) => p.coding_preference === 'no_code_or_minimal' || p.coding_preference === 'practical_coding',
        description: 'Focuses time on design systems, Figma prototypes, and user research rather than compiler code',
      },
      {
        name: 'User Storytelling',
        check: (p) => p.creativity_preference === 'content_storytelling' || p.interests.some((i) => /story|user/i.test(i)),
        description: 'Ability to frame customer pain points and present cohesive product journeys',
      },
    ],
    conflicts: [
      {
        name: 'Dislike of Visual Work',
        is_major: true,
        check: (p) => p.creativity_preference === 'system_solution_architecture' && p.interests.every((i) => !/design|visual|ui/i.test(i)),
        reason: 'Daily work centers around creating visual mockups, Figma prototypes, and design tokens',
      },
    ],
    missing_verifications: [
      {
        name: 'User Research Fluency',
        check: (p) => p.work_preferences.some((w) => /research|interview/i.test(w)),
        question_topic: 'Comfort conducting user discovery interviews and usability tests',
      },
    ],
  },

  'Product Manager': {
    role_title: 'Product Manager',
    core_domain: 'Product Strategy & Cross-Functional Leadership',
    core_signals: [
      {
        name: 'Business & Commercial Acumen',
        check: (p) => p.business_interest === 'high_commercial_focus' || p.entrepreneurship_interest === 'wants_to_build_startup',
        description: 'High engagement with commercial strategy, market adoption, and customer retention',
      },
      {
        name: 'Cross-Functional Collaboration',
        check: (p) => p.problem_solving_preference === 'people_centric' || p.work_preferences.some((w) => /strategy|product|team/i.test(w)),
        description: 'Excels at stakeholder communication, roadmap prioritization, and team coordination',
      },
    ],
    supporting_signals: [
      {
        name: 'Analytical Decision Making',
        check: (p) => p.math_interest === 'practical_applied_math' || p.interests.some((i) => /data|metric/i.test(i)),
        description: 'Uses metrics, cohort funnels, and retention data to justify feature roadmaps',
      },
      {
        name: 'Storytelling & Problem Framing',
        check: (p) => p.creativity_preference === 'content_storytelling' || p.creativity_preference === 'system_solution_architecture',
        description: 'Translates ambiguous market opportunities into structured PRDs and user stories',
      },
    ],
    conflicts: [
      {
        name: 'Dislike of Cross-Functional Communication',
        is_major: true,
        check: (p) => p.problem_solving_preference === 'analytical_logical' && p.business_interest === 'low',
        reason: 'Product Management requires continuous meetings, stakeholder negotiation, and cross-team alignment',
      },
    ],
    missing_verifications: [
      {
        name: 'Prioritization Frameworks',
        check: (p) => p.interests.some((i) => /priorit|roadmap/i.test(i)),
        question_topic: 'Familiarity with feature prioritization (RICE, MoSCoW, impact vs effort)',
      },
    ],
  },

  'Frontend Developer': {
    role_title: 'Frontend Developer',
    core_domain: 'Software Engineering & Interactive Web Applications',
    core_signals: [
      {
        name: 'Programming Affinity',
        check: (p) => p.coding_preference === 'loves_coding' || p.coding_preference === 'practical_coding',
        description: 'Enjoys writing logic, component architectures, and modern JavaScript/TypeScript',
      },
      {
        name: 'User-Facing Interactive Software',
        check: (p) => p.interests.some((i) => /app|web|interface|front/i.test(i)) || p.creativity_preference === 'high_visual_design',
        description: 'Desire to build responsive web applications, interactive dashboards, and client state',
      },
    ],
    supporting_signals: [
      {
        name: 'Visual & Usability Appreciation',
        check: (p) => p.creativity_preference === 'high_visual_design' || p.creativity_preference === 'system_solution_architecture',
        description: 'Bridges aesthetic design specifications with working semantic code',
      },
    ],
    conflicts: [
      {
        name: 'Dislike of Programming',
        is_major: true,
        check: (p) => p.coding_preference === 'no_code_or_minimal',
        reason: 'Frontend development requires spending 70%+ of the workday writing and debugging code',
      },
    ],
    missing_verifications: [
      {
        name: 'Web Framework Foundations',
        check: (p) => p.experience_level !== 'beginner_student',
        question_topic: 'Experience building projects with modern frameworks (React, Vite, CSS)',
      },
    ],
  },

  'Backend Developer': {
    role_title: 'Backend Developer',
    core_domain: 'Systems Architecture & Server Infrastructure',
    core_signals: [
      {
        name: 'Deep Programming Affinity',
        check: (p) => p.coding_preference === 'loves_coding',
        description: 'High enthusiasm for server logic, algorithms, and distributed codebases',
      },
      {
        name: 'System & Database Architecture',
        check: (p) => p.creativity_preference === 'system_solution_architecture' || p.problem_solving_preference === 'analytical_logical',
        description: 'Interest in database schema design, REST/GraphQL APIs, and server reliability',
      },
    ],
    supporting_signals: [
      {
        name: 'Analytical Problem Solving',
        check: (p) => p.problem_solving_preference === 'analytical_logical',
        description: 'Enjoys deterministic debugging, query optimization, and latency tuning',
      },
    ],
    conflicts: [
      {
        name: 'Dislike of Programming',
        is_major: true,
        check: (p) => p.coding_preference === 'no_code_or_minimal',
        reason: 'Backend engineering is fundamentally a code-intensive discipline',
      },
      {
        name: 'Exclusively Visual Creative Focus',
        is_major: true,
        check: (p) => p.creativity_preference === 'high_visual_design' && p.coding_preference !== 'loves_coding',
        reason: 'Backend development involves headless services, APIs, and databases without visual layouts',
      },
    ],
    missing_verifications: [
      {
        name: 'Database & SQL Literacy',
        check: (p) => p.interests.some((i) => /sql|database|api/i.test(i)),
        question_topic: 'Comfort with relational modeling and server security policies',
      },
    ],
  },

  'AI Engineer': {
    role_title: 'AI Engineer',
    core_domain: 'Machine Learning & Generative AI Systems',
    core_signals: [
      {
        name: 'Software Engineering Fundamentals',
        check: (p) => p.coding_preference === 'loves_coding' || p.coding_preference === 'practical_coding',
        description: 'Competence implementing model SDKs, data pipelines, and production services',
      },
      {
        name: 'AI & Machine Learning Focus',
        check: (p) => p.interests.some((i) => /ai|machine learning|model|rag/i.test(i)) || p.research_interest === 'deep_inquiry_science',
        description: 'Interest in embeddings, vector retrieval, RAG architectures, and agentic workflows',
      },
    ],
    supporting_signals: [
      {
        name: 'Mathematical / Statistical Comfort',
        check: (p) => p.math_interest === 'comfortable_with_math' || p.math_interest === 'practical_applied_math',
        description: 'Understanding vector math, probabilities, and evaluation metrics',
      },
    ],
    conflicts: [
      {
        name: 'Dislike of Programming',
        is_major: true,
        check: (p) => p.coding_preference === 'no_code_or_minimal',
        reason: 'Engineering AI systems requires extensive Python/TypeScript development and prompt pipelines',
      },
      {
        name: 'Aversion to Math & Statistics',
        is_major: false,
        check: (p) => p.math_interest === 'minimal_math',
        reason: 'Advanced model tuning and vector systems frequently involve linear algebra and applied statistics',
      },
    ],
    missing_verifications: [
      {
        name: 'LLM Pipeline Exposure',
        check: (p) => p.interests.some((i) => /llm|rag|vector/i.test(i)),
        question_topic: 'Experience building practical RAG or tool-calling generative prototypes',
      },
    ],
  },

  'Data Analyst': {
    role_title: 'Data Analyst',
    core_domain: 'Business Intelligence & Quantitative Discovery',
    core_signals: [
      {
        name: 'Data & Quantitative Curiosity',
        check: (p) => p.interests.some((i) => /data|analys|metric|pattern/i.test(i)) || p.problem_solving_preference === 'analytical_logical',
        description: 'Enjoys querying datasets, discovering business trends, and building visual dashboards',
      },
      {
        name: 'Applied Business Value',
        check: (p) => p.business_interest !== 'low' || p.creativity_preference === 'content_storytelling',
        description: 'Desire to guide organizational decisions through clean data presentation',
      },
    ],
    supporting_signals: [
      {
        name: 'Applied Math & Statistics',
        check: (p) => p.math_interest === 'practical_applied_math' || p.math_interest === 'comfortable_with_math',
        description: 'Comfortable calculating percentages, cohorts, conversions, and distributions',
      },
      {
        name: 'Scripting / SQL Orientation',
        check: (p) => p.coding_preference === 'practical_coding' || p.coding_preference === 'loves_coding',
        description: 'Uses SQL queries and spreadsheet formulas as practical analytical tools',
      },
    ],
    conflicts: [
      {
        name: 'Strong Aversion to Numbers & Data',
        is_major: true,
        check: (p) => p.math_interest === 'minimal_math' && p.interests.every((i) => !/data|analys/i.test(i)),
        reason: 'Data analytics is centered around quantitative datasets, spreadsheets, and SQL metrics daily',
      },
    ],
    missing_verifications: [
      {
        name: 'SQL Query Mastery',
        check: (p) => p.interests.some((i) => /sql/i.test(i)),
        question_topic: 'Mastery of relational SQL joins, aggregations, and window functions',
      },
    ],
  },

  'Cybersecurity Analyst': {
    role_title: 'Cybersecurity Analyst',
    core_domain: 'Information Security & Infrastructure Defense',
    core_signals: [
      {
        name: 'Explicit Security & Network Interest',
        check: (p) => p.interests.some((i) => /security|cyber|network|defen|hack|vulnerab/i.test(i)),
        description: 'Curiosity regarding threat intelligence, defensive monitoring, and vulnerability hunting',
      },
      {
        name: 'Investigative Problem Solving',
        check: (p) => p.problem_solving_preference === 'analytical_logical' || p.interests.some((i) => /investigat|log|trace/i.test(i)),
        description: 'Attention to detail when inspecting network logs and identifying anomalous patterns',
      },
    ],
    supporting_signals: [
      {
        name: 'Systems & Infrastructure Curiosity',
        check: (p) => p.creativity_preference === 'system_solution_architecture' || p.interests.some((i) => /system|server|linux/i.test(i)),
        description: 'Understanding operating system permissions, firewalls, and protocols (TCP/IP)',
      },
    ],
    conflicts: [
      {
        name: 'Zero Security Evidence',
        is_major: true,
        check: (p) => p.interests.every((i) => !/security|cyber|network|defen|hack/i.test(i)),
        reason: 'Cybersecurity requires explicit domain curiosity regarding networks and threat monitoring',
      },
      {
        name: 'Exclusively Creative/Visual Focus',
        is_major: true,
        check: (p) => p.creativity_preference === 'high_visual_design' && p.interests.every((i) => !/security|network/i.test(i)),
        reason: 'Security analysis focuses on terminal logs, protocols, and audit compliance rather than visual design',
      },
    ],
    missing_verifications: [
      {
        name: 'Network Fundamentals (TCP/IP, SIEM)',
        check: (p) => p.interests.some((i) => /network|siem|linux/i.test(i)),
        question_topic: 'Exposure to network protocols, packet inspection (Wireshark), and Linux administration',
      },
    ],
  },
};

// -------------------------------------------------------------
// CANDIDATE SERVICE IMPLEMENTATION
// -------------------------------------------------------------
export class CandidateService {
  /**
   * Deterministically evaluate alignment for a single career role
   * Strictly enforces: No false "Strong" without explicit evidence!
   */
  evaluateAlignment(
    profile: StudentCareerProfile,
    roleTitle: string,
    research: CareerRoleResearch,
    signals?: CareerSignalMap
  ): {
    alignment: QualitativeAlignment;
    supporting_signals: string[];
    potential_conflicts_or_missing: string[];
  } {
    const req = CAREER_REQUIREMENTS[roleTitle];

    // Fallback if role is not in the primary matrix
    if (!req) {
      return {
        alignment: 'Moderate',
        supporting_signals: ['General alignment with technical problem solving'],
        potential_conflicts_or_missing: ['Verify specific prerequisite skills'],
      };
    }

    const supporting: string[] = [];
    const conflicts: string[] = [];

    // 1. Evaluate Core Signals
    let coreMatches = 0;
    for (const core of req.core_signals) {
      if (core.check(profile, signals)) {
        coreMatches++;
        supporting.push(core.description);
      }
    }

    // 2. Evaluate Supporting Signals
    for (const sup of req.supporting_signals) {
      if (sup.check(profile, signals)) {
        supporting.push(sup.description);
      }
    }

    // 3. Evaluate Conflicts (Negative Evidence!)
    let hasMajorConflict = false;
    for (const conf of req.conflicts) {
      if (conf.check(profile, signals)) {
        conflicts.push(conf.reason);
        if (conf.is_major) {
          hasMajorConflict = true;
        }
      }
    }

    // 4. Evaluate Missing Verifications
    for (const missing of req.missing_verifications) {
      if (!missing.check(profile)) {
        conflicts.push(`Missing verification: ${missing.question_topic}`);
      }
    }

    // 5. Deterministic Alignment Rules
    let alignment: QualitativeAlignment = 'Limited';

    // Rule A: Any Major Conflict forbids Strong and Moderate!
    if (hasMajorConflict) {
      alignment = 'Limited';
    }
    // Rule B: Strong requires BOTH core signals matched AND zero major conflicts AND total >= 2
    else if (coreMatches >= 2 && !hasMajorConflict && supporting.length >= 2) {
      alignment = 'Strong';
    }
    // Rule C: Moderate requires at least 1 core signal matched AND zero major conflicts
    else if (coreMatches >= 1 && !hasMajorConflict) {
      alignment = 'Moderate';
    }
    // Rule D: If no core signals matched, mark Limited or Unclear
    else if (coreMatches === 0 && supporting.length === 0) {
      alignment = 'Unclear';
    } else {
      alignment = 'Limited';
    }

    return {
      alignment,
      supporting_signals: supporting.length > 0 ? supporting : ['Limited explicit profile evidence provided for this track'],
      potential_conflicts_or_missing: conflicts.length > 0 ? conflicts : ['No major conflicts detected; practical portfolio proof recommended'],
    };
  }

  /**
   * Propose plausible candidate career paths based on the structured requirement matrix
   * Ranks candidates based on actual evidence, penalizing negative conflicts
   */
  async generateCandidateTitles(
    profile: StudentCareerProfile,
    rejections: RejectionPayload[] = [],
    signals?: CareerSignalMap
  ): Promise<string[]> {
    const rejectedTitles = new Set(rejections.map((r) => r.role_title.toLowerCase()));

    const candidateScores: { title: string; score: number; hasConflict: boolean }[] = [];

    for (const [title, req] of Object.entries(CAREER_REQUIREMENTS)) {
      if (rejectedTitles.has(title.toLowerCase())) continue;

      let score = 0;
      let hasMajorConflict = false;

      // Check core signals (+3 each)
      for (const core of req.core_signals) {
        if (core.check(profile, signals)) score += 3;
      }

      // Check supporting signals (+1.5 each)
      for (const sup of req.supporting_signals) {
        if (sup.check(profile, signals)) score += 1.5;
      }

      // Check conflicts (-4 each if major)
      for (const conf of req.conflicts) {
        if (conf.check(profile, signals)) {
          if (conf.is_major) {
            hasMajorConflict = true;
            score -= 5;
          } else {
            score -= 2;
          }
        }
      }

      candidateScores.push({ title, score, hasConflict: hasMajorConflict });
    }

    // Sort by score descending
    candidateScores.sort((a, b) => b.score - a.score);

    // Pick top candidates that have positive scores
    let topCandidates = candidateScores
      .filter((c) => c.score > 0 && !c.hasConflict)
      .map((c) => c.title);

    // If fewer than 2 candidates have strictly positive score, take top available
    if (topCandidates.length < 2) {
      topCandidates = candidateScores.slice(0, 3).map((c) => c.title);
    }

    return topCandidates.slice(0, 4);
  }

  /**
   * Complete pipeline: Candidate titles -> Research -> Evidence Validation -> Explainability Synthesis
   */
  async buildRecommendations(
    profile: StudentCareerProfile,
    candidateTitles: string[],
    rejections: RejectionPayload[] = [],
    signals?: CareerSignalMap
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];

    for (let i = 0; i < candidateTitles.length; i++) {
      const title = candidateTitles[i];
      // 1. Research role with provider abstraction
      const research = await defaultResearchProvider.researchRole(title);

      // 2. Deterministically evaluate alignment and evidence
      const evalResult = this.evaluateAlignment(profile, title, research, signals);

      // 3. Synthesize honest explainability
      const explanation = await this.synthesizeExplainability(
        profile,
        title,
        research,
        evalResult.alignment,
        evalResult.supporting_signals,
        evalResult.potential_conflicts_or_missing
      );

      const marketEvidence: MarketEvidenceStrength =
        research.sources && research.sources.length >= 2
          ? 'Strong'
          : research.sources.length === 1
          ? 'Moderate'
          : 'Unavailable';

      recommendations.push({
        id: `rec-${i + 1}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        role_title: title,
        summary: `Based on your responses and the available evidence, this career appears to have ${evalResult.alignment.toLowerCase()} alignment with your profile.`,
        profile_alignment: evalResult.alignment,
        market_evidence_strength: marketEvidence,
        entry_barrier: research.entry_barrier,
        supporting_signals: evalResult.supporting_signals,
        potential_conflicts_or_missing: evalResult.potential_conflicts_or_missing,
        why_recommended: explanation,
        research,
      });
    }

    return recommendations;
  }

  /**
   * Synthesize explainability breakdown:
   * 1. Student profile signal
   * 2. Career requirement
   * 3. Research evidence
   * 4. Reason for alignment
   * 5. Important limitations / uncertainty
   */
  private async synthesizeExplainability(
    profile: StudentCareerProfile,
    roleTitle: string,
    research: CareerRoleResearch,
    alignment: QualitativeAlignment,
    supportingSignals: string[],
    conflictsOrMissing: string[]
  ): Promise<RecommendationItem['why_recommended']> {
    const ai = getGeminiClient();

    const baseline = {
      student_profile_signal: supportingSignals.slice(0, 2).join(' · '),
      career_requirement: `This role demands competence in ${research.core_skills.slice(0, 3).join(', ')}, paired with familiarity with ${research.common_tools.slice(0, 3).join(', ')}.`,
      research_evidence: research.sources[0]?.evidence_excerpt || 'Occupational data reports consistent entry-level requirements for practical verified portfolio projects and toolchain fluency.',
      alignment_reason: `Your interest and learning availability correlate constructively with entry-level skills documented for ${roleTitle}.`,
      uncertainty_or_limitations: conflictsOrMissing.slice(0, 2).join(' · '),
    };

    if (!ai) {
      return baseline;
    }

    try {
      const prompt = `Synthesize an objective, honest explanation for why "${roleTitle}" was shown to the student with an alignment rating of "${alignment}".

STUDENT SUPPORTING SIGNALS:
${supportingSignals.join('\n')}

NOTED CONFLICTS OR MISSING VERIFICATIONS:
${conflictsOrMissing.join('\n')}

CAREER RESEARCH:
- Core skills: ${research.core_skills.join(', ')}
- Barrier: ${research.entry_barrier}
- Research source: ${research.sources[0]?.evidence_excerpt || 'Governmental occupational registry'}

STRICT RULES:
- NEVER say "This is definitely the best career for you."
- Frame as: "Based on your responses and the available evidence, this career appears to have ${alignment.toLowerCase()} alignment with your profile."
- Honestly state the limitations, conflicts, and employer variations.

Return JSON:
{
  "student_profile_signal": string,
  "career_requirement": string,
  "research_evidence": string,
  "alignment_reason": string,
  "uncertainty_or_limitations": string
}`;

      const response = await ai.models.generateContent({
        model: serverConfig.geminiModel,
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective career advisor explaining alignment evidence without overstating certainty.',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '';
      let cleanJson = text;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanJson);
      return {
        student_profile_signal: parsed.student_profile_signal || baseline.student_profile_signal,
        career_requirement: parsed.career_requirement || baseline.career_requirement,
        research_evidence: parsed.research_evidence || baseline.research_evidence,
        alignment_reason: parsed.alignment_reason || baseline.alignment_reason,
        uncertainty_or_limitations: parsed.uncertainty_or_limitations || baseline.uncertainty_or_limitations,
      };
    } catch {
      return baseline;
    }
  }
}

export const candidateService = new CandidateService();
