/**
 * CareerOS Phase 2.3 — Learning Resource Engine
 * Finds high-quality learning resources (YouTube prioritized) for every learning topic.
 * Traceable runs, 24h caching, deterministic ranking, dual-mode persistence, and student state tracking.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  ResourceCoverage,
  ResourceDifficulty,
  ResourceRelevance,
  ResourceResearchRun,
  ResourceStatus,
  StudentResourceState,
  TopicLearningResource,
} from '../../types/learning.ts';
import { storageService } from '../services/storageService.ts';
import { youtubeClient } from './youtubeClient.ts';
import { VERIFIED_YOUTUBE_REGISTRY } from './verifiedYouTubeRegistry.ts';
import { VERIFIED_RESOURCE_CATALOG } from './resourceCatalog.ts';
import {
  deterministicResourceRankingEngine,
  RankingContext,
} from './deterministicResourceRanking.ts';
import { getGeminiClient } from '../gemini.ts';
import { serverConfig } from '../config.ts';

export interface DiscoverResourcesOptions {
  studentProficiency?: 'Beginner' | 'Intermediate' | 'Advanced';
  learningPreference?: 'video' | 'reading' | 'practice' | 'mixed';
  prerequisites?: string[];
  forceRefresh?: boolean;
}

export class LearningResourceEngine {
  // In-memory cache for fast retrieval and offline fallback
  private runCache = new Map<string, ResourceResearchRun>(); // key: `${topicTitle.toLowerCase()}:${targetRole.toLowerCase()}`
  private studentStates = new Map<string, Map<string, StudentResourceState>>(); // key: userId -> (resourceId -> state)

  private get supabase(): SupabaseClient | null {
    return (storageService as any).supabase || null;
  }

  /**
   * Generates a cache key for topic and role.
   */
  private getCacheKey(topicTitle: string, targetRole: string): string {
    return `${topicTitle.trim().toLowerCase()}:${targetRole.trim().toLowerCase()}`;
  }

  /**
   * AI Interpretation Layer:
   * AI may interpret:
   * - topic relevance
   * - content scope
   * - difficulty
   * - coverage
   * Backend strictly determines:
   * - validity
   * - duplicates
   * - URL structure
   * - resource status
   * - ranking combination
   * - storage
   */
  async interpretCandidateWithAI(
    title: string,
    description: string,
    topicTitle: string,
    targetRole: string
  ): Promise<{
    relevance?: ResourceRelevance;
    difficulty?: ResourceDifficulty;
    coverage?: ResourceCoverage;
    content_scope?: string;
    educational_signals?: string[];
  } | null> {
    const ai = getGeminiClient();
    if (!ai) return null;

    try {
      const prompt = `You are an educational curriculum evaluator for CareerOS.
Evaluate this educational resource candidate for the topic "${topicTitle}" in the career goal "${targetRole}":
Title: "${title}"
Description: "${description}"

Return strictly valid JSON:
{
  "topic_relevance": "High" | "Moderate" | "General",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "coverage": "Comprehensive" | "Targeted" | "Overview",
  "content_scope": "Concise summary of content scope",
  "quality_signals": ["Signal 1", "Signal 2"]
}`;

      const response = await ai.models.generateContent({
        model: serverConfig.geminiModel,
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective curriculum auditor. Return raw JSON only.',
          temperature: 0.1,
        },
      });

      let raw = (response.text || '').trim();
      if (raw.startsWith('```json')) raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (raw.startsWith('```')) raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(raw);

      return {
        relevance: ['High', 'Moderate', 'General'].includes(parsed.topic_relevance)
          ? parsed.topic_relevance
          : 'High',
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(parsed.difficulty)
          ? parsed.difficulty
          : 'Beginner',
        coverage: ['Comprehensive', 'Targeted', 'Overview'].includes(parsed.coverage)
          ? parsed.coverage
          : 'Targeted',
        content_scope: typeof parsed.content_scope === 'string' ? parsed.content_scope : undefined,
        educational_signals: Array.isArray(parsed.quality_signals)
          ? parsed.quality_signals.map(String)
          : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Main entry point: Finds and ranks verified resources for a learning topic.
   * Priority: YouTube educational video content + official reference documentation.
   */
  async discoverResourcesForTopic(
    topicId: string,
    topicTitle: string,
    targetRole: string,
    options: DiscoverResourcesOptions = {}
  ): Promise<ResourceResearchRun> {
    const cacheKey = this.getCacheKey(topicTitle, targetRole);
    const now = Date.now();

    // 1. Check in-memory cache unless force refresh
    if (!options.forceRefresh && this.runCache.has(cacheKey)) {
      const cached = this.runCache.get(cacheKey)!;
      const cachedTime = new Date(cached.retrieved_at).getTime();
      const isFresh = now - cachedTime < 24 * 60 * 60 * 1000; // 24 hours TTL

      if (isFresh) {
        return {
          ...cached,
          is_cached: true,
        };
      }
    }

    const runId = `res-run-${topicId.replace(/[^a-zA-Z0-9-]/g, '')}-${now.toString(36)}`;
    const candidates: TopicLearningResource[] = [];
    let providerUsed: 'YOUTUBE_API' | 'VERIFIED_CATALOG' | 'HYBRID' = 'VERIFIED_CATALOG';
    const isApiConfigured = youtubeClient.isConfigured();

    // 2. Discover YouTube Resources: Query live API if configured
    if (isApiConfigured) {
      const liveResults = await youtubeClient.searchEducationalVideos(topicTitle, targetRole, 6);
      if (liveResults.items.length > 0) {
        providerUsed = 'YOUTUBE_API';
        for (let idx = 0; idx < liveResults.items.length; idx++) {
          const item = liveResults.items[idx];
          const candidate: TopicLearningResource = {
            resource_id: `yt-live-${item.videoId}`,
            topic_id: topicId,
            topic_title: topicTitle,
            type: 'youtube',
            title: item.title,
            description: item.description,
            url: `https://www.youtube.com/watch?v=${item.videoId}`,
            thumbnail_url: item.thumbnailUrl,
            provider: 'YouTube',
            author_channel: item.channelTitle,
            author: item.channelTitle,
            channel: item.channelTitle,
            duration: item.durationFormatted,
            duration_seconds: item.durationSeconds,
            published_at: item.publishedAt ? item.publishedAt.substring(0, 10) : undefined,
            discovered_at: new Date().toISOString(),
            source_metadata: {
              source: 'YouTube Data API v3',
              channel_id: item.channelId,
              view_count: item.viewCount,
            },
            quality_signals: ['Live Verified Video', 'Full Embeddable Stream', 'Educational Search'],
            relevance: 'High',
            difficulty: options.studentProficiency || 'Beginner',
            coverage: item.durationSeconds > 1800 ? 'Comprehensive' : 'Targeted',
            status: 'VALIDATED',
            rank_tier: idx === 0 ? 'Top Pick' : 'Recommended',
          };

          candidates.push(candidate);
        }
      }
    }

    // 3. Pull matching verified educational YouTube videos from curated registry
    const topicKeywords = topicTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const catalogYouTubeMatches = VERIFIED_YOUTUBE_REGISTRY.filter((yt) => {
      const text = `${yt.topic_title || ''} ${yt.title} ${yt.description}`.toLowerCase();
      return topicKeywords.some((kw) => text.includes(kw));
    });

    if (catalogYouTubeMatches.length > 0) {
      if (providerUsed === 'YOUTUBE_API') providerUsed = 'HYBRID';
      catalogYouTubeMatches.forEach((item) => {
        candidates.push({
          ...item,
          topic_id: topicId,
          topic_title: topicTitle,
          author: item.author_channel,
          channel: item.author_channel,
        });
      });
    }

    // 4. Also include official documentation & recognized references as complementary resources
    const docMatches = VERIFIED_RESOURCE_CATALOG.filter((doc) => {
      const text = `${doc.topic} ${doc.title} ${doc.why_recommended}`.toLowerCase();
      return topicKeywords.some((kw) => text.includes(kw));
    });

    docMatches.forEach((doc) => {
      candidates.push({
        resource_id: doc.id,
        topic_id: topicId,
        topic_title: topicTitle,
        type: doc.type === 'official_doc' ? 'official_doc' : doc.type === 'practice_platform' ? 'practice_platform' : 'tutorial',
        title: doc.title,
        description: doc.why_recommended,
        url: doc.url,
        provider: doc.provider,
        author_channel: doc.provider,
        author: doc.provider,
        channel: doc.provider,
        duration: doc.type === 'official_doc' ? 'Self-Paced Reading' : 'Practice Sandbox',
        duration_seconds: 1800,
        published_at: doc.retrieved_date,
        discovered_at: new Date().toISOString(),
        source_metadata: { source: 'Verified Occupational Documentation', verification_status: doc.verification_status },
        quality_signals: ['Official Specification', 'Standards Body', 'Zero Synthetics'],
        relevance: 'High',
        difficulty: doc.difficulty === 'beginner' ? 'Beginner' : doc.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced',
        coverage: 'Comprehensive',
        status: 'VALIDATED',
        rank_tier: 'Recommended',
      });
    });

    // 5. Never fabricate fallback YouTube resources.
    // If YouTube is unavailable, show alternative validated resources if available;
    // otherwise clearly show no verified resource currently available.
    let statusMessage = '';
    const hasVerifiedResources = candidates.length > 0;

    if (!hasVerifiedResources) {
      statusMessage = 'No verified resource currently available';
    } else {
      statusMessage = `${candidates.length} verified learning resource(s) matched`;
    }

    // 6. Pass candidates to Deterministic Resource-Ranking Layer
    const rankingContext: RankingContext = {
      topicTitle,
      targetRole,
      studentProficiency: options.studentProficiency,
      learningPreference: options.learningPreference || 'video',
      prerequisites: options.prerequisites,
    };

    const rankedResults = candidates.length > 0
      ? deterministicResourceRankingEngine.rankResources(candidates, rankingContext)
      : [];
    const finalResources: TopicLearningResource[] = rankedResults.map((r) => r.resource);

    // 7. Assemble Traceable Research Run
    const run: ResourceResearchRun = {
      run_id: runId,
      topic_id: topicId,
      topic_title: topicTitle,
      target_role: targetRole,
      provider_used: providerUsed,
      api_configured: isApiConfigured,
      is_cached: false,
      retrieved_at: new Date().toISOString(),
      resources_count: finalResources.length,
      results: finalResources,
      status_message: statusMessage,
      has_verified_resources: hasVerifiedResources,
    };

    // 8. Cache in memory
    this.runCache.set(cacheKey, run);

    // 9. Persist run and resources in Supabase if connected
    if (this.supabase) {
      try {
        await this.supabase.from('resource_research_runs').insert({
          id: run.run_id,
          topic_id: run.topic_id,
          topic_title: run.topic_title,
          target_role: run.target_role,
          provider_used: run.provider_used,
          api_configured: run.api_configured,
          is_cached: false,
          resources_count: run.resources_count,
          created_at: run.retrieved_at,
        });

        const rows = finalResources.map((res) => ({
          id: res.resource_id,
          run_id: run.run_id,
          topic_id: res.topic_id,
          topic_title: res.topic_title,
          type: res.type,
          title: res.title,
          description: res.description,
          url: res.url,
          thumbnail_url: res.thumbnail_url || null,
          provider: res.provider,
          author_channel: res.author_channel,
          duration: res.duration,
          duration_seconds: res.duration_seconds || null,
          published_at: res.published_at || null,
          discovered_at: res.discovered_at,
          source_metadata: res.source_metadata,
          quality_signals: res.quality_signals,
          relevance: res.relevance,
          difficulty: res.difficulty,
          coverage: res.coverage,
          status: res.status,
          rank_tier: res.rank_tier,
          rank_score: res.rank_score || 0,
          rank_rationale: res.rank_rationale || null,
        }));

        await this.supabase.from('topic_learning_resources').upsert(rows, { onConflict: 'id' });
      } catch (err) {
        console.warn('[ResourceEngine] Supabase persistence error:', err);
      }
    }

    return run;
  }

  /**
   * Sets student state for a resource (SUGGESTED, SELECTED, PRIMARY, COMPLETED, REJECTED, REPLACED).
   */
  async setStudentResourceState(
    userId: string,
    resourceId: string,
    topicId: string,
    state: StudentResourceState
  ): Promise<void> {
    if (!this.studentStates.has(userId)) {
      this.studentStates.set(userId, new Map());
    }
    this.studentStates.get(userId)!.set(resourceId, state);

    if (this.supabase) {
      try {
        await this.supabase.from('student_resource_states').upsert({
          id: `sres-${userId}-${resourceId}`,
          user_id: userId,
          resource_id: resourceId,
          topic_id: topicId,
          state,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[ResourceEngine] Supabase setStudentResourceState error:', err);
      }
    }
  }

  /**
   * Retrieves student state for a given resource.
   */
  async getStudentResourceState(userId: string, resourceId: string): Promise<StudentResourceState> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('student_resource_states')
          .select('state')
          .eq('user_id', userId)
          .eq('resource_id', resourceId)
          .single();

        if (!error && data?.state) {
          return data.state as StudentResourceState;
        }
      } catch {
        // Fallback to in-memory
      }
    }

    const userMap = this.studentStates.get(userId);
    return userMap?.get(resourceId) || 'SUGGESTED';
  }

  /**
   * Updates status of a specific learning resource (DISCOVERED, VALIDATED, AVAILABLE, UNAVAILABLE, REPLACED, ARCHIVED)
   */
  async updateResourceStatus(resourceId: string, status: ResourceStatus): Promise<boolean> {
    let found = false;

    // 1. Update in memory runs
    for (const run of this.runCache.values()) {
      for (const res of run.results) {
        if (res.resource_id === resourceId) {
          res.status = status;
          found = true;
        }
      }
    }

    // 2. Update in Supabase
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('topic_learning_resources')
          .update({ status })
          .eq('id', resourceId);
        if (!error) found = true;
      } catch (err) {
        console.warn('[ResourceEngine] Supabase updateResourceStatus error:', err);
      }
    }

    return found;
  }

  /**
   * Returns all traceable research runs
   */
  async getAllRuns(): Promise<ResourceResearchRun[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('resource_research_runs')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            run_id: d.id,
            topic_id: d.topic_id,
            topic_title: d.topic_title,
            target_role: d.target_role,
            provider_used: d.provider_used,
            api_configured: d.api_configured,
            is_cached: d.is_cached,
            retrieved_at: d.created_at,
            resources_count: d.resources_count,
            results: [],
          }));
        }
      } catch {
        // Fallback to in-memory
      }
    }

    return Array.from(this.runCache.values());
  }

  /**
   * Clears in-memory cache (for test resetting).
   */
  clearCache(): void {
    this.runCache.clear();
    this.studentStates.clear();
  }
}

export const learningResourceEngine = new LearningResourceEngine();
