/**
 * CareerOS Phase 2 — Skill Gap Engine
 * Compares Career Requirements vs Current Student State with dependency impact and prioritization.
 */

import {
  CareerSkill,
  CareerSkillDependency,
  CareerSkillMap,
  SkillGapCategory,
  SkillGapItem,
  SkillImportance,
  SkillProficiency,
  StudentSkillState,
} from '../../types/learning.ts';

const PROFICIENCY_RANK: Record<SkillProficiency, number> = {
  'Not Assessed': 0,
  Beginner: 1,
  Foundational: 2,
  Intermediate: 3,
  Advanced: 4,
  Strong: 5,
};

const IMPORTANCE_WEIGHT: Record<SkillImportance, number> = {
  Critical: 10,
  Important: 7,
  Useful: 4,
  Optional: 2,
};

export class SkillGapEngine {
  /**
   * Evaluates all skills in the map against student current states.
   */
  analyzeGaps(
    skillMap: CareerSkillMap,
    studentSkills: StudentSkillState[],
    availableHoursDaily: number
  ): SkillGapItem[] {
    const studentMap = new Map<string, StudentSkillState>();
    studentSkills.forEach((s) => studentMap.set(s.skill_name.toLowerCase(), s));

    // Calculate downstream dependency impact count for each skill
    const dependencyCounts = new Map<string, number>();
    skillMap.dependencies.forEach((dep) => {
      // Find required skill
      const reqSkill = skillMap.skills.find((s) => s.id === dep.required_skill_id || s.name.toLowerCase() === dep.required_skill_id.toLowerCase());
      const key = reqSkill ? reqSkill.name.toLowerCase() : dep.required_skill_id.toLowerCase();
      dependencyCounts.set(key, (dependencyCounts.get(key) || 0) + 1);
    });

    const gapItems: SkillGapItem[] = skillMap.skills.map((skill) => {
      const studentState: StudentSkillState = studentMap.get(skill.name.toLowerCase()) || {
        skill_id: skill.id,
        skill_name: skill.name,
        category: skill.category,
        claimed: false,
        assessed_proficiency: 'Not Assessed',
        demonstrated: false,
        learning_status: 'not_started',
      };

      const currentRank = PROFICIENCY_RANK[studentState.assessed_proficiency] || 0;
      const targetRank = PROFICIENCY_RANK[skill.expected_proficiency] || 3;
      const rankDiff = targetRank - currentRank;

      // Classify Gap Category
      let gapCategory: SkillGapCategory = 'Must Learn';
      if (currentRank >= targetRank) {
        gapCategory = 'Already Covered';
      } else if (currentRank === targetRank - 1 && currentRank >= 2) {
        gapCategory = 'Needs Refresh';
      } else if (skill.importance === 'Critical') {
        gapCategory = 'Must Learn';
      } else if (skill.importance === 'Important') {
        gapCategory = 'Should Learn';
      } else {
        gapCategory = 'Optional Later';
      }

      // Check prerequisite satisfaction
      const unsatisfiedPrereqs: string[] = [];
      const relevantDeps = skillMap.dependencies.filter(
        (d) => d.skill_id === skill.id || d.skill_id === skill.name
      );

      relevantDeps.forEach((dep) => {
        const prereqSkill = skillMap.skills.find(
          (s) => s.id === dep.required_skill_id || s.name.toLowerCase() === dep.required_skill_id.toLowerCase()
        );
        if (prereqSkill) {
          const prereqState = studentMap.get(prereqSkill.name.toLowerCase());
          const prereqRank = prereqState ? PROFICIENCY_RANK[prereqState.assessed_proficiency] : 0;
          // Must be at least Foundational to satisfy prerequisite
          if (prereqRank < 2) {
            unsatisfiedPrereqs.push(prereqSkill.name);
          }
        }
      });

      const dependenciesSatisfied = unsatisfiedPrereqs.length === 0;

      // Deterministic Priority Score:
      // Base = Importance * rankDiff
      // Multiplier = 1 + (downstream blocked skills * 0.5)
      // If dependencies satisfied, priority is higher now; if blocked, score is adjusted
      const downstreamImpact = dependencyCounts.get(skill.name.toLowerCase()) || 0;
      const importanceBase = IMPORTANCE_WEIGHT[skill.importance];
      let priorityScore = Math.max(0, rankDiff) * importanceBase * (1 + downstreamImpact * 0.4);

      if (gapCategory === 'Already Covered') {
        priorityScore = 0;
      } else if (dependenciesSatisfied) {
        // Can be learned immediately
        priorityScore += 5;
      }

      // Priority Tier
      let priorityTier: 'P0' | 'P1' | 'P2' | 'P3' = 'P2';
      if (gapCategory === 'Must Learn' && dependenciesSatisfied) {
        priorityTier = 'P0';
      } else if (gapCategory === 'Must Learn' || gapCategory === 'Needs Refresh') {
        priorityTier = 'P1';
      } else if (gapCategory === 'Should Learn') {
        priorityTier = 'P2';
      } else {
        priorityTier = 'P3';
      }

      // Honest why_prioritized explanation
      let whyPrioritized = '';
      if (gapCategory === 'Already Covered') {
        whyPrioritized = `You have already demonstrated ${studentState.assessed_proficiency} level in ${skill.name}. No redundant beginner work required.`;
      } else if (!dependenciesSatisfied) {
        whyPrioritized = `High-value skill, but waiting on prerequisites: ${unsatisfiedPrereqs.join(', ')} before starting.`;
      } else if (downstreamImpact > 0) {
        whyPrioritized = `Critical bottleneck: ${downstreamImpact} downstream skill(s) directly depend on this foundation.`;
      } else if (skill.importance === 'Critical') {
        whyPrioritized = `Core requirement for ${skill.role_title}. Immediate focus gap.`;
      } else {
        whyPrioritized = `Supporting skill that enhances your market competitiveness.`;
      }

      return {
        skill,
        student_state: studentState,
        gap_category: gapCategory,
        priority_score: Math.round(priorityScore * 10) / 10,
        priority_tier: priorityTier,
        why_prioritized: whyPrioritized,
        dependencies_satisfied: dependenciesSatisfied,
        unsatisfied_prerequisites: unsatisfiedPrereqs,
      };
    });

    // Sort: P0 first, then highest priority score, then ready dependencies
    return gapItems.sort((a, b) => {
      const tierRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
      if (tierRank[a.priority_tier] !== tierRank[b.priority_tier]) {
        return tierRank[a.priority_tier] - tierRank[b.priority_tier];
      }
      return b.priority_score - a.priority_score;
    });
  }
}

export const skillGapEngine = new SkillGapEngine();
