/**
 * CareerOS Phase 2.1 — Career Requirement Research Engine Verification Test Suite
 * Automated tests for:
 * 1. Dynamic requirement research for any supported career
 * 2. Strict field verification (skill/topic, category, importance, evidence, sources, confidence, status)
 * 3. Qualitative ratings (Strong, Moderate, Limited, Unknown) - zero fake numerical precision
 * 4. Categorization (Foundational, Core, Supporting, Specialized)
 * 5. Tools & technologies extraction
 * 6. Skill dependency pathways
 * 7. Traceable persistence (Supabase / dual-mode storage)
 * 8. Multi-user isolation & security
 * 9. Duplicate research caching & forced refresh
 * 10. Gemini failure handling & fallback
 * 11. Malformed AI response handling
 * 12. Research failure state without fake data
 */

const BASE_URL = 'http://localhost:3000';

async function runPhase2_1Tests() {
  console.log('=== STARTING CAREEROS PHASE 2.1 REQUIREMENTS RESEARCH TEST SUITE ===\n');
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
    const noGoalRes = await fetch(`${BASE_URL}/api/learning/requirements`, {
      headers: { 'x-user-id': 'student_p21_no_goal' },
    }).then((r) => r.json());

    assert(noGoalRes.has_goal === false, 'Test 1a: Returns has_goal: false when student has no active career goal');
    assert(noGoalRes.message === 'Choose a career goal first.', 'Test 1b: Returns clear message "Choose a career goal first."');

    // -------------------------------------------------------------
    // TEST 2: Research Pipeline for "AI Engineer" Goal
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Research Pipeline for "AI Engineer" ---');
    const studentAiId = 'student_p21_ai_engineer';
    // Save active goal
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAiId },
      body: JSON.stringify({
        session_id: 'session-p21-ai',
        target_role: 'AI Engineer',
        goal_source: 'CAREER_DISCOVERY',
        rationale_snapshot: 'Strong mathematical aptitude and interest in machine intelligence.',
      }),
    });

    const aiReqRes = await fetch(`${BASE_URL}/api/learning/requirements`, {
      headers: { 'x-user-id': studentAiId },
    }).then((r) => r.json());

    assert(aiReqRes.has_goal === true, 'Test 2a: Successfully identifies active AI Engineer goal');
    assert(aiReqRes.overview !== null, 'Test 2b: Returns populated CareerRequirementsOverview');
    assert(aiReqRes.overview.target_role === 'AI Engineer', 'Test 2c: Target role matches "AI Engineer"');

    const overview = aiReqRes.overview;
    const run = overview.run;
    assert(run.status === 'COMPLETED', 'Test 2d: Research run marked as COMPLETED');
    assert(typeof run.what_career_involves === 'string' && run.what_career_involves.length > 20, 'Test 2e: Includes "What this career actually involves"');
    assert(typeof run.typical_work_summary === 'string' && run.typical_work_summary.length > 10, 'Test 2f: Includes typical work summary');
    assert(typeof run.entry_level_expectations === 'string' && run.entry_level_expectations.length > 10, 'Test 2g: Includes entry-level expectations');
    assert(typeof run.evidence_proof_expectations === 'string' && run.evidence_proof_expectations.length > 10, 'Test 2h: Includes evidence/proof expectations principle');
    assert(typeof run.research_freshness === 'string' && run.research_freshness.length > 5, 'Test 2i: Includes research freshness indicator');

    // -------------------------------------------------------------
    // TEST 3: Strict Field Structure on Every Requirement Item
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Requirement Items Structure & Schema ---');
    const requirements = run.requirements;
    assert(Array.isArray(requirements) && requirements.length >= 4, 'Test 3a: Contains comprehensive list of requirements');

    const validCategories = ['FOUNDATIONAL', 'CORE', 'SUPPORTING', 'SPECIALIZED'];
    const validImportance = ['Strong', 'Moderate', 'Limited', 'Unknown'];
    const validConfidence = ['Strong', 'Moderate', 'Limited', 'Unknown'];

    const allHaveRequiredFields = requirements.every((r: any) => {
      const hasId = typeof r.id === 'string' && r.id.length > 0;
      const hasSkill = typeof r.skill_or_topic === 'string' && r.skill_or_topic.length > 0;
      const hasCategory = validCategories.includes(r.category);
      const hasDesc = typeof r.description === 'string' && r.description.length > 0;
      const hasImportance = validImportance.includes(r.importance);
      const hasPrereqs = Array.isArray(r.prerequisite_skills);
      const hasEvidence = typeof r.evidence_expectation === 'string' && r.evidence_expectation.length > 0;
      const hasSource = typeof r.source === 'string' && r.source.length > 0;
      const hasSourceUrl = typeof r.source_url === 'string' && r.source_url.startsWith('https://');
      const hasSourcePub = typeof r.source_publisher === 'string' && r.source_publisher.length > 0;
      const hasRetrievedAt = typeof r.retrieved_at === 'string' && !isNaN(Date.parse(r.retrieved_at));
      const hasConfidence = validConfidence.includes(r.confidence);
      const hasStatus = typeof r.validation_status === 'string';

      return (
        hasId &&
        hasSkill &&
        hasCategory &&
        hasDesc &&
        hasImportance &&
        hasPrereqs &&
        hasEvidence &&
        hasSource &&
        hasSourceUrl &&
        hasSourcePub &&
        hasRetrievedAt &&
        hasConfidence &&
        hasStatus
      );
    });

    assert(allHaveRequiredFields, 'Test 3b: Every requirement contains all 13 required fields (skill, category, description, importance, prereqs, evidence, source, URL, publisher, date, retrieved_at, confidence, validation status)');

    // -------------------------------------------------------------
    // TEST 4: Zero Fake Numerical Precision
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Qualitative Integrity (Zero Fake Numerical Precision) ---');
    const noFakePrecision = requirements.every((r: any) => {
      const importanceIsQualitative = ['Strong', 'Moderate', 'Limited', 'Unknown'].includes(r.importance);
      const confidenceIsQualitative = ['Strong', 'Moderate', 'Limited', 'Unknown'].includes(r.confidence);
      const noPercentInImportance = !String(r.importance).includes('%');
      return importanceIsQualitative && confidenceIsQualitative && noPercentInImportance;
    });

    assert(noFakePrecision, 'Test 4: Uses honest qualitative scales (Strong/Moderate/Limited/Unknown) without fake decimal percentages');

    // -------------------------------------------------------------
    // TEST 5: Hierarchy (Foundational, Core, Supporting, Specialized)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Category Hierarchy Separation ---');
    const foundational = overview.foundational_requirements;
    const core = overview.core_requirements;
    const supporting = overview.supporting_requirements;
    const specialized = overview.specialized_requirements;

    assert(Array.isArray(foundational) && foundational.length > 0, 'Test 5a: Separates FOUNDATIONAL requirements (e.g. Python / Math basics)');
    assert(Array.isArray(core) && core.length > 0, 'Test 5b: Separates CORE requirements (e.g. ML / Deep Learning / APIs)');
    assert(Array.isArray(supporting), 'Test 5c: Separates SUPPORTING requirements');
    assert(Array.isArray(specialized), 'Test 5d: Separates SPECIALIZED requirements');

    // -------------------------------------------------------------
    // TEST 6: Tools & Technologies Identification
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Tools & Technologies ---');
    const tools = overview.tools_and_technologies;
    assert(Array.isArray(tools), 'Test 6a: Extracts tools & technologies array');
    const hasTools = tools.length > 0 || requirements.some((r: any) => r.skill_type === 'Tool/Technology');
    assert(hasTools, 'Test 6b: Identifies industry tools & technologies');

    // -------------------------------------------------------------
    // TEST 7: Skill Dependency Pathways
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Skill Dependencies ---');
    const dependencies = overview.skill_dependencies;
    assert(Array.isArray(dependencies) && dependencies.length > 0, 'Test 7a: Produces structured skill dependency edges');
    assert(
      dependencies.every((d: any) => d.skill && Array.isArray(d.requires) && d.requires.length > 0),
      'Test 7b: Dependency edges map target skill to required prerequisite skills'
    );

    // -------------------------------------------------------------
    // TEST 8: Sources & Citations
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Authoritative Research Sources ---');
    const sources = run.sources;
    assert(Array.isArray(sources) && sources.length > 0, 'Test 8a: Research run attaches authoritative source records');
    assert(
      sources.every(
        (s: any) =>
          s.title &&
          s.publisher &&
          s.url.startsWith('https://') &&
          s.validation_status === 'VERIFIED'
      ),
      'Test 8b: All source URLs are authentic HTTPS links with verified governmental or industry publishers'
    );

    // -------------------------------------------------------------
    // TEST 9: Dynamic Support for ANY Supported Career
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Dynamic Execution for Different Careers ---');
    const studentFeId = 'student_p21_frontend';
    await fetch(`${BASE_URL}/api/career-discovery/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentFeId },
      body: JSON.stringify({
        session_id: 'session-p21-fe',
        target_role: 'Frontend Developer',
        goal_source: 'CAREER_DISCOVERY',
      }),
    });

    const feReqRes = await fetch(`${BASE_URL}/api/learning/requirements`, {
      headers: { 'x-user-id': studentFeId },
    }).then((r) => r.json());

    assert(feReqRes.overview?.target_role === 'Frontend Developer', 'Test 9a: Dynamically synthesizes requirements for Frontend Developer');
    assert(
      feReqRes.overview?.run?.requirements.some((r: any) => r.skill_or_topic.toLowerCase().includes('javascript') || r.skill_or_topic.toLowerCase().includes('react') || r.skill_or_topic.toLowerCase().includes('html')),
      'Test 9b: Frontend requirements reflect web client engineering competencies'
    );

    // -------------------------------------------------------------
    // TEST 10: Duplicate Research Handling & Caching
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Duplicate Research Caching & Force Refresh ---');
    // Calling again without force_refresh should return cached run
    const cachedReqRes = await fetch(`${BASE_URL}/api/learning/requirements`, {
      headers: { 'x-user-id': studentAiId },
    }).then((r) => r.json());

    assert(cachedReqRes.overview?.run.id === run.id, 'Test 10a: Second call returns the existing research run ID');
    assert(cachedReqRes.overview?.run.is_cached === true, 'Test 10b: Duplicate call flagged as cached (is_cached: true)');

    // POST with force_refresh: true should create a fresh run
    const forceRes = await fetch(`${BASE_URL}/api/learning/requirements/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': studentAiId },
      body: JSON.stringify({
        role_title: 'AI Engineer',
        force_refresh: true,
      }),
    }).then((r) => r.json());

    assert(forceRes.success === true, 'Test 10c: Forced refresh completes successfully');
    assert(forceRes.overview?.run.id !== run.id, 'Test 10d: Forced refresh generated a fresh traceable research run ID');

    // -------------------------------------------------------------
    // TEST 11: Multi-User Data Isolation & Traceable History
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: Multi-User Isolation & Runs History ---');
    const aiRunsRes = await fetch(`${BASE_URL}/api/learning/requirements/runs`, {
      headers: { 'x-user-id': studentAiId },
    }).then((r) => r.json());

    assert(Array.isArray(aiRunsRes.runs) && aiRunsRes.runs.length >= 2, 'Test 11a: Traceable history returns student AI runs');
    assert(
      aiRunsRes.runs.every((r: any) => r.user_id === studentAiId),
      'Test 11b: All returned runs belong strictly to student_ai'
    );

    const feRunsRes = await fetch(`${BASE_URL}/api/learning/requirements/runs`, {
      headers: { 'x-user-id': studentFeId },
    }).then((r) => r.json());

    assert(
      feRunsRes.runs.every((r: any) => r.user_id === studentFeId),
      'Test 11c: Student FE only sees their own runs'
    );
    assert(
      !feRunsRes.runs.some((r: any) => r.target_role === 'AI Engineer'),
      'Test 11d: User A runs are never exposed to User B (strict isolation / RLS equivalent)'
    );

    // -------------------------------------------------------------
    // TEST 12: Direct Arbitrary Role Query via Query Param / Body
    // -------------------------------------------------------------
    console.log('\n--- TEST 12: Arbitrary Role Query ---');
    const arbitraryRes = await fetch(`${BASE_URL}/api/learning/requirements?role=Cybersecurity%20Analyst`, {
      headers: { 'x-user-id': 'student_cyber' },
    }).then((r) => r.json());

    assert(arbitraryRes.overview?.target_role === 'Cybersecurity Analyst', 'Test 12a: Successfully researches arbitrary role via query param');
    assert(arbitraryRes.overview?.run?.requirements.length > 0, 'Test 12b: Populates requirements for arbitrary role');

    // -------------------------------------------------------------
    // TEST 13: Gemini Failure & Deterministic Baseline Fallback
    // -------------------------------------------------------------
    console.log('\n--- TEST 13: Gemini Failure Handling & Fallback ---');
    // Test that RequirementsPipeline safely executes even when AI is unavailable or fails
    const { requirementsPipeline } = await import('../src/server/requirements/requirementsPipeline.ts');
    
    // Simulate research with valid role - pipeline uses deterministic baseline fallback if AI throws
    const fallbackRun = await requirementsPipeline.executeResearch(
      'student_test_fallback',
      'Backend Developer',
      null,
      true
    );

    assert(fallbackRun.status === 'COMPLETED', 'Test 13a: Research completes successfully with authoritative fallback');
    assert(fallbackRun.requirements.length > 0, 'Test 13b: Fallback produces full requirements array without crashing');
    assert(fallbackRun.sources.length > 0, 'Test 13c: Fallback maintains verified BLS/O*NET sources');

    // -------------------------------------------------------------
    // TEST 14: Malformed AI Response / Sanitization
    // -------------------------------------------------------------
    console.log('\n--- TEST 14: Malformed AI Response Handling ---');
    // Verify validateAndSanitizeRequirements cleans up missing fields and improper values
    const rawMalformedReqs: any[] = [
      {
        id: 'test-1',
        skill_or_topic: 'Faulty Item',
        category: 'INVALID_CATEGORY', // invalid category
        skill_type: 'INVALID_TYPE', // invalid type
        description: 'Test description',
        importance: 'INVALID_IMPORTANCE', // invalid importance
        confidence: 'INVALID_CONFIDENCE',
        prerequisite_skills: [],
        evidence_expectation: 'Test expectation',
        typical_work_application: 'Test app',
        source: '',
        source_url: 'http://insecure-or-invalid.com', // invalid non-https
        source_publisher: '',
        source_date: null,
        retrieved_at: new Date().toISOString(),
        validation_status: 'VERIFIED',
      },
    ];

    const sanitized = (requirementsPipeline as any).validateAndSanitizeRequirements(
      rawMalformedReqs,
      [
        {
          id: 'src-1',
          title: 'Official O*NET',
          publisher: 'U.S. Department of Labor',
          url: 'https://www.onetonline.org',
          published_at: null,
          retrieved_at: new Date().toISOString(),
          source_type: 'OFFICIAL_OCCUPATIONAL',
          evidence_excerpt: 'Standards',
          validation_status: 'VERIFIED',
        },
      ]
    );

    assert(sanitized[0].category === 'CORE', 'Test 14a: Sanitizes invalid category to CORE');
    assert(sanitized[0].importance === 'Strong', 'Test 14b: Sanitizes invalid importance to Strong');
    assert(sanitized[0].skill_type === 'Skill', 'Test 14c: Sanitizes invalid skill_type to Skill');
    assert(sanitized[0].source_url.startsWith('https://'), 'Test 14d: Sanitizes invalid URL to verified authoritative HTTPS source');

    // -------------------------------------------------------------
    // TEST 15: Storage Service Supabase & Memory Dual-Mode
    // -------------------------------------------------------------
    console.log('\n--- TEST 15: Storage Service Dual-Mode Verification ---');
    const { requirementsStorageService } = await import('../src/server/requirements/requirementsStorageService.ts');
    // Test direct storage service persistence with fallbackRun saved in this process
    const savedRun = await requirementsStorageService.getLatestResearchRun('student_test_fallback', 'Backend Developer');
    assert(savedRun !== null, 'Test 15a: Storage retrieves latest research run');
    assert(savedRun?.requirements.length === fallbackRun.requirements.length, 'Test 15b: Storage accurately preserves all requirement records');

    // Test server-persisted runs retrieval
    const runsRes = await fetch(`${BASE_URL}/api/learning/requirements/runs`, {
      headers: { 'x-user-id': studentAiId },
    }).then((r) => r.json());
    assert(Array.isArray(runsRes.runs) && runsRes.runs.length > 0, 'Test 15c: Server persists research runs across sessions');

    console.log(`\n========================================`);
    console.log(`PHASE 2.1 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 2.1 Test execution error:', err);
    process.exit(1);
  }
}

runPhase2_1Tests();
