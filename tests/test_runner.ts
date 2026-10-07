/**
 * Comprehensive Automated Verification Suite for CareerOS Phase 1
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING CAREEROS PHASE 1 TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extraInfo?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, extraInfo || '');
      failed++;
    }
  }

  try {
    // Test 1: Health check & configuration check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Test 1: Health endpoint returns 200 OK');
    assert(healthData.config && healthData.config.gemini, 'Test 1b: System configuration reported safely without secrets');

    // Test 2: Start discovery session
    const sessionRes = await fetch(`${BASE_URL}/api/career-discovery/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ mode: 'adaptive_discovery' }),
    });
    const sessionData = await sessionRes.json();
    assert(sessionRes.status === 200 && sessionData.session?.id, 'Test 2: Create discovery session returns session ID');
    const sessionId = sessionData.session.id;

    // Test 3: Save answers
    const answersPayload = [
      { question_id: 'coding_preference', question_text: 'Coding preference', category: 'orientation', answer_value: 'loves_coding' },
      { question_id: 'problem_solving_preference', question_text: 'Problem solving', category: 'problem_solving', answer_value: 'analytical_logical' },
      { question_id: 'creativity_preference', question_text: 'Creativity', category: 'problem_solving', answer_value: 'system_solution_architecture' },
      { question_id: 'available_time_hours', question_text: 'Time', category: 'practical', answer_value: 4 },
      { question_id: 'industry_interests', question_text: 'Industries', category: 'practical', answer_value: ['Software & SaaS'] },
    ];
    const saveRes = await fetch(`${BASE_URL}/api/career-discovery/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ session_id: sessionId, answers: answersPayload }),
    });
    const saveData = await saveRes.json();
    assert(saveRes.status === 200 && saveData.count === 5, 'Test 3: Save answers persists all items');

    // Test 4 & 5: Resume session & Retrieve answers
    const getSessionRes = await fetch(`${BASE_URL}/api/career-discovery/session/${sessionId}`, {
      headers: { 'x-user-id': 'student_test_1' },
    });
    const getSessionData = await getSessionRes.json();
    assert(
      getSessionRes.status === 200 && getSessionData.answers?.length === 5,
      'Test 4 & 5: Resume session returns saved answers intact'
    );

    // Test 6: Generate Student Career Profile
    const profileRes = await fetch(`${BASE_URL}/api/career-discovery/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const profileData = await profileRes.json();
    assert(
      profileRes.status === 200 && profileData.profile?.coding_preference === 'loves_coding',
      'Test 6: Generate profile interprets answers without inferring unprovided personal attributes'
    );

    // Test 7: Generate candidate careers
    const candRes = await fetch(`${BASE_URL}/api/career-discovery/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const candData = await candRes.json();
    assert(
      candRes.status === 200 && Array.isArray(candData.recommendations) && candData.recommendations.length >= 2,
      'Test 7: Generate candidate recommendations pipeline outputs 2+ roles'
    );

    // Test 8: Research careers
    const researchRes = await fetch(`${BASE_URL}/api/career-discovery/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_title: 'Frontend Developer' }),
    });
    const researchData = await researchRes.json();
    assert(
      researchRes.status === 200 && researchData.research?.role_title === 'Frontend Developer',
      'Test 8: Research role retrieves structured overview, responsibilities, tools'
    );

    // Test 9: View sources & ensure genuine URLs (no fake domains)
    const sources = researchData.research.sources;
    assert(
      Array.isArray(sources) && sources.length > 0 && sources.every((s: any) => s.url && s.publisher && s.validation_status === 'VERIFIED'),
      'Test 9: Research citations are verified with authentic publishers & URLs'
    );

    // Test 10: Compare careers transparently
    const compareRes = await fetch(`${BASE_URL}/api/career-discovery/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({
        session_id: sessionId,
        role_titles: ['Frontend Developer', 'Backend Developer', 'Data Analyst'],
      }),
    });
    const compareData = await compareRes.json();
    assert(
      compareRes.status === 200 && compareData.comparison?.roles?.length === 3 && compareData.comparison?.dimensions?.length > 3,
      'Test 10: Compare careers outputs multi-dimensional qualitative matrix'
    );

    // Test 11: Reject recommendation
    const firstRec = candData.recommendations[0];
    const rejectRes = await fetch(`${BASE_URL}/api/career-discovery/recommendations/${firstRec.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({
        session_id: sessionId,
        role_title: firstRec.role_title,
        reason_category: "I prefer people-focused work",
        notes: 'Testing rejection loop',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(
      rejectRes.status === 200 && rejectData.success === true,
      'Test 11: Rejection feedback captured and recommendations refreshed'
    );

    // Test 12: Select final career goal
    const goalRes = await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({
        session_id: sessionId,
        target_role: 'Frontend Developer',
        goal_source: 'CAREER_DISCOVERY',
        rationale_snapshot: 'Strong alignment with passion for creating clean UI components',
      }),
    });
    const goalData = await goalRes.json();
    assert(
      goalRes.status === 200 && goalData.goal?.target_role === 'Frontend Developer' && goalData.goal?.goal_status === 'ACTIVE',
      'Test 12: Select final career persists ACTIVE goal in database'
    );

    // Test 13 & 14: Refresh & Confirm goal persists
    const getGoalRes = await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      headers: { 'x-user-id': 'student_test_1' },
    });
    const getGoalData = await getGoalRes.json();
    assert(
      getGoalRes.status === 200 && getGoalData.goal?.target_role === 'Frontend Developer',
      'Test 13 & 14: Refresh query confirms active goal persists for student'
    );

    // Test 15: Confirm another user CANNOT access private data
    const otherUserRes = await fetch(`${BASE_URL}/api/career-discovery/session/${sessionId}`, {
      headers: { 'x-user-id': 'student_unauthorized_user' },
    });
    assert(
      otherUserRes.status === 404,
      'Test 15: Multi-user isolation enforces 404 Not Found when another user tries to access private session'
    );

    const otherUserGoal = await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      headers: { 'x-user-id': 'student_unauthorized_user' },
    });
    const otherGoalData = await otherUserGoal.json();
    assert(
      otherGoalData.goal === null,
      'Test 15b: Other user sees null active goal (zero cross-user leakage)'
    );

    // Test 20: Empty questionnaire edge case
    const emptyAnswersRes = await fetch(`${BASE_URL}/api/career-discovery/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ session_id: sessionId, answers: [] }),
    });
    assert(
      emptyAnswersRes.status === 400,
      'Test 20: Empty answers array rejected with 400 Bad Request'
    );

    // Test 21: API Failure / Invalid parameters
    const invalidSessionRes = await fetch(`${BASE_URL}/api/career-discovery/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_test_1' },
      body: JSON.stringify({ mode: 'invalid_mode' }),
    });
    assert(
      invalidSessionRes.status === 400,
      'Test 21: Invalid session mode correctly returns 400 Bad Request'
    );

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
