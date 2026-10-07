/**
 * CareerOS Phase 2 — Adaptive Skill Assessment Service
 * Targeted, lightweight diagnostic checks and evidence-based proficiency calibration.
 */

import {
  CareerSkill,
  SkillAssessment,
  SkillAssessmentResult,
  SkillProficiency,
  StudentSkillState,
} from '../../types/learning.ts';
import { StudentCareerProfile } from '../../types/career.ts';

// Pre-configured diagnostic checks for standard skills
const ASSESSMENTS_REGISTRY: Record<string, SkillAssessment> = {
  'Python Programming': {
    id: 'assess-py',
    skill_id: 'skill-py-fund',
    skill_name: 'Python Programming',
    role_title: 'AI Engineer',
    pass_threshold_percentage: 60,
    questions: [
      {
        id: 'py-q1',
        question: 'What is the primary difference between a Python list and a tuple?',
        options: [
          'Lists are mutable and can be modified after creation, while tuples are immutable.',
          'Tuples can only store numbers while lists can store any object.',
          'Lists use parentheses while tuples use square brackets.',
          'Tuples execute in O(n^2) time while lists execute in O(1).',
        ],
        correct_index: 0,
        explanation: 'Lists are mutable sequences enclosed in [], whereas tuples are immutable fixed sequences in ().',
        targeted_concept: 'Python Data Structures & Mutability',
      },
      {
        id: 'py-q2',
        question: 'In Python function definitions, what does `*args` and `**kwargs` allow you to do?',
        options: [
          'Declare pointer addresses in memory.',
          'Accept arbitrary numbers of positional and keyword arguments dynamically.',
          'Force strict static type assertions.',
          'Create multi-threaded execution loops.',
        ],
        correct_index: 1,
        explanation: '`*args` gathers excess positional arguments as a tuple; `**kwargs` gathers excess keyword arguments as a dictionary.',
        targeted_concept: 'Function Arguments & Unpacking',
      },
      {
        id: 'py-q3',
        question: 'What is a Python generator and how is it created?',
        options: [
          'A compiler that translates Python into C code.',
          'A function that yields values lazily one-at-a-time using the `yield` keyword instead of `return`.',
          'A hardware accelerator module for GPU computing.',
          'An external package used only for generating random numbers.',
        ],
        correct_index: 1,
        explanation: 'Generators yield values lazily using `yield`, saving memory by not loading entire datasets into RAM at once.',
        targeted_concept: 'Generators & Memory Efficiency',
      },
    ],
  },
  'Linear Algebra': {
    id: 'assess-linalg',
    skill_id: 'skill-math-linalg',
    skill_name: 'Linear Algebra',
    role_title: 'AI Engineer',
    pass_threshold_percentage: 60,
    questions: [
      {
        id: 'linalg-q1',
        question: 'If matrix A has dimension 3x4 and matrix B has dimension 4x2, what is the dimension of the product AB?',
        options: ['3x2', '4x4', '3x4', 'Cannot be multiplied'],
        correct_index: 0,
        explanation: 'Matrix multiplication requires inner dimensions to match (4=4). Result dimension is outer (3x2).',
        targeted_concept: 'Matrix Multiplication Dimensions',
      },
      {
        id: 'linalg-q2',
        question: 'What does the dot product of two normalized (unit) vectors measure in vector space?',
        options: [
          'The sum of their lengths.',
          'The cosine of the angle between them (cosine similarity).',
          'The cross-product determinant.',
          'The Euclidean distance between their origins.',
        ],
        correct_index: 1,
        explanation: 'For unit vectors u and v, u · v = cos(θ), directly calculating semantic cosine similarity used in embeddings.',
        targeted_concept: 'Dot Product & Cosine Similarity',
      },
      {
        id: 'linalg-q3',
        question: 'What does it mean for a square matrix to be non-invertible (singular)?',
        options: [
          'Its determinant is zero and its columns are linearly dependent.',
          'All of its eigenvalues are strictly positive.',
          'Its trace equals the identity matrix.',
          'It has no diagonal entries.',
        ],
        correct_index: 0,
        explanation: 'A zero determinant indicates space has collapsed into lower dimensions, making inversion impossible.',
        targeted_concept: 'Determinants & Invertibility',
      },
    ],
  },
  'JavaScript Fundamentals': {
    id: 'assess-js',
    skill_id: 'skill-js-fund',
    skill_name: 'JavaScript Fundamentals',
    role_title: 'Frontend Developer',
    pass_threshold_percentage: 60,
    questions: [
      {
        id: 'js-q1',
        question: 'What is the key difference between `const`, `let`, and `var` in modern JavaScript?',
        options: [
          '`const` and `let` are block-scoped; `const` cannot be reassigned; `var` is function-scoped and hoisted.',
          '`var` is faster in modern V8 engines than `const`.',
          '`let` can only store numeric values.',
          '`const` makes objects completely immutable recursively.',
        ],
        correct_index: 0,
        explanation: 'ES6 `let` and `const` obey block scope; `const` prevents reassignment of the variable binding.',
        targeted_concept: 'Variable Scoping & Hoisting',
      },
      {
        id: 'js-q2',
        question: 'What is a closure in JavaScript?',
        options: [
          'A method to close an open browser window.',
          'A function that retains access to its outer lexical scope even after the outer function has finished executing.',
          'A syntax error thrown when brackets do not match.',
          'A CSS property that hides elements.',
        ],
        correct_index: 1,
        explanation: 'Closures bundle a function with references to its surrounding lexical environment state.',
        targeted_concept: 'Lexical Closures',
      },
      {
        id: 'js-q3',
        question: 'How does the JavaScript Event Loop handle asynchronous promises (`.then()` or `await`) versus `setTimeout`?',
        options: [
          'Promises run in the microtask queue, which drains before the next macrotask (like setTimeout).',
          '`setTimeout` always executes before any promise resolves.',
          'Promises create a separate background OS thread.',
          'The event loop pauses until all networks return.',
        ],
        correct_index: 0,
        explanation: 'Microtasks (Promises) execute immediately after the current synchronous script and before the next macrotask cycle.',
        targeted_concept: 'Event Loop & Microtask Queue',
      },
    ],
  },
};

export class SkillAssessmentService {
  /**
   * Seed initial student skills using Phase 1 Profile data when available.
   * Never assumes "No skill = beginner" if evidence exists.
   */
  seedStudentSkillsFromProfile(
    careerSkills: CareerSkill[],
    profile: StudentCareerProfile | null
  ): StudentSkillState[] {
    return careerSkills.map((skill) => {
      let initialProficiency: SkillProficiency = 'Not Assessed';
      let claimed = false;
      let notes = 'Initial baseline from Phase 1 profile discovery';

      if (profile) {
        // Evaluate Python orientation
        if (skill.name.toLowerCase().includes('python')) {
          if (profile.coding_preference === 'loves_coding') {
            initialProficiency = profile.experience_level === 'intermediate' ? 'Intermediate' : 'Foundational';
            claimed = true;
            notes = 'Student demonstrated love for coding and practical programming in Phase 1';
          } else if (profile.coding_preference === 'no_code_or_minimal') {
            initialProficiency = 'Beginner';
            claimed = false;
          }
        }

        // Evaluate Math orientation
        if (skill.name.toLowerCase().includes('math') || skill.name.toLowerCase().includes('algebra') || skill.name.toLowerCase().includes('probability')) {
          if (profile.math_interest === 'comfortable_with_math' || profile.math_interest === 'practical_applied_math') {
            initialProficiency = profile.math_interest === 'comfortable_with_math' ? 'Intermediate' : 'Foundational';
            claimed = true;
            notes = 'Comfortable with applied mathematics and analytical modeling';
          } else if (profile.math_interest === 'minimal_math') {
            initialProficiency = 'Beginner';
          }
        }

        // Evaluate Web / JS orientation
        if (skill.name.toLowerCase().includes('javascript') || skill.name.toLowerCase().includes('html') || skill.name.toLowerCase().includes('css')) {
          if (profile.creativity_preference === 'high_visual_design') {
            initialProficiency = profile.experience_level === 'intermediate' ? 'Intermediate' : 'Foundational';
            claimed = true;
          }
        }
      }

      return {
        skill_id: skill.id,
        skill_name: skill.name,
        category: skill.category,
        claimed,
        assessed_proficiency: initialProficiency,
        demonstrated: false,
        learning_status: 'not_started',
        evidence_notes: notes,
      };
    });
  }

  /**
   * Retrieves an assessment for a given skill.
   */
  getAssessment(skillName: string, roleTitle: string): SkillAssessment {
    if (ASSESSMENTS_REGISTRY[skillName]) {
      return ASSESSMENTS_REGISTRY[skillName];
    }

    // Dynamic fallback assessment
    return {
      id: `assess-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
      skill_id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
      skill_name: skillName,
      role_title: roleTitle,
      pass_threshold_percentage: 60,
      questions: [
        {
          id: 'gen-q1',
          question: `In production environments, what is the primary objective of mastering ${skillName}?`,
          options: [
            `To implement reliable, scalable, and maintainable solutions aligned with industry standards.`,
            `To replace all other programming languages and tools entirely.`,
            `To increase compile times artificially.`,
            `It is only theoretical with no real-world application.`,
          ],
          correct_index: 0,
          explanation: `${skillName} provides reliable industry-standard foundations for production architectures.`,
          targeted_concept: `${skillName} Core Value`,
        },
        {
          id: 'gen-q2',
          question: `When diagnosing unexpected errors in ${skillName}, what is the best diagnostic practice?`,
          options: [
            `Isolate the minimal reproducible case, inspect logs and inputs, and verify against official documentation.`,
            `Reboot the entire datacenter without checking logs.`,
            `Delete the codebase and start over.`,
            `Ignore the issue if it only happens 50% of the time.`,
          ],
          correct_index: 0,
          explanation: 'Isolating the bug and inspecting stack traces is standard software debugging hygiene.',
          targeted_concept: 'Debugging & Verification',
        },
      ],
    };
  }

  /**
   * Evaluates student answers and calculates evidence-backed proficiency.
   */
  evaluateAssessment(
    assessment: SkillAssessment,
    userId: string,
    answers: Record<string, number>
  ): SkillAssessmentResult {
    let correctCount = 0;
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    assessment.questions.forEach((q) => {
      const studentChoice = answers[q.id];
      if (studentChoice === q.correct_index) {
        correctCount++;
        strongAreas.push(q.targeted_concept);
      } else {
        weakAreas.push(q.targeted_concept);
      }
    });

    const scorePercentage = Math.round((correctCount / assessment.questions.length) * 100);
    const passed = scorePercentage >= assessment.pass_threshold_percentage;

    let assessedProficiency: SkillProficiency = 'Beginner';
    if (scorePercentage >= 85) assessedProficiency = 'Strong';
    else if (scorePercentage >= 70) assessedProficiency = 'Intermediate';
    else if (scorePercentage >= 50) assessedProficiency = 'Foundational';

    const recommendedAction = passed
      ? `Assessment passed (${scorePercentage}%). You have demonstrated solid foundational comprehension. Proceeding to downstream topics.`
      : `Assessment identified gaps in: ${weakAreas.join(', ')}. Targeted remediation practice tasks have been prioritized in your roadmap.`;

    return {
      id: `result-${Date.now()}`,
      assessment_id: assessment.id,
      skill_id: assessment.skill_id,
      skill_name: assessment.skill_name,
      user_id: userId,
      score_percentage: scorePercentage,
      passed,
      assessed_proficiency: assessedProficiency,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      recommended_action: recommendedAction,
      submitted_at: new Date().toISOString(),
    };
  }
}

export const skillAssessmentService = new SkillAssessmentService();
