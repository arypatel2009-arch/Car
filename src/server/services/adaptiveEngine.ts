import {
  AdaptiveEngineState,
  AdaptiveQuestion,
  CandidateCareerSignal,
  CareerDiscoverySession,
  CareerSignalMap,
  ContradictionRecord,
  DiscoveryMode,
  QualitativeAlignment,
  QuestionOption,
  RawAnswerItem,
  StudentCareerProfile,
} from '../../types/career.ts';
import { getGeminiClient } from '../gemini.ts';
import { serverConfig } from '../config.ts';

// -------------------------------------------------------------
// CONTROLLED QUESTION BANK DEFINITIONS (24 DIMENSIONS)
// -------------------------------------------------------------
interface BankQuestion {
  id: string;
  dimension: string;
  question_text: string;
  answer_type: 'single' | 'multiple' | 'scale';
  options: QuestionOption[];
  scale_config?: { min: number; max: number; step: number; unit: string; defaultValue: number };
  distinguishes_roles: string[];
  prerequisites?: string[];
}

export const CONTROLLED_QUESTION_BANK: BankQuestion[] = [
  // 1. Type of work enjoy (Broad orientation)
  {
    id: 'work_type_enjoy',
    dimension: 'work_type_enjoy',
    question_text: 'What kind of work excites you most when you sit down at a desk?',
    answer_type: 'single',
    options: [
      { value: 'building_apps', label: 'Building interactive software applications and web products', desc: 'Working on what users see and interact with' },
      { value: 'systems_data', label: 'Analyzing data, patterns, and intelligent algorithms', desc: 'Working with databases, predictive models, and information' },
      { value: 'visual_design', label: 'Designing user experiences, visual aesthetics, and interfaces', desc: 'Wireframing layouts and perfecting usability' },
      { value: 'protecting_systems', label: 'Investigating cybersecurity, networks, and defending infrastructure', desc: 'Securing servers and finding vulnerabilities' },
      { value: 'strategy_products', label: 'Leading product roadmaps, user discovery, and business strategy', desc: 'Prioritizing features and connecting business with tech' },
    ],
    distinguishes_roles: ['Frontend Developer', 'Backend Developer', 'AI Engineer', 'Data Analyst', 'UI/UX Designer', 'Cybersecurity Analyst', 'Product Manager'],
  },

  // 2. Coding preference
  {
    id: 'coding_preference',
    dimension: 'coding_preference',
    question_text: 'How do you honestly feel about writing computer code on a daily basis?',
    answer_type: 'single',
    options: [
      { value: 'loves_coding', label: 'I enjoy writing code or want to dive deeply into software development', desc: 'Excited to write logic, debug code, and build software architectures' },
      { value: 'practical_coding', label: 'I like code as a tool for practical queries and scripts', desc: 'Comfortable writing SQL or Python scripts, but prefer not to build full frameworks' },
      { value: 'no_code_or_minimal', label: 'I prefer minimal or no programming', desc: 'Drawn more to visual design, product management, user research, or operations' },
      { value: 'undecided', label: 'I am undecided / open to discovering how coding feels', desc: 'Curious to try building something first' },
    ],
    distinguishes_roles: ['Frontend Developer', 'Backend Developer', 'AI Engineer', 'Cybersecurity Analyst', 'UI/UX Designer', 'Product Manager'],
  },

  // 3. AI Interest
  {
    id: 'interest_in_ai',
    dimension: 'interest_in_ai',
    question_text: 'What is your interest in Artificial Intelligence and Machine Learning?',
    answer_type: 'single',
    options: [
      { value: 'ai_builder', label: 'High — I want to build AI systems, LLM pipelines, and agents', desc: 'Engineering foundational and fine-tuned AI workflows' },
      { value: 'ai_tool_user', label: 'Moderate — I want to use AI tools to accelerate my productivity', desc: 'Using AI copilots while building normal software or designs' },
      { value: 'ai_neutral', label: 'Neutral — I prefer standard engineering or design fundamentals', desc: 'Focusing on reliable software, web development, or product workflows' },
    ],
    distinguishes_roles: ['AI Engineer', 'Backend Developer', 'Data Analyst'],
  },

  // 4. Data vs Visuals
  {
    id: 'data_vs_visuals',
    dimension: 'data_vs_visuals',
    question_text: 'Which domain sounds more stimulating to spend your day in?',
    answer_type: 'single',
    options: [
      { value: 'visual_interfaces', label: 'Visual layouts, typography, design systems, and animations', desc: 'Creating tactile, beautiful human interfaces' },
      { value: 'quantitative_data', label: 'Tabular datasets, statistical trends, and metric dashboards', desc: 'Finding hidden signals in numbers and business metrics' },
      { value: 'server_architecture', label: 'Server APIs, database tables, and distributed data pipelines', desc: 'Structuring backstage data flow and backend reliability' },
    ],
    distinguishes_roles: ['Frontend Developer', 'UI/UX Designer', 'Data Analyst', 'Backend Developer'],
  },

  // 5. Problem solving preference
  {
    id: 'problem_solving_preference',
    dimension: 'problem_solving_preference',
    question_text: 'Which type of problem-solving challenges keep you most engaged?',
    answer_type: 'single',
    options: [
      { value: 'analytical_logical', label: 'Rigorous analytical logic with clear deterministic rules', desc: 'Debugging errors, optimizing algorithms, fixing test suites' },
      { value: 'creative_open_ended', label: 'Open-ended creative exploration without a single correct answer', desc: 'Exploring design variations, user psychology, prototyping' },
      { value: 'people_centric', label: 'Collaborative problem solving and stakeholder alignment', desc: 'Interviewing users, negotiating priorities, facilitating teams' },
      { value: 'investigative_forensic', label: 'Detective-like investigative analysis and threat hunting', desc: 'Tracing network logs, identifying system breaches, stress-testing' },
    ],
    distinguishes_roles: ['Backend Developer', 'UI/UX Designer', 'Product Manager', 'Cybersecurity Analyst'],
  },

  // 6. Mathematics comfort
  {
    id: 'math_comfort',
    dimension: 'math_comfort',
    question_text: 'How comfortable are you with mathematical concepts in your career?',
    answer_type: 'single',
    options: [
      { value: 'advanced_math', label: 'Comfortable with advanced mathematics (linear algebra, probability, calculus)', desc: 'Important for deep machine learning research' },
      { value: 'applied_math', label: 'Comfortable with applied practical math (statistics, percentages, basic algebra)', desc: 'Standard for data analysis, business intelligence, performance metrics' },
      { value: 'minimal_math', label: 'Prefer minimal math — focus on code logic, UI design, or product coordination', desc: 'Common for frontend engineering, UI/UX, product management' },
    ],
    distinguishes_roles: ['AI Engineer', 'Data Analyst', 'Frontend Developer', 'UI/UX Designer'],
  },

  // 7. Creativity preference
  {
    id: 'creativity_preference',
    dimension: 'creativity_preference',
    question_text: 'How do you best express your creativity?',
    answer_type: 'single',
    options: [
      { value: 'visual_design', label: 'Crafting user visual layouts, micro-interactions, and aesthetics' },
      { value: 'system_architecture', label: 'Designing clean system abstractions, database schemas, and architectures' },
      { value: 'product_storytelling', label: 'Storytelling, user problem framing, and strategic roadmaps' },
      { value: 'analytical_discovery', label: 'Formulating hypotheses and extracting novel insights from data' },
    ],
    distinguishes_roles: ['UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'Product Manager', 'Data Analyst'],
  },

  // 8. Business & Commercial interest
  {
    id: 'business_interest',
    dimension: 'business_interest',
    question_text: 'How much interest do you have in the business and commercial side of products?',
    answer_type: 'single',
    options: [
      { value: 'high_commercial', label: 'High — I care about revenue, market adoption, and customer retention', desc: 'Natural fit for Product Management and Business Intelligence' },
      { value: 'balanced', label: 'Moderate — I want to understand product goals while staying technical', desc: 'Standard for product engineers and analysts' },
      { value: 'purely_technical', label: 'Low — I prefer focusing purely on engineering or craft execution', desc: 'Focus on technical depth and code quality' },
    ],
    distinguishes_roles: ['Product Manager', 'Data Analyst', 'Backend Developer'],
  },

  // 9. Startup vs Enterprise
  {
    id: 'entrepreneurship_interest',
    dimension: 'entrepreneurship_interest',
    question_text: 'What organizational environment appeals to you most?',
    answer_type: 'single',
    options: [
      { value: 'startup_builder', label: 'Fast-moving early startup where I wear multiple hats and ship rapidly' },
      { value: 'growth_team', label: 'Mid-sized tech company with defined teams and strong mentorship' },
      { value: 'established_enterprise', label: 'Large global enterprise with structured workflows, stability, and scale' },
      { value: 'flexible_specialist', label: 'Independent technical specialist or consultant' },
    ],
    distinguishes_roles: ['Frontend Developer', 'Product Manager', 'Cybersecurity Analyst', 'Backend Developer'],
  },

  // 10. People & Communication focus
  {
    id: 'people_communication',
    dimension: 'people_communication',
    question_text: 'How much of your workday would you prefer spending in collaboration and communication?',
    answer_type: 'single',
    options: [
      { value: 'high_collaboration', label: 'High — frequent stakeholder presentations, user interviews, and cross-team alignment', desc: 'Essential for Product Managers and UX Researchers' },
      { value: 'balanced_collaboration', label: 'Balanced — daily standups, code reviews, and pair programming mixed with focused solo work', desc: 'Standard for software engineers and designers' },
      { value: 'deep_solo_focus', label: 'High solo focus — extended uninterrupted blocks for deep technical problem solving', desc: 'Preferred by backend, security, and algorithmic specialists' },
    ],
    distinguishes_roles: ['Product Manager', 'UI/UX Designer', 'Backend Developer', 'Cybersecurity Analyst'],
  },

  // 11. Security & Infrastructure curiosity
  {
    id: 'security_interest',
    dimension: 'security_interest',
    question_text: 'How interested are you in computer networks, threat defense, and ethical hacking?',
    answer_type: 'single',
    options: [
      { value: 'high_security', label: 'Very interested — intrigued by how systems are broken and defended' },
      { value: 'general_awareness', label: 'General interest — I want to write secure code, but not specialize in infosec' },
      { value: 'low_security', label: 'Low interest — prefer user-facing products or data applications' },
    ],
    distinguishes_roles: ['Cybersecurity Analyst', 'Backend Developer'],
  },

  // 12. Available learning time
  {
    id: 'available_time_hours',
    dimension: 'available_time_hours',
    question_text: 'How many hours per day can you consistently dedicate to learning and building?',
    answer_type: 'scale',
    scale_config: { min: 1, max: 8, step: 1, unit: 'hours/day', defaultValue: 3 },
    options: [],
    distinguishes_roles: ['AI Engineer', 'Backend Developer', 'Frontend Developer', 'Data Analyst'],
  },

  // 13. Current knowledge & starting point
  {
    id: 'experience_level',
    dimension: 'experience_level',
    question_text: 'What is your current starting point in tech?',
    answer_type: 'single',
    options: [
      { value: 'complete_beginner', label: 'Complete beginner — exploring possibilities from ground zero' },
      { value: 'some_intro_code', label: 'Taken an introductory class or completed basic online tutorials' },
      { value: 'built_projects', label: 'Built small self-directed projects or websites' },
      { value: 'career_switcher', label: 'Switching from another professional discipline (business, healthcare, etc.)' },
    ],
    distinguishes_roles: ['Frontend Developer', 'Data Analyst', 'AI Engineer'],
  },

  // 14. Target industry preference
  {
    id: 'industry_interests',
    dimension: 'industry_interests',
    question_text: 'Which industry domains sound most exciting for you to work in?',
    answer_type: 'multiple',
    options: [
      { value: 'Software & SaaS', label: 'Developer tools & cloud software' },
      { value: 'FinTech & Banking', label: 'FinTech, crypto, & modern payment rails' },
      { value: 'HealthTech & Bio', label: 'Healthcare, wellness, & medical software' },
      { value: 'E-Commerce & Consumer', label: 'E-commerce, consumer apps, & creator platforms' },
      { value: 'Critical Infrastructure', label: 'Defense, government, & enterprise security' },
    ],
    distinguishes_roles: ['Cybersecurity Analyst', 'FinTech Analyst', 'Frontend Developer'],
  },
];

// -------------------------------------------------------------
// ADAPTIVE ENGINE IMPLEMENTATION
// -------------------------------------------------------------
export class AdaptiveEngine {
  /**
   * Initialize or resume state for a discovery session
   */
  initializeState(sessionId: string, mode: DiscoveryMode, initialInput?: string, compareRoles?: string[]): AdaptiveEngineState {
    const defaultSignals: CareerSignalMap = {
      coding_affinity: 0.5,
      math_affinity: 0.5,
      visual_creativity: 0.5,
      system_architecture: 0.5,
      data_analysis: 0.5,
      business_product: 0.5,
      security_systems: 0.5,
      people_leadership: 0.5,
      research_depth: 0.5,
      autonomy_startup: 0.5,
      time_bandwidth_hours: 3,
    };

    let firstQuestion: AdaptiveQuestion;
    let focusArea = 'Understanding your core interests';

    if (mode === 'direct_goal' && initialInput) {
      focusArea = `Verifying compatibility with ${initialInput}`;
      firstQuestion = this.generateDirectGoalVerificationQuestion(initialInput, 1, defaultSignals);
    } else if (mode === 'compare_ideas' && compareRoles && compareRoles.length >= 2) {
      focusArea = `Distinguishing between ${compareRoles.slice(0, 3).join(', ')}`;
      firstQuestion = this.generateCompareDistinguishingQuestion(compareRoles, 1, defaultSignals);
    } else {
      // Adaptive discovery: start with broad orientation question
      const q = CONTROLLED_QUESTION_BANK[0];
      firstQuestion = {
        question_id: q.id,
        dimension: q.dimension,
        question_text: q.question_text,
        context_note: "Let's discover the career path that best matches your natural strengths.",
        answer_type: q.answer_type,
        options: q.options,
        scale_config: q.scale_config,
      };
    }

    const candidateSignals = this.computeCandidateSignals(defaultSignals, mode, initialInput, compareRoles);

    return {
      session_id: sessionId,
      mode,
      questions_answered_count: 0,
      is_sufficient: false,
      current_focus_area: focusArea,
      current_question: firstQuestion,
      answered_dimensions: [],
      unresolved_dimensions: ['coding_preference', 'problem_solving_preference', 'math_comfort', 'work_type_enjoy'],
      active_contradictions: [],
      candidate_signals: candidateSignals,
      signals: defaultSignals,
    };
  }

  /**
   * Process a student's answer:
   * 1. Update signals
   * 2. Detect contradictions
   * 3. Evaluate candidate ranks
   * 4. Check stopping criteria
   * 5. Select next best question
   */
  async processAnswer(
    currentState: AdaptiveEngineState,
    questionId: string,
    answerValue: any,
    rawAnswers: RawAnswerItem[]
  ): Promise<AdaptiveEngineState> {
    const updatedAnsweredCount = currentState.questions_answered_count + 1;
    const answeredDims = Array.from(new Set([...currentState.answered_dimensions, questionId]));

    // 1. Update internal signals deterministically based on answer
    const updatedSignals = this.updateSignalsFromAnswer(currentState.signals, questionId, answerValue);

    // 2. Contradiction Detection
    const contradiction = this.detectContradiction(questionId, answerValue, currentState, rawAnswers);
    let activeContradictions = [...currentState.active_contradictions];

    if (contradiction) {
      activeContradictions.push(contradiction);
    }

    // Check if this was a clarification answering an active contradiction
    if (questionId.startsWith('clarify_')) {
      const relatedContradictionId = questionId.replace('clarify_', '');
      activeContradictions = activeContradictions.map((c) =>
        c.id === relatedContradictionId ? { ...c, resolved: true, resolved_value: String(answerValue) } : c
      );
    }

    // 3. Compute updated candidate career signals
    const updatedCandidates = this.computeCandidateSignals(
      updatedSignals,
      currentState.mode,
      currentState.candidate_signals[0]?.role_title,
      currentState.candidate_signals.map((c) => c.role_title)
    );

    // 4. Check Stopping Criteria (Dynamic Stopping Logic)
    const unresolvedContradictions = activeContradictions.filter((c) => !c.resolved);
    const sufficiency = this.evaluateSufficiency(
      currentState.mode,
      updatedAnsweredCount,
      updatedSignals,
      answeredDims,
      updatedCandidates,
      unresolvedContradictions
    );

    // If sufficient evidence reached, finish questioning
    if (sufficiency.is_sufficient) {
      return {
        ...currentState,
        questions_answered_count: updatedAnsweredCount,
        is_sufficient: true,
        stopping_rationale: sufficiency.rationale,
        current_focus_area: 'Sufficient career alignment evidence established',
        current_question: null,
        answered_dimensions: answeredDims,
        unresolved_dimensions: [],
        active_contradictions: activeContradictions,
        candidate_signals: updatedCandidates,
        signals: updatedSignals,
      };
    }

    // 5. Select Next Best Question
    // Priority A: If an active contradiction exists, ask a clarification question immediately!
    if (unresolvedContradictions.length > 0) {
      const topContradiction = unresolvedContradictions[0];
      const clarificationQ: AdaptiveQuestion = {
        question_id: `clarify_${topContradiction.id}`,
        dimension: topContradiction.dimension,
        question_text: topContradiction.clarification_question,
        context_note: 'Clarification Check',
        answer_type: 'single',
        is_clarification: true,
        clarification_target: {
          original_dimension: topContradiction.dimension,
          conflicting_statement: topContradiction.conflicting_statement,
        },
        options: [
          { value: 'prefer_first', label: topContradiction.earlier_statement },
          { value: 'prefer_second', label: topContradiction.conflicting_statement },
          { value: 'somewhere_between', label: 'Somewhere in between / I am still discovering this' },
        ],
      };

      return {
        ...currentState,
        questions_answered_count: updatedAnsweredCount,
        is_sufficient: false,
        current_focus_area: 'Resolving conflicting preferences',
        current_question: clarificationQ,
        answered_dimensions: answeredDims,
        active_contradictions: activeContradictions,
        candidate_signals: updatedCandidates,
        signals: updatedSignals,
      };
    }

    // Priority B: Branch A (Targeted Verification)
    if (currentState.mode === 'direct_goal') {
      const targetRole = currentState.candidate_signals[0]?.role_title || 'Software Engineer';
      const nextQ = this.generateDirectGoalVerificationQuestion(
        targetRole,
        updatedAnsweredCount + 1,
        updatedSignals,
        answeredDims
      );

      return {
        ...currentState,
        questions_answered_count: updatedAnsweredCount,
        is_sufficient: false,
        current_focus_area: `Verifying prerequisites for ${targetRole}`,
        current_question: nextQ,
        answered_dimensions: answeredDims,
        active_contradictions: activeContradictions,
        candidate_signals: updatedCandidates,
        signals: updatedSignals,
      };
    }

    // Priority C: Branch C (Compare Ideas Targeted Distinguishing)
    if (currentState.mode === 'compare_ideas') {
      const roles = currentState.candidate_signals.map((c) => c.role_title);
      const nextQ = this.generateCompareDistinguishingQuestion(
        roles,
        updatedAnsweredCount + 1,
        updatedSignals,
        answeredDims
      );

      return {
        ...currentState,
        questions_answered_count: updatedAnsweredCount,
        is_sufficient: false,
        current_focus_area: `Differentiating ${roles.slice(0, 2).join(' vs ')}`,
        current_question: nextQ,
        answered_dimensions: answeredDims,
        active_contradictions: activeContradictions,
        candidate_signals: updatedCandidates,
        signals: updatedSignals,
      };
    }

    // Priority D: Adaptive Discovery — Select highest-information question from Bank
    const nextBankQ = this.selectHighestInformationQuestion(
      updatedSignals,
      answeredDims,
      updatedCandidates
    );

    let nextQuestion: AdaptiveQuestion;
    if (nextBankQ) {
      // Personalize context note
      const contextNote = this.generateContextualNote(questionId, answerValue, nextBankQ.dimension);

      nextQuestion = {
        question_id: nextBankQ.id,
        dimension: nextBankQ.dimension,
        question_text: nextBankQ.question_text,
        context_note: contextNote,
        answer_type: nextBankQ.answer_type,
        options: nextBankQ.options,
        scale_config: nextBankQ.scale_config,
      };
    } else {
      // Fallback: If bank exhausted, stop questioning
      return {
        ...currentState,
        questions_answered_count: updatedAnsweredCount,
        is_sufficient: true,
        stopping_rationale: 'Comprehensive dimensional coverage reached',
        current_focus_area: 'Discovery complete',
        current_question: null,
        answered_dimensions: answeredDims,
        unresolved_dimensions: [],
        active_contradictions: activeContradictions,
        candidate_signals: updatedCandidates,
        signals: updatedSignals,
      };
    }

    // Identify current focus area
    const top2 = updatedCandidates.slice(0, 2).map((c) => c.role_title);
    const focusArea =
      top2.length === 2
        ? `Distinguishing between ${top2[0]} and ${top2[1]}`
        : 'Exploring core technical and problem-solving affinities';

    return {
      ...currentState,
      questions_answered_count: updatedAnsweredCount,
      is_sufficient: false,
      current_focus_area: focusArea,
      current_question: nextQuestion,
      answered_dimensions: answeredDims,
      active_contradictions: activeContradictions,
      candidate_signals: updatedCandidates,
      signals: updatedSignals,
    };
  }

  /**
   * Update internal signal weights based on user answer
   */
  private updateSignalsFromAnswer(
    signals: CareerSignalMap,
    questionId: string,
    answerValue: any
  ): CareerSignalMap {
    const updated = { ...signals };
    const strVal = String(answerValue).toLowerCase();

    switch (questionId) {
      case 'work_type_enjoy':
        if (strVal.includes('building_apps')) {
          updated.coding_affinity = Math.min(1.0, updated.coding_affinity + 0.3);
          updated.visual_creativity = Math.min(1.0, updated.visual_creativity + 0.2);
        } else if (strVal.includes('systems_data')) {
          updated.data_analysis = Math.min(1.0, updated.data_analysis + 0.35);
          updated.math_affinity = Math.min(1.0, updated.math_affinity + 0.2);
        } else if (strVal.includes('visual_design')) {
          updated.visual_creativity = Math.min(1.0, updated.visual_creativity + 0.4);
          updated.coding_affinity = Math.max(0.1, updated.coding_affinity - 0.1);
        } else if (strVal.includes('protecting_systems')) {
          updated.security_systems = Math.min(1.0, updated.security_systems + 0.45);
          updated.system_architecture = Math.min(1.0, updated.system_architecture + 0.2);
        } else if (strVal.includes('strategy_products')) {
          updated.business_product = Math.min(1.0, updated.business_product + 0.4);
          updated.people_leadership = Math.min(1.0, updated.people_leadership + 0.3);
        }
        break;

      case 'coding_preference':
      case 'verify_coding':
        if (strVal.includes('loves_coding') || strVal.includes('high_coding')) {
          updated.coding_affinity = 0.9;
        } else if (strVal.includes('practical_coding') || strVal.includes('moderate')) {
          updated.coding_affinity = 0.6;
        } else if (strVal.includes('no_code_or_minimal') || strVal.includes('dislike')) {
          updated.coding_affinity = 0.1;
        }
        break;

      case 'interest_in_ai':
        if (strVal.includes('ai_builder')) {
          updated.research_depth = Math.min(1.0, updated.research_depth + 0.3);
          updated.data_analysis = Math.min(1.0, updated.data_analysis + 0.2);
        }
        break;

      case 'data_vs_visuals':
        if (strVal.includes('visual_interfaces')) {
          updated.visual_creativity = Math.min(1.0, updated.visual_creativity + 0.35);
          updated.data_analysis = Math.max(0.2, updated.data_analysis - 0.2);
        } else if (strVal.includes('quantitative_data')) {
          updated.data_analysis = Math.min(1.0, updated.data_analysis + 0.35);
          updated.visual_creativity = Math.max(0.2, updated.visual_creativity - 0.2);
        } else if (strVal.includes('server_architecture')) {
          updated.system_architecture = Math.min(1.0, updated.system_architecture + 0.35);
        }
        break;

      case 'problem_solving_preference':
        if (strVal.includes('analytical_logical')) {
          updated.system_architecture = Math.min(1.0, updated.system_architecture + 0.2);
        } else if (strVal.includes('creative_open_ended')) {
          updated.visual_creativity = Math.min(1.0, updated.visual_creativity + 0.25);
        } else if (strVal.includes('people_centric')) {
          updated.people_leadership = Math.min(1.0, updated.people_leadership + 0.3);
        } else if (strVal.includes('investigative_forensic')) {
          updated.security_systems = Math.min(1.0, updated.security_systems + 0.3);
        }
        break;

      case 'math_comfort':
      case 'verify_math':
        if (strVal.includes('advanced')) {
          updated.math_affinity = 0.9;
        } else if (strVal.includes('applied')) {
          updated.math_affinity = 0.6;
        } else if (strVal.includes('minimal')) {
          updated.math_affinity = 0.15;
        }
        break;

      case 'business_interest':
        if (strVal.includes('high_commercial')) {
          updated.business_product = 0.85;
        } else if (strVal.includes('purely_technical')) {
          updated.business_product = 0.2;
        }
        break;

      case 'people_communication':
        if (strVal.includes('high_collaboration')) {
          updated.people_leadership = 0.85;
        } else if (strVal.includes('deep_solo_focus')) {
          updated.people_leadership = 0.2;
        }
        break;

      case 'security_interest':
        if (strVal.includes('high_security')) {
          updated.security_systems = 0.9;
        }
        break;

      case 'available_time_hours':
      case 'verify_time':
        const num = typeof answerValue === 'number' ? answerValue : parseInt(answerValue, 10);
        if (!isNaN(num)) updated.time_bandwidth_hours = num;
        break;
    }

    return updated;
  }

  /**
   * Detect contradictions between earlier signals and current answers
   */
  private detectContradiction(
    questionId: string,
    answerValue: any,
    state: AdaptiveEngineState,
    rawAnswers: RawAnswerItem[]
  ): ContradictionRecord | null {
    const strVal = String(answerValue).toLowerCase();

    // Contradiction Pattern 1: Dislikes coding earlier, but later selects deep software/AI track
    const codingAnswer = rawAnswers.find((a) => a.question_id === 'coding_preference');
    if (codingAnswer) {
      const earlierCoding = String(codingAnswer.answer_value).toLowerCase();
      if (earlierCoding.includes('no_code_or_minimal')) {
        if (
          questionId === 'interest_in_ai' && strVal.includes('ai_builder')
        ) {
          return {
            id: `contra-${Date.now()}`,
            dimension: 'coding_vs_ai_engineering',
            earlier_statement: "Earlier you expressed a preference for minimal or no programming.",
            conflicting_statement: "Now you selected building deep AI systems, which requires intensive coding and algorithms.",
            clarification_question: "You mentioned earlier that you don't enjoy coding, but you are also interested in building AI systems. Which statement is closer to how you currently feel?",
            resolved: false,
            detected_at: new Date().toISOString(),
          };
        }

        if (
          questionId === 'verify_role_interest' &&
          (strVal.includes('backend') || strVal.includes('ai engineer'))
        ) {
          return {
            id: `contra-${Date.now()}`,
            dimension: 'coding_vs_backend',
            earlier_statement: "You previously stated you prefer minimal or no coding.",
            conflicting_statement: "This target career requires extensive server-side programming daily.",
            clarification_question: "Building this career involves writing logic and debugging code daily. Would you be willing to embrace coding for this role?",
            resolved: false,
            detected_at: new Date().toISOString(),
          };
        }
      }
    }

    // Contradiction Pattern 2: Dislikes math, but later selects advanced mathematical machine learning
    const mathAnswer = rawAnswers.find((a) => a.question_id === 'math_comfort');
    if (mathAnswer) {
      const earlierMath = String(mathAnswer.answer_value).toLowerCase();
      if (earlierMath.includes('minimal_math')) {
        if (questionId === 'interest_in_ai' && strVal.includes('ai_builder')) {
          return {
            id: `contra-${Date.now()}`,
            dimension: 'math_vs_ai_research',
            earlier_statement: "You mentioned preferring minimal mathematics.",
            conflicting_statement: "Machine learning engineering often relies on probability, vectors, and linear algebra.",
            clarification_question: "Developing machine learning models involves mathematical foundations. How open are you to learning applied math for this direction?",
            resolved: false,
            detected_at: new Date().toISOString(),
          };
        }
      }
    }

    return null;
  }

  /**
   * Compute normalized candidate career scores from internal signals
   */
  private computeCandidateSignals(
    signals: CareerSignalMap,
    mode: DiscoveryMode,
    directRole?: string,
    compareRoles?: string[]
  ): CandidateCareerSignal[] {
    const candidateRoster: {
      role: string;
      calc: (s: CareerSignalMap) => { score: number; supporting: string[]; opposing: string[]; unresolved: string[] };
    }[] = [
      {
        role: 'Frontend Developer',
        calc: (s) => {
          let score = s.coding_affinity * 0.4 + s.visual_creativity * 0.35 + s.system_architecture * 0.25;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.coding_affinity > 0.5) supporting.push('Enjoys writing code and building software');
          if (s.visual_creativity > 0.5) supporting.push('Appreciates visual interfaces and user experiences');
          if (s.coding_affinity < 0.3) opposing.push('Prefers minimal coding');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['responsive design experience', 'framework familiarity'],
          };
        },
      },
      {
        role: 'Backend Developer',
        calc: (s) => {
          let score = s.coding_affinity * 0.45 + s.system_architecture * 0.35 + (1 - s.visual_creativity) * 0.2;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.coding_affinity > 0.6) supporting.push('High affinity for logical programming and systems');
          if (s.system_architecture > 0.6) supporting.push('Interest in databases and server architectures');
          if (s.coding_affinity < 0.3) opposing.push('Low coding preference conflicts with backend requirements');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['database design comfort'],
          };
        },
      },
      {
        role: 'AI Engineer',
        calc: (s) => {
          let score = s.coding_affinity * 0.35 + s.data_analysis * 0.3 + s.math_affinity * 0.25 + s.research_depth * 0.1;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.coding_affinity > 0.6) supporting.push('Strong programming foundation');
          if (s.data_analysis > 0.5) supporting.push('Curious about intelligent data pipelines and models');
          if (s.math_affinity < 0.3) opposing.push('Minimal math preference may limit advanced model tuning');
          if (s.coding_affinity < 0.3) opposing.push('Low coding comfort conflicts with AI engineering');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['LLM framework exposure', 'applied statistics comfort'],
          };
        },
      },
      {
        role: 'Data Analyst',
        calc: (s) => {
          let score = s.data_analysis * 0.45 + s.math_affinity * 0.25 + s.business_product * 0.3;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.data_analysis > 0.5) supporting.push('Drawn to quantitative patterns and dashboards');
          if (s.business_product > 0.4) supporting.push('Interest in answering business questions with data');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['SQL query comfort', 'dashboard tooling'],
          };
        },
      },
      {
        role: 'UI/UX Designer',
        calc: (s) => {
          let score = s.visual_creativity * 0.5 + (1 - s.coding_affinity) * 0.25 + s.people_leadership * 0.25;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.visual_creativity > 0.6) supporting.push('High visual design and user empathy orientation');
          if (s.coding_affinity < 0.4) supporting.push('Zero/low-code path aligns with non-programming preference');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['Figma prototyping portfolio'],
          };
        },
      },
      {
        role: 'Product Manager',
        calc: (s) => {
          let score = s.business_product * 0.4 + s.people_leadership * 0.35 + (s.coding_affinity > 0.3 ? 0.25 : 0.1);
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.business_product > 0.5) supporting.push('Strong commercial and roadmap intuition');
          if (s.people_leadership > 0.5) supporting.push('Enjoys cross-functional collaboration and stakeholder alignment');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['prioritization framework fluency'],
          };
        },
      },
      {
        role: 'Cybersecurity Analyst',
        calc: (s) => {
          let score = s.security_systems * 0.5 + s.system_architecture * 0.3 + (1 - s.visual_creativity) * 0.2;
          const supporting: string[] = [];
          const opposing: string[] = [];
          if (s.security_systems > 0.5) supporting.push('Interest in system defense and threat investigation');
          return {
            score,
            supporting,
            opposing,
            unresolved: ['network protocols (TCP/IP) exposure'],
          };
        },
      },
    ];

    let results = candidateRoster.map((item) => {
      const evaluation = item.calc(signals);
      let alignment: QualitativeAlignment = 'Moderate';
      if (evaluation.score >= 0.65) alignment = 'Strong';
      else if (evaluation.score < 0.45) alignment = 'Limited';

      return {
        role_title: item.role,
        score: evaluation.score,
        alignment,
        supporting_signals: evaluation.supporting,
        opposing_signals: evaluation.opposing,
        unresolved_dimensions: evaluation.unresolved,
      };
    });

    // If in compare_ideas mode, filter to compareRoles
    if (mode === 'compare_ideas' && compareRoles && compareRoles.length >= 2) {
      const lowerTargets = compareRoles.map((r) => r.toLowerCase());
      results = results.filter((c) => lowerTargets.some((t) => c.role_title.toLowerCase().includes(t) || t.includes(c.role_title.toLowerCase())));
    } else if (mode === 'direct_goal' && directRole) {
      const lower = directRole.toLowerCase();
      // Ensure the direct role is placed top
      results.sort((a, b) => {
        if (a.role_title.toLowerCase().includes(lower)) return -1;
        if (b.role_title.toLowerCase().includes(lower)) return 1;
        return b.score - a.score;
      });
      return results.slice(0, 4);
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Stopping criteria evaluation:
   * Dynamic: stops when enough information exists to compare top paths, or when technical safety bound reached.
   */
  private evaluateSufficiency(
    mode: DiscoveryMode,
    questionsAnswered: number,
    signals: CareerSignalMap,
    answeredDims: string[],
    candidates: CandidateCareerSignal[],
    unresolvedContradictions: ContradictionRecord[]
  ): { is_sufficient: boolean; rationale?: string } {
    // Cannot stop if an active contradiction is unresolved
    if (unresolvedContradictions.length > 0) {
      return { is_sufficient: false };
    }

    // Technical safety ceiling (prevents infinite questioning)
    if (questionsAnswered >= 20) {
      return {
        is_sufficient: true,
        rationale: 'Comprehensive question limit reached. Formulating career shortlist based on available signals.',
      };
    }

    // Branch A (Direct Goal verification):
    // Requires verifying coding comfort, math/logic alignment, and available time (typically 3-5 questions)
    if (mode === 'direct_goal') {
      if (questionsAnswered >= 3 && answeredDims.includes('verify_coding')) {
        return {
          is_sufficient: true,
          rationale: `Targeted verification completed for ${candidates[0]?.role_title}. Ready for labor research confirmation.`,
        };
      }
      return { is_sufficient: false };
    }

    // Branch C (Compare Ideas):
    // Differentiates the selected 2-5 roles (typically 3-6 questions)
    if (mode === 'compare_ideas') {
      if (questionsAnswered >= 3 && answeredDims.length >= 3) {
        return {
          is_sufficient: true,
          rationale: 'Key distinguishing dimensions resolved between candidate roles.',
        };
      }
      return { is_sufficient: false };
    }

    // Branch B (Adaptive Discovery):
    // Minimum 5 questions required before any early exit
    if (questionsAnswered < 5) {
      return { is_sufficient: false };
    }

    // Has student established the fundamental pillars?
    const hasCoreOrientation = answeredDims.includes('work_type_enjoy');
    const hasCodingSignal = answeredDims.includes('coding_preference');
    const hasProblemSolving = answeredDims.includes('problem_solving_preference') || answeredDims.includes('data_vs_visuals');
    const hasTimeSignal = answeredDims.includes('available_time_hours');

    if (!hasCoreOrientation || !hasCodingSignal) {
      return { is_sufficient: false };
    }

    // Check separation between top candidate and 3rd candidate
    const topScore = candidates[0]?.score || 0;
    const thirdScore = candidates[2]?.score || 0;
    const scoreSpread = topScore - thirdScore;

    // Student A (decisive answers, strong separation): stops early at 6-8 questions
    if (questionsAnswered >= 6 && scoreSpread >= 0.35 && hasProblemSolving) {
      return {
        is_sufficient: true,
        rationale: 'Clear distinction established across candidate career paths with strong profile alignment.',
      };
    }

    // Student B (moderate separation): stops at 9-12 questions
    if (questionsAnswered >= 9 && scoreSpread >= 0.20 && (hasProblemSolving || hasTimeSignal)) {
      return {
        is_sufficient: true,
        rationale: 'Sufficient dimensional evidence gathered to present nuanced candidate comparison.',
      };
    }

    // Student C (ambiguous, close scores): stops around 13-16 questions
    if (questionsAnswered >= 14) {
      return {
        is_sufficient: true,
        rationale: 'Explored core spectrum of technical, creative, and organizational dimensions.',
      };
    }

    return { is_sufficient: false };
  }

  /**
   * Selects highest-value next question from the bank to distinguish remaining candidate ties
   */
  private selectHighestInformationQuestion(
    signals: CareerSignalMap,
    answeredDims: string[],
    candidates: CandidateCareerSignal[]
  ): BankQuestion | null {
    const unaskedQuestions = CONTROLLED_QUESTION_BANK.filter((q) => !answeredDims.includes(q.id));
    if (unaskedQuestions.length === 0) return null;

    const topCandidateRoles = candidates.slice(0, 3).map((c) => c.role_title);

    // Score each unasked question by how many of the top 3 candidates it distinguishes
    let bestQuestion = unaskedQuestions[0];
    let maxRelevance = -1;

    for (const q of unaskedQuestions) {
      let relevance = 0;
      for (const role of topCandidateRoles) {
        if (q.distinguishes_roles.includes(role)) {
          relevance += 2;
        }
      }

      // Prioritize missing foundational dimensions early
      if (['coding_preference', 'problem_solving_preference', 'data_vs_visuals'].includes(q.id)) {
        relevance += 3;
      }

      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestQuestion = q;
      }
    }

    return bestQuestion;
  }

  /**
   * Conversational context note generation
   */
  private generateContextualNote(prevQuestionId: string, prevAnswer: any, nextDimension: string): string {
    const val = String(prevAnswer).toLowerCase();
    if (prevQuestionId === 'work_type_enjoy') {
      if (val.includes('building_apps')) return 'Got it — you like creating user-facing software.';
      if (val.includes('systems_data')) return 'Understood — you are intrigued by data and predictive patterns.';
      if (val.includes('visual_design')) return 'Nice — you have an eye for visual design and interface ergonomics.';
      if (val.includes('protecting_systems')) return 'Fascinating — security and network defense require analytical rigor.';
    }

    if (prevQuestionId === 'coding_preference') {
      if (val.includes('loves_coding')) return 'Great to know you enjoy programming logic.';
      if (val.includes('no_code')) return 'Understood — prioritizing zero/low-code disciplines and design.';
    }

    return 'Continuing your career discovery...';
  }

  /**
   * Branch A: Targeted Verification Question Generator
   */
  private generateDirectGoalVerificationQuestion(
    targetRole: string,
    step: number,
    signals: CareerSignalMap,
    answeredDims: string[] = []
  ): AdaptiveQuestion {
    if (step === 1 || !answeredDims.includes('verify_appeal')) {
      return {
        question_id: 'verify_appeal',
        dimension: 'verify_appeal',
        question_text: `What specifically attracts you to becoming a ${targetRole}?`,
        context_note: `Let's verify what draws you to ${targetRole}.`,
        answer_type: 'single',
        options: [
          { value: 'building_products', label: 'The satisfaction of building and shipping tangible solutions' },
          { value: 'intellectual_challenge', label: 'The deep intellectual and problem-solving challenge' },
          { value: 'high_market_demand', label: 'Strong market opportunities and industry relevance' },
          { value: 'creative_freedom', label: 'The creative craft and visual/interactive possibilities' },
        ],
      };
    }

    if (!answeredDims.includes('verify_coding')) {
      return {
        question_id: 'verify_coding',
        dimension: 'verify_coding',
        question_text: `A ${targetRole} often interacts with code, architectures, or technical tools. How ready are you for this?`,
        context_note: 'Verifying core technical prerequisite',
        answer_type: 'single',
        options: [
          { value: 'loves_coding', label: 'Eager to code and build software frameworks daily' },
          { value: 'practical_coding', label: 'Comfortable using code and scripts as practical tools' },
          { value: 'no_code_or_minimal', label: 'I strongly dislike coding — prefer visual or managerial work' },
        ],
      };
    }

    if (!answeredDims.includes('verify_time')) {
      return {
        question_id: 'verify_time',
        dimension: 'verify_time',
        question_text: `Transitioning into ${targetRole} requires dedicated milestone projects. How much daily time can you commit?`,
        answer_type: 'scale',
        scale_config: { min: 1, max: 8, step: 1, unit: 'hours/day', defaultValue: 3 },
        options: [],
      };
    }

    // Default final verification check
    return {
      question_id: 'verify_learning_style',
      dimension: 'verify_learning_style',
      question_text: `How do you prefer mastering the skills required for ${targetRole}?`,
      answer_type: 'single',
      options: [
        { value: 'hands_on_projects', label: 'Building realistic portfolio projects from scratch' },
        { value: 'guided_curriculum', label: 'Structured step-by-step roadmaps and guided documentation' },
        { value: 'mentorship_feedback', label: 'Code reviews and feedback on practical work' },
      ],
    };
  }

  /**
   * Branch C: Compare Ideas Distinguishing Question Generator
   */
  private generateCompareDistinguishingQuestion(
    compareRoles: string[],
    step: number,
    signals: CareerSignalMap,
    answeredDims: string[] = []
  ): AdaptiveQuestion {
    const roleList = compareRoles.slice(0, 3).join(', ');

    if (step === 1 || !answeredDims.includes('compare_primary_preference')) {
      return {
        question_id: 'compare_primary_preference',
        dimension: 'compare_primary_preference',
        question_text: `Between ${compareRoles.slice(0, 2).join(' and ')}, which core daily activity sounds most rewarding to you?`,
        context_note: 'Distinguishing candidate career ideas',
        answer_type: 'single',
        options: [
          { value: 'building_user_facing', label: 'Designing and building the user-facing product experience' },
          { value: 'engineering_infrastructure', label: 'Architecting robust server backends, APIs, and data flows' },
          { value: 'extracting_data_insights', label: 'Analyzing datasets and generating visual intelligence metrics' },
          { value: 'training_ai_systems', label: 'Integrating generative AI, vector models, and intelligent agents' },
        ],
      };
    }

    if (!answeredDims.includes('coding_preference')) {
      return {
        question_id: 'coding_preference',
        dimension: 'coding_preference',
        question_text: `Some of your selected paths (${roleList}) require heavy daily coding, while others focus more on analysis or UX. Where is your coding comfort?`,
        answer_type: 'single',
        options: [
          { value: 'loves_coding', label: 'High — I want heavy daily programming' },
          { value: 'practical_coding', label: 'Moderate — happy with SQL, Python scripts, or UI styling' },
          { value: 'no_code_or_minimal', label: 'Low — prefer visual, strategic, or zero-code execution' },
        ],
      };
    }

    return {
      question_id: 'math_comfort',
      dimension: 'math_comfort',
      question_text: `To distinguish between algorithmic depth and product execution across your choices, what is your math preference?`,
      answer_type: 'single',
      options: [
        { value: 'advanced_math', label: 'Comfortable with advanced mathematical modeling' },
        { value: 'applied_math', label: 'Comfortable with applied metrics, statistics, and percentages' },
        { value: 'minimal_math', label: 'Prefer minimal math — focus on craft and clean logic' },
      ],
    };
  }
}

export const adaptiveEngine = new AdaptiveEngine();
