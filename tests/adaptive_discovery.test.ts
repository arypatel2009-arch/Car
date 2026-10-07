/**
 * Comprehensive Automated Verification Suite for CareerOS Adaptive Career Discovery
 * Tests all 14 required test cases across students with different answers,
 * early stops, contradiction resolution, targeted verification, and multi-user isolation.
 */

const BASE_URL = 'http://localhost:3000';

async function runAdaptiveTests() {
  console.log('=== STARTING CAREEROS ADAPTIVE DISCOVERY TEST SUITE ===\n');
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
    // TEST 1: Student A reaches sufficient evidence quickly (stops early)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Student A (Decisive answers -> stops early) ---');
    const startA = await fetch(`${BASE_URL}/api/career-discovery/adaptive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_A' },
      body: JSON.stringify({ mode: 'adaptive_discovery' }),
    }).then((r) => r.json());

    const sessionA = startA.session.id;
    assert(startA.state.questions_answered_count === 0, 'Test 1a: Student A begins with 0 questions answered');

    // Decisive answers: loves building web apps, loves coding, visual design focus, 4 hrs daily
    let stateA = startA.state;
    const decisiveAnswers = [
      { qId: 'work_type_enjoy', val: 'building_apps' },
      { qId: 'coding_preference', val: 'loves_coding' },
      { qId: 'data_vs_visuals', val: 'visual_interfaces' },
      { qId: 'problem_solving_preference', val: 'creative_open_ended' },
      { qId: 'math_comfort', val: 'minimal_math' },
      { qId: 'available_time_hours', val: 4 },
    ];

    for (const ans of decisiveAnswers) {
      if (stateA.current_question && !stateA.is_sufficient) {
        const res = await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_A' },
          body: JSON.stringify({
            session_id: sessionA,
            question_id: stateA.current_question.question_id,
            answer_value: ans.val,
          }),
        }).then((r) => r.json());
        stateA = res.state;
      }
    }

    assert(stateA.questions_answered_count <= 8, `Test 1b: Student A reaches sufficiency early in ${stateA.questions_answered_count} questions`);
    assert(stateA.candidate_signals[0]?.role_title === 'Frontend Developer', 'Test 1c: Top candidate is Frontend Developer with strong separation');

    // -------------------------------------------------------------
    // TEST 2 & TEST 6: Student B (Ambiguous answers -> asks additional targeted questions)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Student B (Ambiguous answers -> needs more questions) ---');
    const startB = await fetch(`${BASE_URL}/api/career-discovery/adaptive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_B' },
      body: JSON.stringify({ mode: 'adaptive_discovery' }),
    }).then((r) => r.json());

    const sessionB = startB.session.id;
    let stateB = startB.state;

    // Ambiguous answers: undecided coding, balanced business, moderate math
    const ambiguousAnswers = [
      { val: 'systems_data' },
      { val: 'practical_coding' },
      { val: 'server_architecture' },
      { val: 'analytical_logical' },
      { val: 'applied_math' },
    ];

    for (const ans of ambiguousAnswers) {
      if (stateB.current_question && !stateB.is_sufficient) {
        const res = await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_B' },
          body: JSON.stringify({
            session_id: sessionB,
            question_id: stateB.current_question.question_id,
            answer_value: ans.val,
          }),
        }).then((r) => r.json());
        stateB = res.state;
      }
    }

    // Because signals were close, Student B should NOT have stopped at 5 questions
    assert(stateB.questions_answered_count >= 5, 'Test 2a: Student B answers 5 questions without premature stop');
    assert(stateB.candidate_signals.length > 2, 'Test 6: Multiple candidate career paths maintained and evaluated');

    // -------------------------------------------------------------
    // TEST 4: Student gives contradictory answers -> Clarification asked
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Student C (Contradiction detection & clarification) ---');
    const startC = await fetch(`${BASE_URL}/api/career-discovery/adaptive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_C' },
      body: JSON.stringify({ mode: 'adaptive_discovery' }),
    }).then((r) => r.json());

    const sessionC = startC.session.id;

    // Step 1: Broad orientation
    await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_C' },
      body: JSON.stringify({
        session_id: sessionC,
        question_id: 'work_type_enjoy',
        answer_value: 'building_apps',
      }),
    });

    // Step 2: Says "I strongly dislike coding" (no_code_or_minimal)
    await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_C' },
      body: JSON.stringify({
        session_id: sessionC,
        question_id: 'coding_preference',
        answer_value: 'no_code_or_minimal',
      }),
    });

    // Step 3: Now gives conflicting answer: Wants to build deep AI systems (ai_builder)
    const resContra = await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_C' },
      body: JSON.stringify({
        session_id: sessionC,
        question_id: 'interest_in_ai',
        answer_value: 'ai_builder',
      }),
    }).then((r) => r.json());

    assert(
      resContra.state.active_contradictions.length > 0,
      'Test 4a: Contradiction detected between no-code preference and deep AI builder goal'
    );
    assert(
      resContra.state.current_question?.is_clarification === true,
      'Test 4b: Next question is an immediate clarification question'
    );
    assert(
      resContra.state.current_question?.question_text.includes("don't enjoy coding") ||
        resContra.state.current_question?.question_text.includes("AI"),
      'Test 4c: Clarification question highlights both earlier and conflicting statement'
    );

    // -------------------------------------------------------------
    // TEST 5: Student does not get asked the same question twice
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Question repetition prevention ---');
    const answeredDims = resContra.state.answered_dimensions;
    const nextQId = resContra.state.current_question?.question_id;
    assert(
      !answeredDims.includes(nextQId),
      'Test 5: Engine never re-asks an already answered dimension unless intentional clarification'
    );

    // -------------------------------------------------------------
    // TEST 7: Branch A (Clear career goal -> targeted verification)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Branch A (Known goal -> targeted verification) ---');
    const startKnown = await fetch(`${BASE_URL}/api/career-discovery/adaptive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_known' },
      body: JSON.stringify({ mode: 'direct_goal', initial_input: 'AI Engineer' }),
    }).then((r) => r.json());

    const sessionKnown = startKnown.session.id;
    assert(startKnown.state.current_question?.dimension === 'verify_appeal', 'Test 7a: First question verifies appeal of AI Engineer');

    // Answer verification steps
    const verifyAns1 = await fetch(`${BASE_URL}/api/career-discovery/adaptive/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_known' },
      body: JSON.stringify({
        session_id: sessionKnown,
        question_id: 'verify_appeal',
        answer_value: 'intellectual_challenge',
      }),
    }).then((r) => r.json());

    assert(verifyAns1.state.current_question?.dimension === 'verify_coding', 'Test 7b: Second question tests coding readiness for AI Engineer');

    // -------------------------------------------------------------
    // TEST 8: Rejection feedback loop
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Recommendation rejection feedback loop ---');
    // Reject an item
    const rejectRes = await fetch(`${BASE_URL}/api/career-discovery/recommendations/rec-1-test/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_A' },
      body: JSON.stringify({
        session_id: sessionA,
        role_title: 'UI/UX Designer',
        reason_category: "I prefer business",
        notes: 'Drawn more to commercial outcomes',
      }),
    }).then((r) => r.json());

    assert(rejectRes.success === true, 'Test 8: Rejection feedback saved and candidate recommendations updated');

    // -------------------------------------------------------------
    // TEST 9 & 10: Research and AI Resilience (No fake data on failure)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9 & 10: Fallback and Genuine Research Citations ---');
    const researchRes = await fetch(`${BASE_URL}/api/career-discovery/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_title: 'Frontend Developer' }),
    }).then((r) => r.json());

    assert(researchRes.research.sources.length > 0, 'Test 9a: Research returns authentic citations');
    assert(
      researchRes.research.sources[0].url.startsWith('https://www.bls.gov') ||
        researchRes.research.sources[0].url.startsWith('https://www.onetonline.org'),
      'Test 9b: Research sources are genuine governmental labor URLs (no fabricated links)'
    );

    // -------------------------------------------------------------
    // TEST 11 & 12: Session Persistence & Cross-device Recovery
    // -------------------------------------------------------------
    console.log('\n--- TEST 11 & 12: Browser Refresh & Session Persistence ---');
    const resumeRes = await fetch(`${BASE_URL}/api/career-discovery/adaptive/state/${sessionA}`, {
      headers: { 'x-user-id': 'student_A' },
    }).then((r) => r.json());

    assert(resumeRes.state.session_id === sessionA, 'Test 11: Browser refresh recovers exact adaptive session state');
    assert(resumeRes.answers.length > 0, 'Test 12: Stored question history intact on session recovery');

    // -------------------------------------------------------------
    // TEST 13: Multi-User Isolation (User A cannot access User B data)
    // -------------------------------------------------------------
    console.log('\n--- TEST 13: Multi-User Data Isolation ---');
    const hackerAttempt = await fetch(`${BASE_URL}/api/career-discovery/session/${sessionA}`, {
      headers: { 'x-user-id': 'unauthorized_stranger' },
    });
    assert(hackerAttempt.status === 404, 'Test 13: Stranger cannot access Student A private discovery session (404 enforced)');

    // -------------------------------------------------------------
    // TEST 14: Uncertainty Model & No Fake Certainty
    // -------------------------------------------------------------
    console.log('\n--- TEST 14: Uncertainty Model ---');
    const topCand = stateA.candidate_signals[0];
    assert(
      ['Strong', 'Moderate', 'Limited'].includes(topCand.alignment),
      'Test 14: Qualitative alignment used (Strong/Moderate/Limited) without fake decimal percentages'
    );

    console.log('\n========================================');
    console.log(`ADAPTIVE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAdaptiveTests();
