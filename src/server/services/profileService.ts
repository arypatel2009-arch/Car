import { RawAnswerItem, StudentCareerProfile } from '../../types/career.ts';
import { getGeminiClient } from '../gemini.ts';
import { serverConfig } from '../config.ts';

export class ProfileService {
  /**
   * Deterministically extract profile signals from raw answers as a ground truth baseline.
   */
  deterministicProfile(answers: RawAnswerItem[]): StudentCareerProfile {
    const answerMap = new Map<string, any>();
    answers.forEach((a) => answerMap.set(a.question_id, a.answer_value));

    // Coding preference
    const codingVal = String(answerMap.get('coding_preference') || '').toLowerCase();
    let coding_preference: StudentCareerProfile['coding_preference'] = 'undecided';
    if (codingVal.includes('love') || codingVal.includes('deeply')) {
      coding_preference = 'loves_coding';
    } else if (codingVal.includes('practical') || codingVal.includes('tool')) {
      coding_preference = 'practical_coding';
    } else if (codingVal.includes('no') || codingVal.includes('minimal')) {
      coding_preference = 'no_code_or_minimal';
    }

    // Math interest
    const mathVal = String(answerMap.get('math_interest') || '').toLowerCase();
    let math_interest: StudentCareerProfile['math_interest'] = 'practical_applied_math';
    if (mathVal.includes('high') || mathVal.includes('advanced') || mathVal.includes('love')) {
      math_interest = 'comfortable_with_math';
    } else if (mathVal.includes('minimal') || mathVal.includes('avoid')) {
      math_interest = 'minimal_math';
    }

    // Problem solving
    const psVal = String(answerMap.get('problem_solving_preference') || '').toLowerCase();
    let problem_solving_preference: StudentCareerProfile['problem_solving_preference'] = 'analytical_logical';
    if (psVal.includes('creative') || psVal.includes('open')) {
      problem_solving_preference = 'creative_open_ended';
    } else if (psVal.includes('people') || psVal.includes('collaborative')) {
      problem_solving_preference = 'people_centric';
    } else if (psVal.includes('hands')) {
      problem_solving_preference = 'hands_on';
    }

    // Creativity
    const crVal = String(answerMap.get('creativity_preference') || '').toLowerCase();
    let creativity_preference: StudentCareerProfile['creativity_preference'] = 'moderate';
    if (crVal.includes('visual') || crVal.includes('design')) {
      creativity_preference = 'high_visual_design';
    } else if (crVal.includes('system') || crVal.includes('architecture')) {
      creativity_preference = 'system_solution_architecture';
    } else if (crVal.includes('content') || crVal.includes('writing')) {
      creativity_preference = 'content_storytelling';
    }

    // Business
    const bVal = String(answerMap.get('business_interest') || '').toLowerCase();
    let business_interest: StudentCareerProfile['business_interest'] = 'moderate';
    if (bVal.includes('high') || bVal.includes('commercial')) {
      business_interest = 'high_commercial_focus';
    } else if (bVal.includes('low') || bVal.includes('purely technical')) {
      business_interest = 'low';
    }

    // Entrepreneurship
    const eVal = String(answerMap.get('entrepreneurship_interest') || '').toLowerCase();
    let entrepreneurship_interest: StudentCareerProfile['entrepreneurship_interest'] = 'interested_in_small_teams';
    if (eVal.includes('startup') || eVal.includes('founder') || eVal.includes('build')) {
      entrepreneurship_interest = 'wants_to_build_startup';
    } else if (eVal.includes('established') || eVal.includes('corporate')) {
      entrepreneurship_interest = 'prefers_established_orgs';
    }

    // Available time
    const timeVal = answerMap.get('available_time_hours');
    let available_time_hours = 2;
    if (typeof timeVal === 'number') {
      available_time_hours = timeVal;
    } else if (typeof timeVal === 'string') {
      const match = timeVal.match(/\d+/);
      if (match) available_time_hours = parseInt(match[0], 10);
    }

    // Interests
    const rawInterests = answerMap.get('interests') || [];
    const interests = Array.isArray(rawInterests) ? rawInterests : [String(rawInterests)].filter(Boolean);

    // Work preferences
    const rawWorkPrefs = answerMap.get('work_preferences') || [];
    const work_preferences = Array.isArray(rawWorkPrefs) ? rawWorkPrefs : [String(rawWorkPrefs)].filter(Boolean);

    // Industries
    const rawIndustries = answerMap.get('industry_interests') || [];
    const industry_interests = Array.isArray(rawIndustries) ? rawIndustries : [String(rawIndustries)].filter(Boolean);

    return {
      interests: interests.length > 0 ? interests : ['Software and technology systems'],
      work_preferences: work_preferences.length > 0 ? work_preferences : ['Building practical solutions'],
      coding_preference,
      math_interest,
      problem_solving_preference,
      creativity_preference,
      business_interest,
      research_interest: 'applied_industry',
      entrepreneurship_interest,
      earning_importance: 'balanced',
      job_opportunity_importance: 'urgent_high_demand',
      stability_preference: 'balanced',
      remote_preference: 'flexible',
      available_time_hours,
      experience_level: 'beginner_student',
      education_background: String(answerMap.get('education_background') || 'Undergraduate / Student'),
      industry_interests: industry_interests.length > 0 ? industry_interests : ['Technology', 'Software Services'],
      inferred_confidence: 'HIGH',
    };
  }

  /**
   * Interpret Student Career Profile using Gemini with safety restrictions
   */
  async interpretProfile(rawAnswers: RawAnswerItem[]): Promise<StudentCareerProfile> {
    const baseline = this.deterministicProfile(rawAnswers);
    const ai = getGeminiClient();

    if (!ai) {
      return baseline;
    }

    try {
      const prompt = `Analyze these student questionnaire answers and return a structured StudentCareerProfile JSON.

RAW ANSWERS PROVIDED BY STUDENT:
${JSON.stringify(rawAnswers, null, 2)}

STRICT RULES:
1. Do NOT infer sensitive personal attributes (race, gender, religion, socioeconomic background).
2. Do NOT infer facts or background details that the student did not explicitly state.
3. Map answers strictly to valid enum keys:
   coding_preference: "loves_coding" | "practical_coding" | "no_code_or_minimal" | "undecided"
   math_interest: "comfortable_with_math" | "practical_applied_math" | "minimal_math"
   problem_solving_preference: "analytical_logical" | "creative_open_ended" | "people_centric" | "hands_on"
   creativity_preference: "high_visual_design" | "system_solution_architecture" | "content_storytelling" | "moderate"
   business_interest: "high_commercial_focus" | "moderate" | "low"
   research_interest: "deep_inquiry_science" | "moderate" | "applied_industry"
   entrepreneurship_interest: "wants_to_build_startup" | "interested_in_small_teams" | "prefers_established_orgs"
   earning_importance: "high_priority" | "balanced" | "lifestyle_first"
   job_opportunity_importance: "urgent_high_demand" | "balanced" | "niche_specialist"
   stability_preference: "high_stability_corporate" | "high_growth_dynamic" | "balanced"
   remote_preference: "remote_first" | "hybrid" | "in_person" | "flexible"
   available_time_hours: number
   experience_level: "beginner_student" | "some_projects" | "career_switcher" | "intermediate"
   education_background: string
   interests: string[]
   work_preferences: string[]
   industry_interests: string[]
   inferred_confidence: "HIGH" | "MEDIUM" | "PROVISIONAL"

Output ONLY valid JSON without markdown formatting or backticks.`;

      const response = await ai.models.generateContent({
        model: serverConfig.geminiModel,
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective career profiler. Output strictly valid JSON. Never infer unprovided personal facts.',
          temperature: 0.1,
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
        ...baseline,
        ...parsed,
        inferred_confidence: parsed.inferred_confidence || 'HIGH',
      };
    } catch (e) {
      console.warn('[ProfileService] Gemini interpretation failed, using deterministic baseline:', e);
      return baseline;
    }
  }
}

export const profileService = new ProfileService();
