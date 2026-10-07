/**
 * CareerOS Phase 2.2 — Competency-Driven Roadmap Engine
 * Builds dependency-aware, competency-driven learning roadmaps.
 * Not a fixed "12-week plan"; derives stages and topics directly from Career Skill Map dependencies.
 */

import {
  CareerSkillMap,
  LearningRoadmap,
  LearningStage,
  LearningTask,
  LearningTopic,
  VerifiedResource,
} from '../../types/learning.ts';
import { EvaluatedSkillProgress } from './deterministicSkillProgressModel.ts';
import { findResourcesForTopic } from './resourceCatalog.ts';

// Detailed topic curriculum per skill
interface TopicCurriculumItem {
  title: string;
  objective: string;
  prerequisites: string[];
  effort: string;
  minutes: number;
  practice: string;
  criteria: string;
  taskTitles: [string, string];
}

const DETAILED_TOPICS: Record<string, TopicCurriculumItem[]> = {
  'Python Programming': [
    {
      title: 'Variables, Data Structures & Mutability',
      objective: 'Master primitive types, dictionaries, lists, sets, and immutability invariants in Python.',
      prerequisites: [],
      effort: '45 mins',
      minutes: 45,
      practice: 'Construct an in-memory record catalog manipulating dictionary lookups and nested lists.',
      criteria: 'Demonstrates mutable updates, deep copying, and proper data structure selection without errors.',
      taskTitles: [
        'Study Python Primitive Types & Mutable Data Structures',
        'Practice: Build In-Memory Record Registry with Dict/List Ops',
      ],
    },
    {
      title: 'Control Flow, Loops & Comprehensions',
      objective: 'Construct idiomatic branching, iterators, generators, and list/dict comprehensions.',
      prerequisites: ['Variables, Data Structures & Mutability'],
      effort: '45 mins',
      minutes: 45,
      practice: 'Write vectorized comprehensions filtering numerical datasets and creating streaming generators.',
      criteria: 'Clean execution with zero nested loop redundancies.',
      taskTitles: [
        'Study Python Comprehensions, Iterators & Memory-Efficient Generators',
        'Practice: Implement Vectorized Filter & Streaming Pipeline',
      ],
    },
    {
      title: 'Modular Functions, Scope & Type Hints',
      objective: 'Author clean functions with explicit type signatures, *args/**kwargs, and docstrings.',
      prerequisites: ['Control Flow, Loops & Comprehensions'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Build a modular utility module with type-checked signatures and unit test assertions.',
      criteria: 'Passes static type validation with zero runtime attribute errors.',
      taskTitles: [
        'Study Modular Functions, Lexical Scope & Python Type Annotations',
        'Practice: Create Typed Utility Library with Unit Assertions',
      ],
    },
    {
      title: 'Object-Oriented Design & File I/O',
      objective: 'Structure classes, encapsulation, context managers with `open()`, and JSON/CSV streaming.',
      prerequisites: ['Modular Functions, Scope & Type Hints'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Create a persistent file-backed data loader class using context managers.',
      criteria: 'Gracefully handles missing files and safely closes IO handles.',
      taskTitles: [
        'Study Object-Oriented Principles, Dunder Methods & Context Managers',
        'Practice: Implement Robust JSON/CSV Data Loader with Context Managers',
      ],
    },
  ],
  'Git & Version Control': [
    {
      title: 'Repository Lifecycle & Atomic Commits',
      objective: 'Initialize repos, understand .gitignore rules, and control the staging index with precision.',
      prerequisites: [],
      effort: '30 mins',
      minutes: 30,
      practice: 'Initialize local repository, configure clean .gitignore, and write conventional commits.',
      criteria: 'Clean working tree with descriptive commit history.',
      taskTitles: [
        'Study Git Architecture, SHA Hashing & Staging Index',
        'Practice: Initialize Repository with Atomic Conventional Commits',
      ],
    },
    {
      title: 'Branching, Merges & Conflict Resolution',
      objective: 'Create isolated feature branches, execute rebase/merge, and resolve structural code conflicts.',
      prerequisites: ['Repository Lifecycle & Atomic Commits'],
      effort: '45 mins',
      minutes: 45,
      practice: 'Simulate conflicting branches and manually reconcile conflict markers.',
      criteria: 'Clean merge resolution with verified test pass on target branch.',
      taskTitles: [
        'Study Git Branching Models, Fast-Forward vs 3-Way Merges',
        'Practice: Reconcile Simulated Merge Conflict on Feature Branch',
      ],
    },
  ],
  'Linear Algebra': [
    {
      title: 'Vector Spaces & Coordinate Transformations',
      objective: 'Understand multi-dimensional vectors, L1/L2 norms, and geometric projections.',
      prerequisites: [],
      effort: '45 mins',
      minutes: 45,
      practice: 'Calculate vector magnitudes, unit normalizations, and Euclidean distances.',
      criteria: 'Accurate manual and programmatic calculation matching reference vector norms.',
      taskTitles: [
        'Study Vector Magnitude, Euclidean Norms & High-Dimensional Geometry',
        'Practice: Compute Vector Normalizations & Dimensional Distances',
      ],
    },
    {
      title: 'Matrix Operations & Transformations',
      objective: 'Master matrix addition, transposition, inner-dimension dot products, and rank.',
      prerequisites: ['Vector Spaces & Coordinate Transformations'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Implement matrix multiplication logic and benchmark against optimized libraries.',
      criteria: 'Valid matrix multiplication logic respecting dimension constraints.',
      taskTitles: [
        'Study Matrix Products, Dimensional Matching & Linear Mappings',
        'Practice: Implement Vectorized Matrix Transformation Logic',
      ],
    },
    {
      title: 'Dot Products & Cosine Distance',
      objective: 'Apply vector dot products to measure semantic similarity in high-dimensional embedding spaces.',
      prerequisites: ['Matrix Operations & Transformations'],
      effort: '45 mins',
      minutes: 45,
      practice: 'Compute cosine similarity across synthetic embedding pairs.',
      criteria: 'Correct range [-1, 1] output matching normalized dot product formula.',
      taskTitles: [
        'Study Dot Products, Cosine Similarity & Semantic Distance',
        'Practice: Implement Embedding Distance Ranker for Documents',
      ],
    },
  ],
  'Data Handling (NumPy & Pandas)': [
    {
      title: 'NumPy Arrays & Vectorized Computing',
      objective: 'Manipulate n-dimensional ndarrays, broadcasting rules, and boolean indexing masks.',
      prerequisites: ['Python Programming'],
      effort: '45 mins',
      minutes: 45,
      practice: 'Vectorize operations replacing slow Python loops with NumPy broadcasting.',
      criteria: 'Demonstrates 10x+ performance speedup using vectorized array ops.',
      taskTitles: [
        'Study NumPy Array Memory Layout, Slicing & Broadcasting',
        'Practice: Vectorize Analytical Aggregations with Boolean Masks',
      ],
    },
    {
      title: 'Pandas DataFrames & Data Cleaning',
      objective: 'Load CSV/JSON data, handle null/missing values, impute data, and parse timestamps.',
      prerequisites: ['NumPy Arrays & Vectorized Computing'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Clean messy tabular dataset with missing values, deduplication, and schema validation.',
      criteria: 'Zero unexpected NaNs in processed dataframe output.',
      taskTitles: [
        'Study Pandas Series, DataFrames, Missing Value Imputation',
        'Practice: Build Sanitization Script for Real-World Tabular Data',
      ],
    },
  ],
  'Machine Learning Foundations': [
    {
      title: 'Supervised Learning & Model Training',
      objective: 'Distinguish regression from classification; understand decision trees, random forests, and loss.',
      prerequisites: ['Python Programming', 'Data Handling (NumPy & Pandas)'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Train a Scikit-Learn Random Forest and Gradient Boosting classifier on benchmark data.',
      criteria: 'Reproducible training script logging validation score and feature importances.',
      taskTitles: [
        'Study Supervised Learning Formulations, Decision Trees & Ensembles',
        'Practice: Train Cross-Validated Scikit-Learn Predictive Model',
      ],
    },
    {
      title: 'Evaluation Metrics & Cross-Validation',
      objective: 'Prevent data leakage, implement K-Fold cross-validation, and tune precision/recall trade-offs.',
      prerequisites: ['Supervised Learning & Model Training'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Compute confusion matrices, ROC-AUC curves, and F1 scores under class imbalance.',
      criteria: 'Zero data leakage between preprocessing scaler and cross-validation splits.',
      taskTitles: [
        'Study Data Leakage Prevention, Stratified K-Fold & ROC Curves',
        'Practice: Diagnose Model Overfitting with Precision/Recall Metrics',
      ],
    },
  ],
  'JavaScript Fundamentals': [
    {
      title: 'Variables, Lexical Scope & Modern ES6+',
      objective: 'Understand let/const block scope, arrow functions, destructuring, and modules.',
      prerequisites: [],
      effort: '45 mins',
      minutes: 45,
      practice: 'Refactor legacy code into modular ES6+ functions with strict immutability.',
      criteria: 'No var keywords and clean module export syntax.',
      taskTitles: [
        'Study Modern JavaScript Scoping, ES6 Modules & Arrow Functions',
        'Practice: Refactor Data Transform Logic with Modern ES6 Features',
      ],
    },
    {
      title: 'Asynchronous JavaScript & Event Loop',
      objective: 'Master Promises, async/await syntax, Promise.all error handling, and the microtask queue.',
      prerequisites: ['Variables, Lexical Scope & Modern ES6+'],
      effort: '60 mins',
      minutes: 60,
      practice: 'Implement concurrent API fetcher with retry logic and error timeouts.',
      criteria: 'Gracefully handles network rejections without unhandled promise rejections.',
      taskTitles: [
        'Study JavaScript Event Loop, Call Stack & Microtask Queue',
        'Practice: Build Asynchronous Client with Retries & Error Boundaries',
      ],
    },
  ],
};

export class CompetencyRoadmapEngine {
  /**
   * Generates a competency-driven roadmap whose stages and topics respect
   * Career Skill Map dependencies.
   */
  generateCompetencyRoadmap(
    userId: string,
    careerGoalId: string,
    targetRole: string,
    skillMap: CareerSkillMap,
    evaluatedSkills: EvaluatedSkillProgress[],
    availableHoursDaily: number = 2.0,
    daysPerWeek: number = 5,
    learningPreference: 'video' | 'reading' | 'practice' | 'mixed' = 'mixed'
  ): LearningRoadmap {
    const roadmapId = `rdm-${userId}-${Date.now().toString(36)}`;
    const stages: LearningStage[] = [];

    // Filter out skills that are already verified as STRONG
    const skillsToLearn = evaluatedSkills.filter((s) => s.current_status !== 'STRONG');
    const strongSkills = evaluatedSkills.filter((s) => s.current_status === 'STRONG');

    // Build dependency graph and determine stage groupings:
    // Stage 1: Foundational Prerequisites (Skills with 0 unsatisfied prerequisites, or foundational requirements)
    const stage1Skills = skillsToLearn.filter(
      (s) => s.prerequisites.length === 0 || s.dependencies_satisfied
    );

    // Stage 2: Core Domain Modeling & Methods (Skills whose prerequisites are in Stage 1 or already strong)
    const stage1Names = new Set(stage1Skills.map((s) => s.target_skill.toLowerCase()));
    const strongNames = new Set(strongSkills.map((s) => s.target_skill.toLowerCase()));

    const stage2Skills = skillsToLearn.filter((s) => {
      if (stage1Skills.includes(s)) return false;
      // All prerequisites are either already STRONG or in Stage 1
      return s.prerequisites.every(
        (p) => stage1Names.has(p.toLowerCase()) || strongNames.has(p.toLowerCase())
      );
    });

    // Stage 3: Advanced Systems, Integration & Production Capstone
    const stage3Skills = skillsToLearn.filter(
      (s) => !stage1Skills.includes(s) && !stage2Skills.includes(s)
    );

    let stageOrder = 1;

    const buildStage = (
      title: string,
      description: string,
      skills: EvaluatedSkillProgress[]
    ): LearningStage | null => {
      if (skills.length === 0) return null;

      const stageId = `stg-${stageOrder}-${roadmapId.slice(-6)}`;
      const topics: LearningTopic[] = [];
      let stageMinutes = 0;

      skills.forEach((skillItem, skillIdx) => {
        const skillName = skillItem.target_skill;
        const topicList = DETAILED_TOPICS[skillName] || [
          {
            title: `${skillName} Foundations & Principles`,
            objective: `Master fundamental syntax, concepts, and architectural patterns of ${skillName}.`,
            prerequisites: skillItem.prerequisites,
            effort: '45 mins',
            minutes: 45,
            practice: skillItem.recommended_practice,
            criteria: 'Demonstrates functional working knowledge without syntax errors.',
            taskTitles: [
              `Study ${skillName} Core Concepts & Standards`,
              `Practice: Hands-on Implementation of ${skillName} Basics`,
            ] as [string, string],
          },
          {
            title: `${skillName} Practical Application & Integration`,
            objective: `Apply ${skillName} to production-grade workflows in ${targetRole}.`,
            prerequisites: [`${skillName} Foundations & Principles`],
            effort: '60 mins',
            minutes: 60,
            practice: `Implement production-style project artifact for ${skillName}.`,
            criteria: 'Passes test coverage and fulfills career relevance expectations.',
            taskTitles: [
              `Study ${skillName} Architecture & Best Practices`,
              `Practice: Implement Capstone Exercise for ${skillName}`,
            ] as [string, string],
          },
        ];

        const resources: VerifiedResource[] = findResourcesForTopic(
          skillName,
          learningPreference === 'mixed' ? undefined : learningPreference
        );

        topicList.forEach((topicDef, topicIdx) => {
          const topicId = `tpc-${stageId}-${skillIdx + 1}-${topicIdx + 1}`;
          stageMinutes += topicDef.minutes;

          // Build 2 actionable tasks per topic
          const task1: LearningTask = {
            id: `tsk-${topicId}-1`,
            roadmap_id: roadmapId,
            stage_id: stageId,
            skill_id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
            skill_name: skillName,
            topic_title: topicDef.title,
            title: topicDef.taskTitles[0],
            description: `Focus on: ${topicDef.objective}. Review verified documentation and conceptual mechanics.`,
            why_it_matters: skillItem.project_relevance || 'Critical technical competency for career readiness.',
            estimated_minutes: Math.round(topicDef.minutes / 2),
            priority: skillItem.importance === 'Critical' ? 'HIGH' : 'MEDIUM',
            status: 'not_started',
            resource_ids: resources.slice(0, 2).map((r) => r.id),
            resources: resources.slice(0, 2),
            completion_criteria: topicDef.criteria,
          };

          const task2: LearningTask = {
            id: `tsk-${topicId}-2`,
            roadmap_id: roadmapId,
            stage_id: stageId,
            skill_id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
            skill_name: skillName,
            topic_title: topicDef.title,
            title: topicDef.taskTitles[1],
            description: `Hands-on practice: ${topicDef.practice}`,
            why_it_matters: 'Hands-on practice bridges theoretical understanding into verifiable engineering capability.',
            estimated_minutes: Math.round(topicDef.minutes / 2),
            priority: 'HIGH',
            status: 'not_started',
            resource_ids: resources.slice(1, 3).map((r) => r.id),
            resources: resources.slice(1, 3),
            completion_criteria: topicDef.criteria,
          };

          topics.push({
            id: topicId,
            stage_id: stageId,
            skill_id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
            target_skill: skillName,
            title: topicDef.title,
            description: topicDef.objective,
            objective: topicDef.objective,
            prerequisite: topicDef.prerequisites,
            estimated_learning_effort: topicDef.effort,
            estimated_minutes: topicDef.minutes,
            practice_requirement: topicDef.practice,
            completion_criteria: topicDef.criteria,
            status: 'not_started',
            tasks: [task1, task2],
            resources,
          });
        });
      });

      return {
        id: stageId,
        roadmap_id: roadmapId,
        order_index: stageOrder++,
        title,
        description,
        estimated_hours: Math.round((stageMinutes / 60) * 10) / 10,
        status: 'not_started',
        skills_covered: skills.map((s) => s.target_skill),
        topics,
      };
    };

    // Stage 1
    if (stage1Skills.length > 0) {
      const s = buildStage(
        `Stage 1 — Primary Core Foundations`,
        `Directly addresses core prerequisite bottlenecks required before advanced modeling and application development.`,
        stage1Skills
      );
      if (s) stages.push(s);
    }

    // Stage 2
    if (stage2Skills.length > 0) {
      const s = buildStage(
        `Stage 2 — Modeling, Analysis & Intermediate Frameworks`,
        `Deepens core technical capabilities once primary foundations are established.`,
        stage2Skills
      );
      if (s) stages.push(s);
    }

    // Stage 3
    if (stage3Skills.length > 0) {
      const s = buildStage(
        `Stage 3 — Advanced Systems & Production Deployment`,
        `Integrates modular subsystems, end-to-end pipelines, and production engineering practices.`,
        stage3Skills
      );
      if (s) stages.push(s);
    }

    // Edge case: All skills already STRONG!
    if (stages.length === 0) {
      const s = buildStage(
        `Stage 1 — Advanced Production Capstone & Architecture`,
        `All foundational requirements already demonstrated. Focus on advanced production deployment and edge cases.`,
        evaluatedSkills.slice(0, 2)
      );
      if (s) stages.push(s);
    }

    // Calculate total minutes and workload
    let totalMinutes = 0;
    stages.forEach((stg) => {
      stg.topics.forEach((tpc) => {
        tpc.tasks.forEach((tsk) => {
          totalMinutes += tsk.estimated_minutes;
        });
      });
    });

    const totalHours = Math.max(1, Math.round((totalMinutes / 60) * 10) / 10);
    const weeklyCapacity = Math.max(1, availableHoursDaily * daysPerWeek);
    const estimatedWeeks = Math.max(1, Math.ceil((totalHours / weeklyCapacity) * 10) / 10);

    const paceDescription = `Competency-driven learning plan. Based on your committed pace of ${availableHoursDaily} hr/day (${daysPerWeek} days/week), this roadmap represents approximately ${totalHours} hours of focused practice. Progression is based entirely on demonstrated mastery, not arbitrary calendar deadlines.`;

    const firstStage = stages[0];
    const firstTopic = firstStage?.topics[0];
    const firstSkill = firstTopic?.target_skill || firstStage?.skills_covered[0] || 'Foundations';
    const nextAction = firstTopic?.tasks[0]
      ? `${firstTopic.tasks[0].title}: ${firstTopic.tasks[0].description}`
      : 'Start your first foundational learning topic';

    return {
      id: roadmapId,
      user_id: userId,
      career_goal_id: careerGoalId,
      target_role: targetRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      available_hours_per_day: availableHoursDaily,
      days_per_week: daysPerWeek,
      learning_preference: learningPreference,
      estimated_total_weeks: estimatedWeeks,
      estimated_workload_hours: totalHours,
      pace_description: paceDescription,
      stages,
      overall_progress_percentage: 0,
      current_stage_id: firstStage?.id || 'stage-1',
      current_stage_title: firstStage?.title || 'Stage 1',
      current_topic_id: firstTopic?.id || 'topic-1',
      current_topic_title: firstTopic?.title || 'Foundations',
      current_focus_skill: firstSkill,
      next_action: nextAction,
    };
  }

  /**
   * Deterministically updates roadmap progress and current active topic / stage.
   */
  recalculateProgress(roadmap: LearningRoadmap): LearningRoadmap {
    let totalTasks = 0;
    let completedTasks = 0;
    let foundFirstIncomplete = false;
    let currentStageId = roadmap.stages[0]?.id || '';
    let currentStageTitle = roadmap.stages[0]?.title || '';
    let currentTopicId = roadmap.stages[0]?.topics[0]?.id || '';
    let currentTopicTitle = roadmap.stages[0]?.topics[0]?.title || '';
    let currentFocusSkill = roadmap.stages[0]?.skills_covered[0] || '';
    let nextAction = 'Continue your personalized learning roadmap';

    roadmap.stages.forEach((stage) => {
      let stageTotal = 0;
      let stageCompleted = 0;

      stage.topics.forEach((topic) => {
        let topicTotal = 0;
        let topicCompleted = 0;

        topic.tasks.forEach((task) => {
          totalTasks++;
          stageTotal++;
          topicTotal++;

          if (task.status === 'completed') {
            completedTasks++;
            stageCompleted++;
            topicCompleted++;
          } else if (!foundFirstIncomplete) {
            foundFirstIncomplete = true;
            currentStageId = stage.id;
            currentStageTitle = stage.title;
            currentTopicId = topic.id;
            currentTopicTitle = topic.title;
            currentFocusSkill = topic.target_skill || task.skill_name;
            nextAction = `${task.title}: ${task.completion_criteria}`;
          }
        });

        if (topicCompleted === topicTotal && topicTotal > 0) {
          topic.status = 'completed';
        } else if (topicCompleted > 0) {
          topic.status = 'in_progress';
        } else {
          topic.status = 'not_started';
        }
      });

      if (stageCompleted === stageTotal && stageTotal > 0) {
        stage.status = 'completed';
      } else if (stageCompleted > 0) {
        stage.status = 'in_progress';
      } else {
        stage.status = 'not_started';
      }
    });

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...roadmap,
      overall_progress_percentage: progressPercentage,
      current_stage_id: currentStageId,
      current_stage_title: currentStageTitle,
      current_topic_id: currentTopicId,
      current_topic_title: currentTopicTitle,
      current_focus_skill: currentFocusSkill,
      next_action: nextAction,
      updated_at: new Date().toISOString(),
    };
  }
}

export const competencyRoadmapEngine = new CompetencyRoadmapEngine();
