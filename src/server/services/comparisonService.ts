import {
  EntryBarrierLevel,
  QualitativeAlignment,
  RecommendationItem,
  ResearchSource,
} from '../../types/career.ts';
import { defaultResearchProvider } from '../research/ResearchProvider.ts';

export interface ComparisonDimensionRow {
  dimension: string;
  description: string;
  values: Record<string, string | QualitativeAlignment | EntryBarrierLevel | string[]>;
}

export interface ComparisonMatrixData {
  roles: string[];
  dimensions: ComparisonDimensionRow[];
  sources_by_role: Record<string, ResearchSource[]>;
}

export class ComparisonService {
  /**
   * Build transparent qualitative comparison across 2-5 candidate careers.
   */
  async compareRoles(
    roleTitles: string[],
    recommendations: RecommendationItem[] = []
  ): Promise<ComparisonMatrixData> {
    const rolesData = await Promise.all(
      roleTitles.map(async (title) => {
        const existingRec = recommendations.find(
          (r) => r.role_title.toLowerCase() === title.toLowerCase()
        );
        const research = existingRec ? existingRec.research : await defaultResearchProvider.researchRole(title);
        const alignment: QualitativeAlignment = existingRec ? existingRec.profile_alignment : 'Moderate';
        const marketEvidence: QualitativeAlignment = research.sources.length >= 2 ? 'Strong' : 'Moderate';

        return {
          title,
          alignment,
          marketEvidence,
          entryBarrier: research.entry_barrier,
          typicalWork: research.overview,
          coreSkills: research.core_skills.slice(0, 4).join(', '),
          tools: research.common_tools.slice(0, 4).join(', '),
          businessStartupRelevance: research.business_startup_relevance,
          marketSignals: research.current_market_signals,
          sources: research.sources,
        };
      })
    );

    const alignmentValues: Record<string, any> = {};
    const marketEvidenceValues: Record<string, any> = {};
    const entryBarrierValues: Record<string, any> = {};
    const typicalWorkValues: Record<string, any> = {};
    const coreSkillsValues: Record<string, any> = {};
    const toolsValues: Record<string, any> = {};
    const startupRelevanceValues: Record<string, any> = {};
    const marketSignalValues: Record<string, any> = {};
    const sourcesByRole: Record<string, ResearchSource[]> = {};

    for (const r of rolesData) {
      alignmentValues[r.title] = r.alignment;
      marketEvidenceValues[r.title] = r.marketEvidence;
      entryBarrierValues[r.title] = r.entryBarrier;
      typicalWorkValues[r.title] = r.typicalWork;
      coreSkillsValues[r.title] = r.coreSkills;
      toolsValues[r.title] = r.tools;
      startupRelevanceValues[r.title] = r.businessStartupRelevance;
      marketSignalValues[r.title] = r.marketSignals;
      sourcesByRole[r.title] = r.sources;
    }

    const dimensions: ComparisonDimensionRow[] = [
      {
        dimension: 'Profile Alignment',
        description: 'Qualitative synthesis based on your reported interests, coding comfort, and problem solving style',
        values: alignmentValues,
      },
      {
        dimension: 'Market Evidence Strength',
        description: 'Confidence supported by official occupational records and labor statistics',
        values: marketEvidenceValues,
      },
      {
        dimension: 'Entry Barrier',
        description: 'Relative difficulty and prerequisite foundation needed for entry-level roles',
        values: entryBarrierValues,
      },
      {
        dimension: 'Core Skills',
        description: 'Primary technical and domain competencies required on the job',
        values: coreSkillsValues,
      },
      {
        dimension: 'Common Tools',
        description: 'Industry-standard applications, libraries, and dev environments',
        values: toolsValues,
      },
      {
        dimension: 'Startup & Business Relevance',
        description: 'Practical applicability for early-stage ventures and small product teams',
        values: startupRelevanceValues,
      },
      {
        dimension: 'Market & Industry Signals',
        description: 'Current real-world demand patterns reported by labor agencies',
        values: marketSignalValues,
      },
    ];

    return {
      roles: roleTitles,
      dimensions,
      sources_by_role: sourcesByRole,
    };
  }
}

export const comparisonService = new ComparisonService();
