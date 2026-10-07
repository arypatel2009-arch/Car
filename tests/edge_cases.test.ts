import { ProfileService } from '../src/server/services/profileService.ts';
import { CandidateService } from '../src/server/services/candidateService.ts';
import { OccupationalDatabaseResearchProvider } from '../src/server/research/ResearchProvider.ts';
import { StorageService } from '../src/server/services/storageService.ts';

async function testEdgeCases() {
  console.log('--- STARTING EDGE CASE & RESILIENCE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // Edge Case 1: Deterministic fallback when Gemini key is missing
  const profileService = new ProfileService();
  const rawAnswers = [
    { question_id: 'coding_preference', question_text: '', category: '', answer_value: 'no_code_or_minimal', answered_at: '' },
    { question_id: 'creativity_preference', question_text: '', category: '', answer_value: 'high_visual_design', answered_at: '' },
    { question_id: 'available_time_hours', question_text: '', category: '', answer_value: 3, answered_at: '' },
  ];
  const deterministicProf = profileService.deterministicProfile(rawAnswers);
  assert(deterministicProf.coding_preference === 'no_code_or_minimal', 'Edge Case 16: Deterministic profile runs without Gemini API');
  assert(deterministicProf.creativity_preference === 'high_visual_design', 'Edge Case 16b: Visual preference preserved deterministically');

  // Edge Case 2: Candidate generation without AI
  const candidateService = new CandidateService();
  const candidates = await candidateService.generateCandidateTitles(deterministicProf);
  assert(candidates.length >= 2, 'Edge Case 17: Candidate generation provides 2+ roles without external search key');
  assert(candidates.includes('UI/UX Designer'), 'Edge Case 17b: Candidate generation prioritizes UI/UX Designer for no-code + visual design profile');

  // Edge Case 3: Occupational research fallback never invents fake URLs
  const researchProvider = new OccupationalDatabaseResearchProvider();
  const research = await researchProvider.researchRole('Unknown Exotic Specialty');
  assert(research.sources.length > 0, 'Edge Case 18 & 19: Unknown role produces genuine standard occupational source');
  assert(research.sources[0].url.startsWith('https://www.onetonline.org/'), 'Edge Case 19b: Source URL is genuine official O*NET link');

  // Edge Case 4: Goal replacement ensures only ONE active goal at a time
  const storage = new StorageService();
  const s1 = await storage.createSession('test_student_isolated', 'direct_goal');
  const g1 = await storage.saveGoal(s1.id, 'test_student_isolated', 'Data Analyst', 'CAREER_DISCOVERY');
  assert(g1.goal_status === 'ACTIVE', 'Edge Case 22: First goal saved as ACTIVE');

  const g2 = await storage.saveGoal(s1.id, 'test_student_isolated', 'AI Engineer', 'CAREER_DISCOVERY');
  assert(g2.goal_status === 'ACTIVE', 'Edge Case 22b: Second goal saved as ACTIVE');

  const active = await storage.getActiveGoal('test_student_isolated');
  assert(active?.target_role === 'AI Engineer', 'Edge Case 22c: Active goal query returns latest goal (previous archived)');

  console.log(`\nEDGE CASE RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

testEdgeCases();
