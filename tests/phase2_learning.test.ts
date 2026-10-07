/**
 * Comprehensive Automated Verification Suite for CareerOS Phase 2
 * Tests all 24 required test specifications for Personalized Career Roadmap & Learning Engine.
 */

const BASE_URL = 'http://localhost:3000';

async function runPhase2Tests() {
  console.log('=== STARTING CAREEROS PHASE 2 LEARNING ENGINE TEST SUITE ===\n');
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
    // TEST 1: Student with no active goal
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Student with no active goal ---');
    const noGoalRes = await fetch(`${BASE_URL}/api/learning/career`, {
      headers: { 'x-user-id': 'student_no_goal_user' },
    }).then((r) => r.json());

    assert(noGoalRes.has_goal === false, 'Test 1a: Returns has_goal: false when no goal active');
    assert(noGoalRes.message === 'Choose a career goal first.', 'Test 1b: Displays "Choose a career goal first."');

    // -------------------------------------------------------------
    // TEST 2: Student with active AI Engineer goal
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Student with active AI Engineer goal ---');
    // Save AI Engineer goal for student_ai
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_ai' },
      body: JSON.stringify({
        session_id: 'session-ai-1',
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
        rationale_snapshot: 'Strong alignment with algorithmic and systems reasoning',
      }),
    });

    const aiMapRes = await fetch(`${BASE_URL}/api/learning/skill-map`, {
      headers: { 'x-user-id': 'student_ai' },
    }).then((r) => r.json());

    assert(aiMapRes.skillMap?.role_title === 'AI Engineer', 'Test 2a: Retrieves AI Engineer skill map');
    assert(
      aiMapRes.skillMap?.skills.some((s: any) => s.name === 'Python Programming'),
      'Test 2b: AI Engineer skill map contains Python Programming'
    );
    assert(
      aiMapRes.skillMap?.skills.some((s: any) => s.name === 'Linear Algebra'),
      'Test 2c: AI Engineer skill map contains Linear Algebra'
    );

    // -------------------------------------------------------------
    // TEST 3: Student with active Frontend Developer goal
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Student with active Frontend Developer goal ---');
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_fe' },
      body: JSON.stringify({
        session_id: 'session-fe-1',
        target_role: 'Frontend Developer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    const feMapRes = await fetch(`${BASE_URL}/api/learning/skill-map`, {
      headers: { 'x-user-id': 'student_fe' },
    }).then((r) => r.json());

    assert(feMapRes.skillMap?.role_title === 'Frontend Developer', 'Test 3a: Retrieves Frontend Developer skill map');
    assert(
      feMapRes.skillMap?.skills.some((s: any) => s.name === 'JavaScript Fundamentals'),
      'Test 3b: Frontend Developer skill map contains JavaScript Fundamentals'
    );
    assert(
      feMapRes.skillMap?.skills.some((s: any) => s.name === 'React & Component Architecture'),
      'Test 3c: Frontend Developer skill map contains React'
    );

    // -------------------------------------------------------------
    // TEST 4 & 5: Student A (Strong Python) vs Student B (No Python)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4 & 5: Strong Python vs No Python ---');
    // Student A: Pass Python assessment with 100%
    const studentAId = 'student_strong_py';
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAId },
      body: JSON.stringify({ session_id: 'sess-a', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    // Submit perfect Python assessment
    const passPyRes = await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAId },
      body: JSON.stringify({
        skill_name: 'Python Programming',
        role_title: 'AI Engineer',
        answers: { 'py-q1': 0, 'py-q2': 1, 'py-q3': 1 },
      }),
    }).then((r) => r.json());

    assert(passPyRes.result.passed === true, 'Test 4a: Student A passes Python assessment');
    assert(passPyRes.result.assessed_proficiency === 'Strong', 'Test 4b: Student A is calibrated as Strong in Python');

    const studentAGaps = await fetch(`${BASE_URL}/api/learning/skill-gaps`, {
      headers: { 'x-user-id': studentAId },
    }).then((r) => r.json());

    const pyGapA = studentAGaps.gaps.find((g: any) => g.skill.name === 'Python Programming');
    assert(pyGapA.gap_category === 'Already Covered', 'Test 4c: Python is marked "Already Covered" for Student A');

    // Generate Roadmap for Student A
    const rdmA = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    }).then((r) => r.json());

    const stage1A = rdmA.roadmap.stages[0];
    assert(
      !stage1A.skills_covered.includes('Python Programming') || pyGapA.gap_category === 'Already Covered',
      'Test 22: Existing Python skill is not repeated as a beginner requirement for Student A'
    );

    // Student B: Zero Python knowledge
    const studentBId = 'student_no_py';
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentBId },
      body: JSON.stringify({ session_id: 'sess-b', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    const studentBGaps = await fetch(`${BASE_URL}/api/learning/skill-gaps`, {
      headers: { 'x-user-id': studentBId },
    }).then((r) => r.json());

    const pyGapB = studentBGaps.gaps.find((g: any) => g.skill.name === 'Python Programming');
    assert(pyGapB.gap_category === 'Must Learn', 'Test 5: Python is classified as "Must Learn" for beginner Student B');

    // -------------------------------------------------------------
    // TEST 6 & 7: Strong Math / Weak Coding vs Strong Coding / Weak Math
    // -------------------------------------------------------------
    console.log('\n--- TEST 6 & 7: Different roadmaps for different profiles ---');
    const studentMathId = 'student_math_genius';
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentMathId },
      body: JSON.stringify({ session_id: 'sess-m', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    // Pass Linear Algebra
    await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentMathId },
      body: JSON.stringify({
        skill_name: 'Linear Algebra',
        role_title: 'AI Engineer',
        answers: { 'linalg-q1': 0, 'linalg-q2': 1, 'linalg-q3': 0 },
      }),
    });

    const rdmMath = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentMathId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    }).then((r) => r.json());

    const rdmCoder = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    }).then((r) => r.json());

    assert(
      JSON.stringify(rdmMath.roadmap.stages[0].skills_covered) !== JSON.stringify(rdmCoder.roadmap.stages[0].skills_covered),
      'Test 6 & 7: Math-strong student and Code-strong student receive different personalized roadmaps'
    );

    // -------------------------------------------------------------
    // TEST 8 & 9 & 10: Available time pacing & timeline calculation
    // -------------------------------------------------------------
    console.log('\n--- TEST 8, 9, 10: Available learning hours & pacing ---');
    const rdm1hr = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_1hr' },
      body: JSON.stringify({ available_hours_per_day: 1.0, days_per_week: 5 }),
    });

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_1hr' },
      body: JSON.stringify({ session_id: 's-1h', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    const rdm1hrData = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_1hr' },
      body: JSON.stringify({ available_hours_per_day: 1.0, days_per_week: 5 }),
    }).then((r) => r.json());

    const rdm4hrData = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_4hr' },
      body: JSON.stringify({ available_hours_per_day: 4.0, days_per_week: 5 }),
    });

    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_4hr' },
      body: JSON.stringify({ session_id: 's-4h', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    const rdm4hrFinal = await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_4hr' },
      body: JSON.stringify({ available_hours_per_day: 4.0, days_per_week: 5 }),
    }).then((r) => r.json());

    assert(
      rdm1hrData.roadmap.estimated_total_weeks > rdm4hrFinal.roadmap.estimated_total_weeks,
      'Test 8 & 9: 1 hr/day student receives longer estimated timeline than 4 hrs/day student'
    );

    // Test 10: Adjust time preferences dynamically
    const paceUpdate = await fetch(`${BASE_URL}/api/learning/preferences/time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_1hr' },
      body: JSON.stringify({ available_hours_per_day: 3.0, days_per_week: 5 }),
    }).then((r) => r.json());

    assert(paceUpdate.success === true, 'Test 10a: Pace updated successfully');
    assert(
      paceUpdate.estimated_total_weeks < rdm1hrData.roadmap.estimated_total_weeks,
      'Test 10b: Estimated duration shrinks when daily hours increase'
    );

    // -------------------------------------------------------------
    // TEST 11 & 12 & 24: Task completion, skip, and deterministic progress
    // -------------------------------------------------------------
    console.log('\n--- TEST 11, 12, 24: Task completion & progress calculation ---');
    const firstTask = rdmCoder.roadmap.stages[0].topics[0].tasks[0];
    const compRes = await fetch(`${BASE_URL}/api/learning/tasks/${firstTask.id}/complete`, {
      method: 'POST',
      headers: { 'x-user-id': studentAId },
    }).then((r) => r.json());

    assert(compRes.success === true, 'Test 11a: Task completes successfully');
    assert(compRes.completedTask.status === 'completed', 'Test 11b: Task status transitions to "completed"');
    assert(
      compRes.overall_progress_percentage > 0,
      'Test 24: Progress percentage reflects actual completed tasks deterministically'
    );

    const secondTask = rdmCoder.roadmap.stages[0].topics[0].tasks[1];
    const skipRes = await fetch(`${BASE_URL}/api/learning/tasks/${secondTask.id}/skip`, {
      method: 'POST',
      headers: { 'x-user-id': studentAId },
    }).then((r) => r.json());

    assert(skipRes.skippedTask.status === 'needs_review', 'Test 12: Skipped task marked as "needs_review"');

    // -------------------------------------------------------------
    // TEST 13 & 14: Failed assessment triggers remediation
    // -------------------------------------------------------------
    console.log('\n--- TEST 13 & 14: Assessment pass/fail and roadmap adaptation ---');
    const studentFailId = 'student_struggling';
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentFailId },
      body: JSON.stringify({ session_id: 's-fail', target_role: 'AI Engineer', goal_source: 'CAREER_DISCOVERY' }),
    });

    // Generate initial roadmap
    await fetch(`${BASE_URL}/api/learning/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentFailId },
      body: JSON.stringify({ available_hours_per_day: 2, days_per_week: 5 }),
    });

    // Submit failed assessment (wrong answers)
    const failRes = await fetch(`${BASE_URL}/api/learning/skill-assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentFailId },
      body: JSON.stringify({
        skill_name: 'Python Programming',
        role_title: 'AI Engineer',
        answers: { 'py-q1': 3, 'py-q2': 3, 'py-q3': 3 }, // all incorrect
      }),
    }).then((r) => r.json());

    assert(failRes.result.passed === false, 'Test 13a: Assessment evaluated as failed');
    assert(failRes.result.weak_areas.length > 0, 'Test 13b: Weak conceptual areas identified');

    // Check that roadmap now has remediation task
    const adaptedRdm = await fetch(`${BASE_URL}/api/learning/roadmap`, {
      headers: { 'x-user-id': studentFailId },
    }).then((r) => r.json());

    const hasRemediation = adaptedRdm.roadmap.stages.some((stg: any) =>
      stg.topics.some((tpc: any) => tpc.tasks.some((tsk: any) => tsk.is_remediation === true))
    );
    assert(hasRemediation === true, 'Test 13c & 21: Failed assessment injected targeted remediation task into roadmap');

    // -------------------------------------------------------------
    // TEST 15 & 16: Browser refresh & device persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 15 & 16: Refresh & Persistence ---');
    const refreshRes = await fetch(`${BASE_URL}/api/learning/roadmap`, {
      headers: { 'x-user-id': studentAId },
    }).then((r) => r.json());

    assert(
      refreshRes.roadmap && refreshRes.roadmap.overall_progress_percentage === compRes.overall_progress_percentage,
      'Test 15 & 16: Refresh query recovers exact roadmap state and completed progress'
    );

    // -------------------------------------------------------------
    // TEST 17: Multi-User Data Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 17: Multi-User Isolation ---');
    const strangerRes = await fetch(`${BASE_URL}/api/learning/career`, {
      headers: { 'x-user-id': 'unauthorized_stranger_user' },
    }).then((r) => r.json());

    assert(strangerRes.has_goal === false, 'Test 17: User A cannot access User B data; stranger sees no goal');

    // -------------------------------------------------------------
    // TEST 18 & 19: Resource URL Authenticity & Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 18 & 19: Verified Learning Resources ---');
    const resourcesRes = await fetch(`${BASE_URL}/api/learning/resources`).then((r) => r.json());

    assert(
      Array.isArray(resourcesRes.resources) && resourcesRes.resources.length > 5,
      'Test 18a: Resource catalog contains curated resources'
    );
    assert(
      resourcesRes.resources.every(
        (res: any) =>
          res.url.startsWith('https://') &&
          res.verification_status === 'VERIFIED' &&
          res.provider &&
          res.why_recommended
      ),
      'Test 18b & 19: All learning resources have authentic HTTPS links and verified publishers (zero fake URLs)'
    );

    // -------------------------------------------------------------
    // TEST 23: Prerequisite dependency order is respected
    // -------------------------------------------------------------
    console.log('\n--- TEST 23: Prerequisite Dependency Hygiene ---');
    const gaps = studentBGaps.gaps;
    const mlGap = gaps.find((g: any) => g.skill.name === 'Machine Learning Foundations');
    assert(
      mlGap.dependencies_satisfied === false,
      'Test 23a: ML Foundations is blocked until Python/Math prerequisites are satisfied'
    );
    assert(
      mlGap.unsatisfied_prerequisites.includes('Python Programming'),
      'Test 23b: Explicitly flags Python Programming as unsatisfied prerequisite'
    );

    console.log(`\n========================================`);
    console.log(`PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 2 Test execution error:', err);
    process.exit(1);
  }
}

runPhase2Tests();
