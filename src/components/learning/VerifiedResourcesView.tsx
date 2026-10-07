import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Tv,
  Youtube,
  Zap,
} from 'lucide-react';
import {
  ResourceResearchRun,
  StudentResourceState,
  TopicLearningResource,
} from '../../types/learning.ts';
import { api } from '../../lib/api.ts';

interface VerifiedResourcesViewProps {
  initialTopicTitle?: string;
  initialRole?: string;
  onSelectResource?: (resource: TopicLearningResource) => void;
}

export const VerifiedResourcesView: React.FC<VerifiedResourcesViewProps> = ({
  initialTopicTitle,
  initialRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [researchRun, setResearchRun] = useState<ResourceResearchRun | null>(null);
  const [resources, setResources] = useState<TopicLearningResource[]>([]);
  const [configStatus, setConfigStatus] = useState<{
    youtube_configured: boolean;
    status: string;
    status_message: string;
    quota?: {
      quotaUnitsUsedToday: number;
      quotaBudget: number;
      quotaUnitsRemaining: number;
      cacheHitsCount: number;
      totalRequestsCount: number;
      cacheHitRate: string;
      activeFingerprintsCount: number;
    };
  }>({
    youtube_configured: false,
    status: 'YOUTUBE_API_NOT_CONFIGURED',
    status_message: 'Checking configuration...',
  });
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [connectivityResult, setConnectivityResult] = useState<string | null>(null);

  const loadResources = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const res = await api.getTopicLearningResources(
        undefined,
        initialTopicTitle || 'Python Programming Foundations',
        initialRole || 'AI Engineer',
        forceRefresh
      );

      if (res.run) {
        setResearchRun(res.run);
        setResources(res.resources || res.run.results || []);
      }
      if (res.config) {
        setConfigStatus({
          youtube_configured: res.config.youtube_configured,
          status: (res.config as any).status || (res.config.youtube_configured ? 'YOUTUBE_API_READY' : 'YOUTUBE_API_NOT_CONFIGURED'),
          status_message: res.config.status_message,
          quota: (res.config as any).quota,
        });
      }
    } catch (err) {
      console.error('Failed to load topic resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [initialTopicTitle, initialRole]);

  const handleRunDiagnosticTest = async () => {
    setIsTestingConnectivity(true);
    setConnectivityResult(null);
    try {
      const res = await api.checkYouTubeConnectivity(
        initialTopicTitle || 'Python Programming Foundations',
        initialRole || 'AI Engineer'
      );
      setConnectivityResult(`Diagnostic check completed. Status: ${res.status}. ${res.message}`);
      if (res.quota) {
        setConfigStatus((prev) => ({
          ...prev,
          status: res.status,
          quota: res.quota,
        }));
      }
    } catch (err: any) {
      setConnectivityResult(`Diagnostic check exception: ${err.message}`);
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const handleUpdateStudentState = async (
    resourceId: string,
    topicId: string,
    state: StudentResourceState
  ) => {
    try {
      await api.updateStudentResourceState(resourceId, topicId, state);
      setResources((prev) =>
        prev.map((r) => (r.resource_id === resourceId ? { ...r, student_state: state } : r))
      );
    } catch (err) {
      console.error('Failed to update student resource state:', err);
    }
  };

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.topic_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.author_channel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'youtube' && res.type === 'youtube') ||
      (filterType === 'official_doc' && res.type === 'official_doc') ||
      (filterType === 'course' && (res.type === 'course' || res.type === 'tutorial')) ||
      (filterType === 'practice' && res.type === 'practice_platform');

    return matchesSearch && matchesType;
  });

  const isConfigured = configStatus.youtube_configured;
  const isQuotaExceeded = configStatus.status === 'QUOTA_EXCEEDED';
  const isKeyInvalid = configStatus.status === 'INVALID_API_KEY';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>Phase 2.4 YouTube Data API v3 Engine</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {resources.length} Verified Resources
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {initialTopicTitle ? `${initialTopicTitle} — Curriculum Resources` : 'Living Resource Discovery'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Curates high-quality learning resources with priority on accredited YouTube educators and official language specifications. Evaluated across 10 deterministic educational dimensions with query fingerprinting and quota protection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadResources(true)}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Force fresh discovery run (bypasses 24h cache)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Discovery</span>
            </button>
          </div>
        </div>

        {/* Configuration Notice (Admin / Developer Status) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isConfigured && !isQuotaExceeded && !isKeyInvalid && (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>YouTube Data API v3 Active</span>
              </span>
            )}

            {isQuotaExceeded && (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>YouTube Daily Quota Budget Reached</span>
              </span>
            )}

            {isKeyInvalid && (
              <span className="inline-flex items-center gap-1.5 font-medium text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Invalid YouTube API Key</span>
              </span>
            )}

            {!isConfigured && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>YouTube integration not configured</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (YOUTUBE_API_NOT_CONFIGURED — verified catalog active)
                </span>
              </span>
            )}

            <button
              onClick={() => setShowConfigDetails(!showConfigDetails)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="View admin/developer configuration diagnostics"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {researchRun && (
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Run ID: {researchRun.run_id.slice(0, 16)}...</span>
              <span>•</span>
              <span>{researchRun.is_cached ? 'Cached (Fresh <24h)' : 'Fresh Run'}</span>
            </div>
          )}
        </div>

        {/* Developer Diagnostics Box */}
        {showConfigDetails && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3 text-slate-600">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Admin / Developer Configuration Diagnostics</span>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Status: {configStatus.status}
              </span>
            </div>

            <p className="leading-relaxed">
              • <strong>Configuration Key:</strong> Set <code>YOUTUBE_API_KEY</code> in your server environment (<code>.env</code>). This credential is restricted strictly to backend proxy calls and is never exposed through client-side bundles, HTML, or API responses.
            </p>

            {/* Quota Telemetry */}
            {configStatus.quota && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Daily Quota Budget</div>
                  <div className="text-slate-900 font-bold">{configStatus.quota.quotaBudget} units</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Quota Used Today</div>
                  <div className="text-slate-900 font-bold">{configStatus.quota.quotaUnitsUsedToday} units</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Units Remaining</div>
                  <div className="text-slate-900 font-bold">{configStatus.quota.quotaUnitsRemaining} units</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Cache Hit Rate</div>
                  <div className="text-emerald-700 font-bold">{configStatus.quota.cacheHitRate}</div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Quota protection active: Topic + Query fingerprint + 24h freshness window prevents redundant API usage.
              </span>
              <button
                onClick={handleRunDiagnosticTest}
                disabled={isTestingConnectivity}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingConnectivity ? 'animate-spin' : ''}`} />
                <span>Test YouTube Integration</span>
              </button>
            </div>

            {connectivityResult && (
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
                {connectivityResult}
              </div>
            )}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by video title, channel, topic, or publisher..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Types
            </button>

            <button
              onClick={() => setFilterType('youtube')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'youtube'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Priority</span>
            </button>

            <button
              onClick={() => setFilterType('official_doc')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'official_doc'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official Specs</span>
            </button>

            <button
              onClick={() => setFilterType('course')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'course'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Courses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No verified resource currently available
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            CareerOS enforces an uncompromising zero-fabrication standard. If YouTube live discovery is not configured or no verified educational material matches this exact topic, we never generate placeholder or synthetic links. Alternative verified materials will appear as curriculum coverage expands.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((res) => {
            const isYouTube = res.type === 'youtube';
            const isPrimary = res.student_state === 'PRIMARY';
            const isCompleted = res.student_state === 'COMPLETED';

            return (
              <div
                key={res.resource_id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:border-slate-300 ${
                  isPrimary
                    ? 'border-blue-400 ring-2 ring-blue-100'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Video / Resource Header Preview */}
                <div>
                  {isYouTube && res.thumbnail_url && (
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                      <img
                        src={res.thumbnail_url}
                        alt={res.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all cursor-pointer"
                          title="Watch video on YouTube"
                        >
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </a>
                      </div>

                      {/* Video Duration Badge */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-white text-[11px] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{res.duration}</span>
                      </div>

                      {/* Rank Tier Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded shadow-sm ${
                            res.rank_tier === 'Top Pick'
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'bg-white/90 text-slate-800 backdrop-blur-xs font-semibold'
                          }`}
                        >
                          {res.rank_tier}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {/* Tags line */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isYouTube
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {res.type.replace('_', ' ')}
                        </span>

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {res.difficulty}
                        </span>

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {res.coverage}
                        </span>
                      </div>

                      {res.student_state && (
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            isPrimary
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {res.student_state}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {res.title}
                    </h3>

                    {/* Channel & Publisher */}
                    <div className="text-xs text-slate-500 flex items-center justify-between font-mono">
                      <span>
                        Channel/Author: <strong className="text-slate-800">{res.author_channel}</strong>
                      </span>
                      {res.published_at && (
                        <span>{res.published_at.substring(0, 4)}</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>

                    {/* Deterministic Ranking Rationale */}
                    {res.rank_rationale && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                        <div className="font-semibold text-slate-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Ranking Analysis:</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {res.rank_rationale}
                        </p>
                      </div>
                    )}

                    {/* Quality Signals */}
                    {res.quality_signals && res.quality_signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {res.quality_signals.map((sig, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 font-medium"
                          >
                            ✓ {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Primary Button */}
                    {!isPrimary ? (
                      <button
                        onClick={() => handleUpdateStudentState(res.resource_id, res.topic_id, 'PRIMARY')}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 text-slate-400" />
                        <span>Set as Primary</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Star className="w-3 h-3 text-blue-600 fill-current" />
                        <span>Primary Resource</span>
                      </span>
                    )}

                    {/* Completed Button */}
                    {!isCompleted ? (
                      <button
                        onClick={() => handleUpdateStudentState(res.resource_id, res.topic_id, 'COMPLETED')}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        <span>Mark Done</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  {/* Open Link */}
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{isYouTube ? 'Watch Video' : 'Open Resource'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
