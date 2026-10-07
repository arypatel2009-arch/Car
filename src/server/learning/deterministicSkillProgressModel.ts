/**
 * CareerOS Phase 2.2 — Deterministic Skill-Progress Model
 * Grounded competency evaluation combining Phase 1 profile, assessments, and evidence.
 * Never assumes a student is a beginner; never allows Gemini alone to assign completion status.
 */

import {
  CareerSkill,
  CareerSkillDependency,
  CareerSkillMap,
  EvidenceSkillStatus,
  SkillAssessmentResult,
  SkillVisualState,
  StudentSkillState,
} from '../../types/learning.ts';
import { StudentCareerProfile } from '../../types/career.ts';

export interface SkillProgressEvaluationInput {
  skillMap: CareerSkillMap;
  studentProfile: StudentCareerProfile | null;
  existingSkills?: StudentSkillState[];
  assessmentResults?: SkillAssessmentResult[];
  changedCareerGoal?: boolean;
  previousRole?: string | null;
}

export interface EvaluatedSkillProgress {
  target_skill: string;
  category: string;
  importance: string;
  expected_proficiency: string;
  current_status: EvidenceSkillStatus;
  evidence: string;
  gap: string;
  prerequisites: string[];
  dependencies_satisfied: boolean;
  unsatisfied_prerequisites: string[];
  recommended_learning_topics: string[];
  recommended_practice: string;
  project_relevance: string;
  visual_state: SkillVisualState;
}

// Recommended learning topics catalog per skill domain
const TOPIC_TEMPLATES_BY_SKILL: Record<
  string,
  {
    topics: { title: string; objective: string; effort: string; minutes: number; practice: string; criteria: string }[];
    practice: string;
  }
> = {
  'Python Programming': {
    topics: [
      {
        title: 'Variables, Data Structures & Mutability',
        objective: 'Master primitive types, lists, dictionaries, tuples, and immutability invariants in Python.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Implement an in-memory record catalog manipulating dictionary lookups and nested lists.',
        criteria: 'Execute test script demonstrating correct mutable dictionary updates without copying side-effects.',
      },
      {
        title: 'Control Flow, Loops & Comprehensions',
        objective: 'Construct idiomatic branching, iterators, generators, and list/dict comprehensions.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Write vectorized comprehensions filtering numerical datasets and generating generator pipelines.',
        criteria: 'Clean execution with zero nested loop redundancies.',
      },
      {
        title: 'Modular Functions, Scope & Type Hints',
        objective: 'Author clean, reusable functions with explicit type signatures, *args/**kwargs, and docstrings.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Build a modular utility module with type-checked signatures and unit assertions.',
        criteria: 'Passes static type verification without runtime attribute errors.',
      },
      {
        title: 'Object-Oriented Design & File I/O',
        objective: 'Structure classes, encapsulation, context managers with `open()`, and JSON/CSV streaming.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Create a persistent file-backed data loader class using context managers.',
        criteria: 'Gracefully handles missing files and closes IO file handles.',
      },
    ],
    practice: 'Write an end-to-end Python pipeline loading and transforming multi-format configuration datasets.',
  },
  'Git & Version Control': {
    topics: [
      {
        title: 'Repository Lifecycle & Staging',
        objective: 'Initialize repos, understand .gitignore, and control staging index with precision.',
        effort: '30 mins',
        minutes: 30,
        practice: 'Initialize local repo, structure clean .gitignore, and craft conventional atomic commits.',
        criteria: 'Clean working tree with descriptive commit history.',
      },
      {
        title: 'Branching & Merge Conflicts',
        objective: 'Create isolated feature branches, execute rebase/merge, and resolve structural code conflicts.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Simulate conflicting branches and manually reconcile conflict markers.',
        criteria: 'Clean merge resolution with verified test pass on target branch.',
      },
      {
        title: 'Collaborative PRs & GitHub Workflows',
        objective: 'Publish remote repositories, author pull requests, and manage reviewer feedback cycles.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Push branch to GitHub, open PR with description template, and merge via squash.',
        criteria: 'Valid pull request URL with passing CI status check.',
      },
    ],
    practice: 'Maintain a production-style GitHub repo with feature branches and automated workflow triggers.',
  },
  'Linear Algebra': {
    topics: [
      {
        title: 'Vector Spaces & Coordinate Systems',
        objective: 'Understand multi-dimensional vectors, norms (L1/L2), and geometric directional projections.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Calculate vector magnitudes, unit normalizations, and Euclidean distances.',
        criteria: 'Accurate manual and programmatic calculation matching reference vector norms.',
      },
      {
        title: 'Matrix Operations & Transformations',
        objective: 'Master matrix addition, transposition, dimensions matching for dot products, and rank.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Implement matrix multiplication from scratch and benchmark against optimized libraries.',
        criteria: 'Valid matrix multiplication logic respecting inner-dimension constraints.',
      },
      {
        title: 'Dot Products & Cosine Similarity',
        objective: 'Apply vector dot products to measure semantic similarity in high-dimensional embedding spaces.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Compute cosine similarity across synthetic embedding pairs.',
        criteria: 'Correct range [-1, 1] output matching normalized dot product formula.',
      },
    ],
    practice: 'Implement an embedding similarity search module ranking document vectors by cosine distance.',
  },
  'Probability & Statistics': {
    topics: [
      {
        title: 'Probability Foundations & Distributions',
        objective: 'Understand discrete/continuous distributions, probability density functions, and Bayes rule.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Calculate Gaussian distribution parameters (mean, variance) over sample datasets.',
        criteria: 'Correct statistical calculations with standard error bounds.',
      },
      {
        title: 'Hypothesis Testing & Confidence Intervals',
        objective: 'Formulate null hypotheses, p-values, t-tests, and sample size estimations.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Run an A/B test analysis comparing conversion metrics with p-value calculations.',
        criteria: 'Correct rejection or acceptance of null hypothesis at 95% confidence level.',
      },
      {
        title: 'Model Evaluation Metrics',
        objective: 'Compute confusion matrices: Precision, Recall, F1-Score, ROC-AUC, and log-loss.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Evaluate model predictions under imbalanced class distribution conditions.',
        criteria: 'Correct trade-off analysis between precision and recall.',
      },
    ],
    practice: 'Conduct a statistical evaluation report comparing multiple model outputs with confidence intervals.',
  },
  'Data Handling (NumPy & Pandas)': {
    topics: [
      {
        title: 'NumPy Arrays & Vectorized Computing',
        objective: 'Manipulate n-dimensional ndarrays, broadcasting rules, and boolean indexing masks.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Vectorize operations replacing slow Python loops with NumPy broadcasting.',
        criteria: 'Demonstrable 10x+ performance speedup using vectorized array ops.',
      },
      {
        title: 'Pandas DataFrames & Data Cleaning',
        objective: 'Load CSV/JSON data, handle null/missing values, impute data, and parse timestamps.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Clean messy tabular dataset with missing values, deduplication, and schema validation.',
        criteria: 'Zero unexpected NaNs in processed dataframe output.',
      },
      {
        title: 'Aggregations, GroupBy & Merging',
        objective: 'Perform multi-key groupby operations, joins, pivots, and hierarchical indices.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Merge multiple relational tables and compute window aggregations.',
        criteria: 'Correct relational join cardinality matching expected row counts.',
      },
    ],
    practice: 'Build a feature-engineering pipeline converting raw event logs into training-ready tabular records.',
  },
  'Machine Learning Foundations': {
    topics: [
      {
        title: 'Problem Formulation & Supervised Algorithms',
        objective: 'Distinguish regression from classification; understand linear models, decision trees, and ensembles.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Train a Scikit-Learn Random Forest and Gradient Boosting classifier on benchmark data.',
        criteria: 'Reproducible training script logging validation score and feature importances.',
      },
      {
        title: 'Cross-Validation & Regularization',
        objective: 'Prevent data leakage, implement K-Fold cross-validation, and tune L1/L2 penalties.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Tune hyperparameters via Stratified K-Fold to prevent test-set data leakage.',
        criteria: 'Zero data leakage between preprocessing scaler and cross-validation splits.',
      },
      {
        title: 'Unsupervised Learning & Clustering',
        objective: 'Apply K-Means, PCA dimensionality reduction, and anomaly detection techniques.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Cluster customer behavioral vectors and visualize clusters in 2D with PCA.',
        criteria: 'Explain silhouette score and choose optimal k using elbow heuristic.',
      },
    ],
    practice: 'Develop a cross-validated predictive ML model with feature importance diagnostics and test evaluation.',
  },
  'Deep Learning & Neural Networks': {
    topics: [
      {
        title: 'Perceptrons, Activations & Backpropagation',
        objective: 'Understand feedforward layers, non-linear activations (ReLU/GELU), loss functions, and chain rule gradients.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Implement forward and backward pass for a 2-layer perceptron in PyTorch.',
        criteria: 'Verified gradient reduction with loss convergence over 20 epochs.',
      },
      {
        title: 'PyTorch Model Architecture & Training Loops',
        objective: 'Write modular torch.nn.Module classes, custom datasets, DataLoader, and Adam optimizer loops.',
        effort: '75 mins',
        minutes: 75,
        practice: 'Train a PyTorch classification network with validation loss checkpoints and early stopping.',
        criteria: 'Clean training loop with decoupled train/eval modes and GPU/CPU device handling.',
      },
    ],
    practice: 'Build, train, and export a PyTorch deep neural network with automated checkpointing.',
  },
  'JavaScript Fundamentals': {
    topics: [
      {
        title: 'Types, Scoping & Modern ES6+',
        objective: 'Understand let/const lexical scope, arrow functions, destructuring, template literals, and modules.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Refactor legacy code into modular ES6+ functions with strict immutability.',
        criteria: 'No var keywords and clean module export syntax.',
      },
      {
        title: 'Asynchronous JavaScript & Event Loop',
        objective: 'Master Promises, async/await syntax, Promise.all error handling, and the microtask queue.',
        effort: '60 mins',
        minutes: 60,
        practice: 'Implement concurrent API fetcher with retry logic and error timeouts.',
        criteria: 'Gracefully handles network rejections without unhandled promise rejections.',
      },
      {
        title: 'DOM Manipulation & Event Handling',
        objective: 'Query DOM nodes, handle event bubbling/delegation, and update interfaces reactively.',
        effort: '45 mins',
        minutes: 45,
        practice: 'Build an interactive form validator with dynamic DOM updates without external libraries.',
        criteria: 'Keyboard and mouse events handled with zero memory leak listeners.',
      },
    ],
    practice: 'Create a responsive vanilla JavaScript client app interacting with an external REST API.',
  },
};

export class DeterministicSkillProgressModel {
  /**
   * Main evaluation entry point: reconciles profile, evidence, claims, and assessments.
   */
  evaluateStudentSkillProgress(input: SkillProgressEvaluationInput): EvaluatedSkillProgress[] {
    const { skillMap, studentProfile, existingSkills = [], assessmentResults = [], changedCareerGoal } = input;

    // Index existing skill states and assessment scores by lower-case skill name
    const existingSkillMap = new Map<string, StudentSkillState>();
    existingSkills.forEach((s) => existingSkillMap.set((s.target_skill || s.skill_name).toLowerCase(), s));

    const assessmentMap = new Map<string, SkillAssessmentResult>();
    assessmentResults.forEach((a) => assessmentMap.set(a.skill_name.toLowerCase(), a));

    // Phase 1 profile signals
    const profileExperience = studentProfile?.experience_level || 'beginner';
    const profileCodingPref = studentProfile?.coding_preference || 'neutral';
    const profileMathInterest = studentProfile?.math_interest || 'neutral';
    const profileTools = (studentProfile?.tools_used || []).map((t) => t.toLowerCase());
    const profileProjects = studentProfile?.previous_projects || '';

    // Step 1: Preliminary status calculation for each skill
    const evaluatedSkills = skillMap.skills.map((skill) => {
      const skillNameLower = skill.name.toLowerCase();
      const existing = existingSkillMap.get(skillNameLower);
      const assessment = assessmentMap.get(skillNameLower);

      let status: EvidenceSkillStatus = 'UNKNOWN';
      let evidence = 'No verified artifacts or diagnostic assessments submitted yet.';
      let gap = `Target proficiency is ${skill.expected_proficiency}.`;

      // -------------------------------------------------------------
      // RULE 1: Objective Assessment Results Take Precedence
      // -------------------------------------------------------------
      if (assessment) {
        if (assessment.passed && assessment.score_percentage >= 85) {
          status = 'STRONG';
          evidence = `Passed diagnostic assessment with high score (${assessment.score_percentage}%). Demonstrated mastery in ${assessment.strong_areas.join(', ') || 'core principles'}.`;
          gap = 'Requirement fully satisfied. Advanced mastery verified.';
        } else if (assessment.passed && assessment.score_percentage >= 65) {
          status = 'PRACTICAL';
          evidence = `Passed diagnostic assessment (${assessment.score_percentage}%). Solid practical capability demonstrated with minor gaps in ${assessment.weak_areas.join(', ') || 'edge cases'}.`;
          gap = 'Practical competency demonstrated. Refinement recommended for production readiness.';
        } else if (assessment.score_percentage >= 50) {
          status = 'DEVELOPING';
          evidence = `Diagnostic check scored ${assessment.score_percentage}%. Foundational awareness present, but gaps identified in: ${assessment.weak_areas.join(', ')}.`;
          gap = 'Requires targeted practice to bridge theoretical concepts into dependable implementation.';
        } else {
          status = 'BEGINNER';
          evidence = `Diagnostic check scored ${assessment.score_percentage}%. Substantial conceptual gaps in: ${assessment.weak_areas.join(', ')}.`;
          gap = 'Must complete structured step-by-step foundational modules.';
        }
      }
      // -------------------------------------------------------------
      // RULE 2: Existing Demonstrable Skills / Prior Goal Records
      // -------------------------------------------------------------
      else if (existing) {
        if (existing.current_status && existing.current_status !== 'UNKNOWN') {
          status = existing.current_status;
          evidence = existing.evidence || existing.evidence_notes || 'Inherited from verified student skill portfolio.';
        } else if (existing.assessed_proficiency === 'Strong' || existing.assessed_proficiency === 'Advanced') {
          status = 'STRONG';
          evidence = 'Demonstrated advanced proficiency in student skill records.';
        } else if (existing.assessed_proficiency === 'Intermediate') {
          status = 'PRACTICAL';
          evidence = 'Demonstrated intermediate practical capability in prior records.';
        } else if (existing.assessed_proficiency === 'Foundational') {
          status = 'DEVELOPING';
          evidence = 'Demonstrated foundational concepts in prior records.';
        } else if (existing.claimed) {
          // Claimed without assessment
          status = 'DEVELOPING';
          evidence = 'Claimed background experience in discovery. Awaiting diagnostic assessment for verification.';
          gap = 'Unverified claim: diagnostic check recommended to calibrate exact proficiency.';
        }
      }
      // -------------------------------------------------------------
      // RULE 3: Phase 1 Profile Evidence Inference (Never assume beginner)
      // -------------------------------------------------------------
      else if (studentProfile) {
        const isPythonRelated = skillNameLower.includes('python');
        const isGitRelated = skillNameLower.includes('git');
        const isMathRelated = skillNameLower.includes('algebra') || skillNameLower.includes('math') || skillNameLower.includes('probability');
        const isJSRelated = skillNameLower.includes('javascript') || skillNameLower.includes('html') || skillNameLower.includes('css');
        const isToolMentioned = profileTools.some((t) => skillNameLower.includes(t));

        if (profileExperience === 'advanced') {
          if (isPythonRelated || isGitRelated || isToolMentioned) {
            status = 'PRACTICAL';
            evidence = `Profile indicates advanced engineering background (${profileProjects || 'active project portfolio'}). Practical proficiency calibrated.`;
            gap = 'High readiness. Verify with targeted assessment to confirm strong rating.';
          } else if (isMathRelated) {
            status = profileMathInterest === 'comfortable_with_math' ? 'PRACTICAL' : 'DEVELOPING';
            evidence = 'Strong technical experience with quantitative comfort indicated in profile.';
          } else {
            status = 'DEVELOPING';
            evidence = 'Transferable advanced engineering foundation indicated in profile.';
          }
        } else if (profileExperience === 'intermediate') {
          if ((isPythonRelated && profileCodingPref === 'loves_coding') || isToolMentioned || isGitRelated) {
            status = 'DEVELOPING';
            evidence = 'Intermediate development experience and hands-on coding orientation in Phase 1 discovery.';
            gap = 'Developing proficiency. Needs structured practice to reach production level.';
          } else if (isMathRelated && (profileMathInterest === 'comfortable_with_math' || profileMathInterest === 'practical_applied_math')) {
            status = 'DEVELOPING';
            evidence = 'Comfortable with applied mathematics and analytical modeling per Phase 1 profile.';
          } else {
            status = 'BEGINNER';
            evidence = 'Intermediate in general computing, but this specialized topic has no recorded project proof.';
            gap = 'Must learn topic fundamentals.';
          }
        } else {
          // Explicit beginner or zero experience
          if (profileCodingPref === 'no_code_or_minimal' && (isPythonRelated || isJSRelated)) {
            status = 'NOT_STARTED';
            evidence = 'Student indicated zero prior programming background in Phase 1 profile.';
            gap = 'Complete zero-to-one beginner foundation required.';
          } else {
            status = 'NOT_STARTED';
            evidence = 'Identified as new learning requirement for chosen career goal.';
            gap = `Target proficiency is ${skill.expected_proficiency}. Must start foundational module.`;
          }
        }
      }

      // -------------------------------------------------------------
      // RULE 4: Contradiction Reconciliation
      // (e.g. Student claimed intermediate, but test score is 0% or low)
      // -------------------------------------------------------------
      if (assessment && studentProfile) {
        if (studentProfile.experience_level === 'intermediate' || studentProfile.experience_level === 'advanced') {
          if (assessment.score_percentage < 50) {
            status = 'BEGINNER';
            evidence = `Contradiction calibrated: Profile indicated ${studentProfile.experience_level} experience, but diagnostic check scored ${assessment.score_percentage}%. Re-calibrated to BEGINNER to ensure foundational gaps are thoroughly repaired.`;
            gap = `Critical gap detected in ${assessment.weak_areas.join(', ')}. Foundational review required.`;
          }
        }
      }

      // Map prerequisite names
      const prereqNames = skill.prerequisites.map((pId) => {
        const found = skillMap.skills.find((s) => s.id === pId || s.name.toLowerCase() === pId.toLowerCase());
        return found ? found.name : pId;
      });

      // Tailored learning topics & practice
      const template = TOPIC_TEMPLATES_BY_SKILL[skill.name] || {
        topics: [
          {
            title: `${skill.name} Core Principles`,
            objective: `Understand the fundamental principles, syntax, and architecture of ${skill.name}.`,
            effort: '45 mins',
            minutes: 45,
            practice: `Implement working exercises applying ${skill.name} methods.`,
            criteria: `Explain concepts and pass diagnostic verification without syntax errors.`,
          },
          {
            title: `${skill.name} Practical Application & Integration`,
            objective: `Apply ${skill.name} to realistic domain workflows in ${skill.role_title}.`,
            effort: '60 mins',
            minutes: 60,
            practice: `Build demonstrable project artifact: ${skill.suggested_evidence}`,
            criteria: `Functionally complete implementation fulfilling career relevance requirements.`,
          },
        ],
        practice: skill.suggested_evidence || `Implement practical module demonstrating ${skill.name}.`,
      };

      return {
        target_skill: skill.name,
        category: skill.category,
        importance: skill.importance,
        expected_proficiency: skill.expected_proficiency,
        current_status: status,
        evidence,
        gap,
        prerequisites: prereqNames,
        recommended_learning_topics: template.topics.map((t) => t.title),
        recommended_practice: template.practice,
        project_relevance: skill.career_relevance,
      };
    });

    // Step 2: Prerequisite Satisfaction and Visual State Determination
    // A prerequisite is satisfied if the required skill has status 'PRACTICAL' or 'STRONG'
    const statusMap = new Map<string, EvidenceSkillStatus>();
    evaluatedSkills.forEach((s) => statusMap.set(s.target_skill.toLowerCase(), s.current_status));

    const finalEvaluations: EvaluatedSkillProgress[] = evaluatedSkills.map((item) => {
      const unsatisfied: string[] = [];

      item.prerequisites.forEach((pName) => {
        const pStatus = statusMap.get(pName.toLowerCase());
        // Prerequisite must be at least PRACTICAL or STRONG to be satisfied
        if (pStatus !== 'PRACTICAL' && pStatus !== 'STRONG') {
          unsatisfied.push(pName);
        }
      });

      const dependenciesSatisfied = unsatisfied.length === 0;

      // Determine Visual State: Known | Learning | Blocked | Completed
      let visualState: SkillVisualState = 'Learning';
      if (item.current_status === 'STRONG') {
        visualState = 'Completed';
      } else if (item.current_status === 'PRACTICAL') {
        visualState = 'Known';
      } else if (!dependenciesSatisfied) {
        visualState = 'Blocked';
      } else {
        visualState = 'Learning';
      }

      return {
        ...item,
        dependencies_satisfied: dependenciesSatisfied,
        unsatisfied_prerequisites: unsatisfied,
        visual_state: visualState,
      };
    });

    return finalEvaluations;
  }
}

export const deterministicSkillProgressModel = new DeterministicSkillProgressModel();
