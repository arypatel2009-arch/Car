/**
 * CareerOS Phase 2.2 — Competency & Deterministic Skill-Progress Model Test Suite
 * Validates:
 * 1. Beginner student
 * 2. Partially skilled student
 * 3. Advanced student
 * 4. Missing evidence handling
 * 5. Contradictory skill information reconciliation
 * 6. Changed career goal adaptation
 * 7. Prerequisite not completed blocker enforcement
 * 8. Competency-driven topic structure (objective, prereq, effort, practice, criteria)
 * 9. Pacing & workload without arbitrary calendar deadlines
 */

const BASE_URL = 'http://localhost:3000';

async function runPhase2_2Tests() {
  console.log('=== STARTING CAREEROS PHASE 2.2 COMPETENCY ENGINE TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, extra || '');
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Beginner Student
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Beginner Student ---');
    const beginnerUserId = 'student_beginner_pure';
    const beginnerSessionId = 'sess-beg-1';

    // Seed profile as beginner
    await fetch(`${BASE_URL}/api/career-discovery/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': beginnerUserId },
      body: JSON.stringify({
        session_id: beginnerSessionId,
        answers: {
          experience_level: 'beginner',
          coding_preference: 'no_code_or_minimal',
          math_interest: 'neutral',
          tools_used: [],
          work_context: 'independent',
          weekly_hours: 10,
        },
      }),
    });

    // Commit AI Engineer goal
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': beginnerUserId },
      body: JSON.stringify({
        session_id: beginnerSessionId,
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    // Evaluate skills for beginner
    const begEvalRes = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': beginnerUserId },
    }).then((r) => r.json());

    assert(Array.isArray(begEvalRes.evaluatedSkills), 'Test 1a: Returns evaluatedSkills array');

    const begPython = begEvalRes.evaluatedSkills.find((s: any) => s.target_skill === 'Python Programming');
    assert(
      begPython && (begPython.current_status === 'NOT_STARTED' || begPython.current_status === 'BEGINNER'),
      'Test 1b: Beginner Python is calibrated as NOT_STARTED or BEGINNER based on zero-experience profile'
    );
    assert(
      begPython.visual_state === 'Learning',
      'Test 1c: Foundational entry skill is in visual state "Learning"'
    );

    const begML = begEvalRes.evaluatedSkills.find((s: any) => s.target_skill === 'Machine Learning Foundations');
    assert(
      begML && begML.visual_state === 'Blocked',
      'Test 1d: Dependent skill (ML Foundations) is marked as "Blocked" for beginner'
    );
    assert(
      begML.dependencies_satisfied === false,
      'Test 1e: ML dependencies_satisfied is false'
    );
    assert(
      begML.unsatisfied_prerequisites.includes('Python Programming'),
      'Test 1f: Flags Python Programming in unsatisfied_prerequisites'
    );

    // Roadmap for beginner
    const begRdmRes = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': beginnerUserId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    }).then((r) => r.json());

    const begStage1 = begRdmRes.roadmap.stages[0];
    assert(
      begStage1.skills_covered.includes('Python Programming'),
      'Test 1g: Beginner roadmap starts with Stage 1 containing Python foundations'
    );

    // -------------------------------------------------------------
    // TEST 2: Partially Skilled Student
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Partially Skilled Student ---');
    const partialUserId = 'student_partial_dev';
    const partialSessionId = 'sess-partial-1';

    await fetch(`${BASE_URL}/api/career-discovery/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': partialUserId },
      body: JSON.stringify({
        session_id: partialSessionId,
        answers: {
          experience_level: 'intermediate',
          coding_preference: 'loves_coding',
          math_interest: 'practical_applied_math',
          tools_used: ['Git', 'Python'],
          previous_projects: 'Built small scripts and data parsing automation in Python',
        },
      }),
    });

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': partialUserId },
      body: JSON.stringify({
        session_id: partialSessionId,
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    const partialEvalRes = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': partialUserId },
    }).then((r) => r.json());

    const partialPython = partialEvalRes.evaluatedSkills.find((s: any) => s.target_skill === 'Python Programming');
    assert(
      partialPython && partialPython.current_status === 'DEVELOPING',
      'Test 2a: Partially skilled student calibrated to DEVELOPING in Python from hands-on background'
    );
    assert(
      partialPython.visual_state === 'Learning',
      'Test 2b: Python is in active Learning state for refinement'
    );

    // Take diagnostic assessment and achieve PRACTICAL
    const assessSubmit = await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': partialUserId },
      body: JSON.stringify({
        skill_name: 'Python Programming',
        role_title: 'AI Engineer',
        answers: { 'py-q1': 0, 'py-q2': 1, 'py-q3': 0 }, // 2/3 = 67-70%
      }),
    }).then((r) => r.json());

    assert(
      assessSubmit.result.passed === true,
      'Test 2c: Practical assessment passes'
    );

    // Re-check evaluated skills
    const partialAfterAssess = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': partialUserId },
    }).then((r) => r.json());

    const pyAfter = partialAfterAssess.evaluatedSkills.find((s: any) => s.target_skill === 'Python Programming');
    assert(
      pyAfter.current_status === 'PRACTICAL' || pyAfter.current_status === 'STRONG',
      'Test 2d: Python advances to PRACTICAL following diagnostic pass'
    );
    assert(
      pyAfter.visual_state === 'Known' || pyAfter.visual_state === 'Completed',
      'Test 2e: Python visual state is "Known" (or Completed)'
    );

    // -------------------------------------------------------------
    // TEST 3: Advanced Student
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Advanced Student ---');
    const advancedUserId = 'student_advanced_pro';
    const advancedSessionId = 'sess-adv-1';

    await fetch(`${BASE_URL}/api/career-discovery/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': advancedUserId },
      body: JSON.stringify({
        session_id: advancedSessionId,
        answers: {
          experience_level: 'advanced',
          coding_preference: 'loves_coding',
          math_interest: 'comfortable_with_math',
          tools_used: ['Python', 'Git', 'PyTorch', 'Docker'],
          previous_projects: 'Production ML pipeline and deep neural net deployment',
        },
      }),
    });

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': advancedUserId },
      body: JSON.stringify({
        session_id: advancedSessionId,
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    // Score 100% on Python
    await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': advancedUserId },
      body: JSON.stringify({
        skill_name: 'Python Programming',
        role_title: 'AI Engineer',
        answers: { 'py-q1': 0, 'py-q2': 1, 'py-q3': 1 }, // 100%
      }),
    });

    const advEvalRes = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': advancedUserId },
    }).then((r) => r.json());

    const advPy = advEvalRes.evaluatedSkills.find((s: any) => s.target_skill === 'Python Programming');
    assert(advPy.current_status === 'STRONG', 'Test 3a: Advanced student Python evaluated as STRONG');
    assert(advPy.visual_state === 'Completed', 'Test 3b: Visual state is "Completed"');

    const advRdmRes = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': advancedUserId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    }).then((r) => r.json());

    const advStage1Skills = advRdmRes.roadmap.stages[0].skills_covered;
    assert(
      !advStage1Skills.includes('Python Programming'),
      'Test 3c: Advanced student does not repeat Python in Stage 1'
    );

    // -------------------------------------------------------------
    // TEST 4: Missing Evidence Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Missing Evidence Handling ---');
    const missingEvidenceUserId = 'student_missing_evidence';

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': missingEvidenceUserId },
      body: JSON.stringify({
        session_id: 'sess-none',
        target_role: 'AI Engineer',
        goal_source: 'DIRECT_CAREER_PICK',
      }),
    });

    const missingEval = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': missingEvidenceUserId },
    }).then((r) => r.json());

    assert(
      missingEval.evaluatedSkills.some((s: any) => s.current_status === 'UNKNOWN' || s.current_status === 'NOT_STARTED'),
      'Test 4a: Missing evidence correctly flags skills as UNKNOWN or NOT_STARTED'
    );
    const unkSkill = missingEval.evaluatedSkills.find((s: any) => s.current_status === 'UNKNOWN' || s.current_status === 'NOT_STARTED');
    assert(
      unkSkill.evidence.includes('No verified artifacts') || unkSkill.evidence.includes('new learning requirement'),
      'Test 4b: Honest evidence description without fake numerical precision'
    );

    // -------------------------------------------------------------
    // TEST 5: Contradictory Skill Information
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Contradictory Skill Information ---');
    const contradictUserId = 'student_contradict_claim';
    const contradictSessionId = 'sess-contra-1';

    // Student claims intermediate/advanced
    await fetch(`${BASE_URL}/api/career-discovery/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': contradictUserId },
      body: JSON.stringify({
        session_id: contradictSessionId,
        answers: {
          experience_level: 'advanced',
          coding_preference: 'loves_coding',
          tools_used: ['Python'],
          previous_projects: 'Claims full stack senior experience',
        },
      }),
    });

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': contradictUserId },
      body: JSON.stringify({
        session_id: contradictSessionId,
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    // But fails diagnostic assessment completely (0%)
    const failedCheck = await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': contradictUserId },
      body: JSON.stringify({
        skill_name: 'Python Programming',
        role_title: 'AI Engineer',
        answers: { 'py-q1': 3, 'py-q2': 3, 'py-q3': 3 }, // all wrong
      }),
    }).then((r) => r.json());

    assert(failedCheck.result.passed === false, 'Test 5a: Diagnostic assessment evaluated as failed');

    const contraEval = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': contradictUserId },
    }).then((r) => r.json());

    const contraPy = contraEval.evaluatedSkills.find((s: any) => s.target_skill === 'Python Programming');
    assert(
      contraPy.current_status === 'BEGINNER',
      'Test 5b: Contradiction deterministically recalibrates status down to BEGINNER'
    );
    assert(
      contraPy.evidence.includes('Contradiction calibrated'),
      'Test 5c: Evidence notes explicitly describe the contradiction calibration'
    );

    // -------------------------------------------------------------
    // TEST 6: Changed Career Goal
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Changed Career Goal ---');
    const switcherUserId = 'student_goal_switcher';

    // Start with AI Engineer
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': switcherUserId },
      body: JSON.stringify({
        session_id: 'sess-switch',
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    const initRdm = await fetch(`${BASE_URL}/api/learning/roadmap`, {
      headers: { 'x-user-id': switcherUserId },
    }).then((r) => r.json());

    assert(initRdm.roadmap.target_role === 'AI Engineer', 'Test 6a: Initial roadmap is for AI Engineer');

    // Student switches goal to Frontend Developer
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': switcherUserId },
      body: JSON.stringify({
        session_id: 'sess-switch',
        target_role: 'Frontend Developer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    // Query roadmap again
    const switchedRdm = await fetch(`${BASE_URL}/api/learning/roadmap`, {
      headers: { 'x-user-id': switcherUserId },
    }).then((r) => r.json());

    assert(switchedRdm.roadmap.target_role === 'Frontend Developer', 'Test 6b: Roadmap re-generates for Frontend Developer');
    assert(
      switchedRdm.roadmap.stages.some((stg: any) =>
        stg.skills_covered.some((s: string) => s.includes('JavaScript') || s.includes('React') || s.includes('Web'))
      ),
      'Test 6c: New roadmap covers Frontend Developer domain competencies'
    );

    // -------------------------------------------------------------
    // TEST 7: Prerequisite Not Completed (Blocked Enforcement)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Prerequisite Not Completed Blocker ---');
    const blockedUserId = 'student_blocked_test';

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': blockedUserId },
      body: JSON.stringify({ session_id: 's-blk', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    const blockedEval = await fetch(`${BASE_URL}/api/learning/evaluated-skills`, {
      headers: { 'x-user-id': blockedUserId },
    }).then((r) => r.json());

    const deepLearning = blockedEval.evaluatedSkills.find((s: any) => s.target_skill.includes('Deep Learning'));
    assert(
      deepLearning && deepLearning.visual_state === 'Blocked',
      'Test 7a: Deep Learning is strictly Blocked when foundational prerequisites are incomplete'
    );
    assert(
      deepLearning.dependencies_satisfied === false,
      'Test 7b: dependencies_satisfied is false'
    );
    assert(
      deepLearning.unsatisfied_prerequisites.length > 0,
      'Test 7c: Unsatisfied prerequisites explicitly enumerated'
    );

    // -------------------------------------------------------------
    // TEST 8: Topic Structure & Competency Curriculum
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Topic Structure & Competency Curriculum ---');
    const rdmTopics = begRdmRes.roadmap.stages[0].topics;
    assert(rdmTopics.length > 0, 'Test 8a: Stage contains competency topics');

    const sampleTopic = rdmTopics[0];
    assert(typeof sampleTopic.objective === 'string' && sampleTopic.objective.length > 10, 'Test 8b: Topic includes objective');
    assert(Array.isArray(sampleTopic.prerequisite), 'Test 8c: Topic includes prerequisite array');
    assert(typeof sampleTopic.estimated_learning_effort === 'string', 'Test 8d: Topic includes estimated_learning_effort');
    assert(typeof sampleTopic.practice_requirement === 'string' && sampleTopic.practice_requirement.length > 10, 'Test 8e: Topic includes practice_requirement');
    assert(typeof sampleTopic.target_skill === 'string' && sampleTopic.target_skill.length > 0, 'Test 8f: Topic includes target_skill');
    assert(typeof sampleTopic.completion_criteria === 'string' && sampleTopic.completion_criteria.length > 10, 'Test 8g: Topic includes completion_criteria');

    // -------------------------------------------------------------
    // TEST 9: Learning Overview 6 Indicators
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Learning Overview 6 Indicators ---');
    const overviewRes = await fetch(`${BASE_URL}/api/learning/overview`, {
      headers: { 'x-user-id': beginnerUserId },
    }).then((r) => r.json());

    assert(overviewRes.has_goal === true, 'Test 9a: Overview has_goal is true');
    assert(typeof overviewRes.summary.selected_career === 'string', 'Test 9b: Includes Career Goal');
    assert(typeof overviewRes.summary.current_skill_level === 'string', 'Test 9c: Includes Current Skill Level');
    assert(typeof overviewRes.summary.skill_gap_summary === 'string', 'Test 9d: Includes Skill Gap');
    assert(typeof overviewRes.summary.current_stage_title === 'string', 'Test 9e: Includes Current Stage');
    assert(typeof overviewRes.summary.current_topic_title === 'string', 'Test 9f: Includes Current Topic');
    assert(typeof overviewRes.summary.next_action === 'string', 'Test 9g: Includes Next Action');

    // -------------------------------------------------------------
    // TEST 10: Workload Estimation (No Arbitrary Deadlines)
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Workload Estimation (No Arbitrary Deadlines) ---');
    assert(
      typeof begRdmRes.roadmap.estimated_workload_hours === 'number' && begRdmRes.roadmap.estimated_workload_hours > 0,
      'Test 10a: Uses calculated total practice workload hours'
    );
    assert(
      begRdmRes.roadmap.pace_description.includes('demonstrated mastery') ||
        begRdmRes.roadmap.pace_description.includes('Competency-driven'),
      'Test 10b: Pace description emphasizes competency over calendar deadlines'
    );

    console.log(`\n========================================`);
    console.log(`PHASE 2.2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 2.2 Test execution error:', err);
    process.exit(1);
  }
}

runPhase2_2Tests();
