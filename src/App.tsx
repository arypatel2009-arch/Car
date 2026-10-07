import React, { useEffect, useState } from 'react';
import {
  AdaptiveEngineState,
  CareerDiscoverySession,
  CareerGoalRecord,
  CareerRoleResearch,
  ComparisonMatrixData,
  DiscoveryMode,
  RecommendationItem,
  RejectionPayload,
  StudentCareerProfile,
} from './types/career.ts';
import { api, getCurrentUserId } from './lib/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { ConfigBanner } from './components/ConfigBanner.tsx';
import { ModeSelection } from './components/ModeSelection.tsx';
import { DirectGoalInput } from './components/DirectGoalInput.tsx';
import { DiscoveryQuestionnaire } from './components/DiscoveryQuestionnaire.tsx';
import { CompareIdeasInput } from './components/CompareIdeasInput.tsx';
import { RecommendationsView } from './components/RecommendationsView.tsx';
import { ComparisonMatrix } from './components/ComparisonMatrix.tsx';
import { CareerDetailModal } from './components/CareerDetailModal.tsx';
import { RejectionModal } from './components/RejectionModal.tsx';
import { GoalConfirmationModal } from './components/GoalConfirmationModal.tsx';
import { ActiveGoalCard } from './components/ActiveGoalCard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LearningOverview } from './components/learning/LearningOverview.tsx';
import { SystemConfigStatus } from './server/config.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [systemConfig, setSystemConfig] = useState<SystemConfigStatus | null>(null);
  const [isConfigBannerOpen, setIsConfigBannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Module switcher: Phase 1 (Discovery) vs Phase 2 (Learning)
  const [activeModule, setActiveModule] = useState<'discovery' | 'learning'>('discovery');
  const [learningInitialTab, setLearningInitialTab] = useState<'requirements' | 'today' | 'roadmap' | 'gaps' | 'skill_map' | 'weekly' | 'resources'>('requirements');

  // Discovery & Adaptive Engine State
  const [currentSession, setCurrentSession] = useState<CareerDiscoverySession | null>(null);
  const [engineState, setEngineState] = useState<AdaptiveEngineState | null>(null);
  const [activeGoal, setActiveGoal] = useState<CareerGoalRecord | null>(null);
  const [activeMode, setActiveMode] = useState<DiscoveryMode | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentCareerProfile | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonMatrixData | null>(null);

  // Direct Goal stage tracker (input -> adaptive verification -> confirmed)
  const [directGoalStage, setDirectGoalStage] = useState<'input' | 'verifying'>('input');

  // Compare Ideas stage tracker (input -> adaptive distinguishing -> comparison)
  const [compareStage, setCompareStage] = useState<'input' | 'distinguishing'>('input');

  // UI Modals
  const [detailResearch, setDetailResearch] = useState<{
    research: CareerRoleResearch;
    recommendation?: RecommendationItem | null;
  } | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<RecommendationItem | null>(null);
  const [goalConfirmTarget, setGoalConfirmTarget] = useState<{
    roleTitle: string;
    source: CareerGoalRecord['goal_source'];
  } | null>(null);

  // Loading states
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  // Load system health and active goal on mount
  const loadInitialData = async () => {
    try {
      const [healthRes, goalRes] = await Promise.all([
        api.getHealth(),
        api.getActiveGoal(),
      ]);
      setSystemConfig(healthRes.config);
      setActiveGoal(goalRes.goal);
      if (goalRes.goal && goalRes.goal.goal_status === 'ACTIVE') {
        setActiveModule('learning');
      } else {
        setActiveModule('discovery');
      }
    } catch (err) {
      console.error('Error loading initial app state:', err);
    } finally {
      setIsAppLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Mode Handlers
  const handleSelectMode = async (mode: DiscoveryMode) => {
    setActiveMode(mode);
    setRecommendations([]);
    setComparisonData(null);
    setDirectGoalStage('input');
    setCompareStage('input');

    if (mode === 'adaptive_discovery') {
      try {
        const { session, state } = await api.startAdaptiveSession('adaptive_discovery');
        setCurrentSession(session);
        setEngineState(state);
      } catch (err) {
        console.error('Failed to start adaptive discovery:', err);
      }
    }
  };

  const handleResetDiscovery = () => {
    setActiveMode(null);
    setCurrentSession(null);
    setEngineState(null);
    setRecommendations([]);
    setComparisonData(null);
    setDirectGoalStage('input');
    setCompareStage('input');
  };

  // Branch A: Direct Goal Entry -> Launches Targeted Verification
  const handleStartDirectVerification = async (roleTitle: string) => {
    try {
      const { session, state } = await api.startAdaptiveSession('direct_goal', roleTitle);
      setCurrentSession(session);
      setEngineState(state);
      setDirectGoalStage('verifying');
    } catch (err) {
      console.error('Failed to start direct goal verification:', err);
    }
  };

  // Branch C: Compare Ideas -> Launches Targeted Distinguishing
  const handleStartCompareVerification = async (roles: string[]) => {
    try {
      const { session, state } = await api.startAdaptiveSession('compare_ideas', undefined, roles);
      setCurrentSession(session);
      setEngineState(state);
      setCompareStage('distinguishing');
    } catch (err) {
      console.error('Failed to start compare verification:', err);
    }
  };

  // Unified Adaptive Answer Handler
  const handleAnswerAdaptiveQuestion = async (
    questionId: string,
    answerValue: any,
    questionText: string
  ) => {
    if (!currentSession) return;
    setIsAnswering(true);

    try {
      const res = await api.answerAdaptiveQuestion(
        currentSession.id,
        questionId,
        answerValue,
        questionText
      );

      setEngineState(res.state);

      if (res.is_sufficient) {
        if (activeMode === 'compare_ideas') {
          // Trigger comparison across candidates
          const rolesToCompare = res.state.candidate_signals.map((c) => c.role_title);
          const compRes = await api.compareRoles(rolesToCompare, currentSession.id);
          setComparisonData(compRes.comparison);
        } else {
          // Display candidate shortlist with explainability
          setRecommendations(res.recommendations);
          setStudentProfile(res.profile);
        }
      }
    } catch (err: any) {
      console.error('Error answering question:', err);
      alert(err.message || 'Error processing response');
    } finally {
      setIsAnswering(false);
    }
  };

  // Compare All Roles from Shortlist
  const handleCompareShortlist = async (roles: string[]) => {
    setIsComparing(true);
    try {
      const res = await api.compareRoles(roles, currentSession?.id);
      setComparisonData(res.comparison);
    } catch (err: any) {
      console.error('Failed to compare roles:', err);
      alert(err.message || 'Error comparing candidate roles');
    } finally {
      setIsComparing(false);
    }
  };

  // Rejection Feedback Loop
  const handleSubmitRejection = async (payload: RejectionPayload) => {
    if (!currentSession) return;
    try {
      const res = await api.rejectRecommendation(currentSession.id, payload);
      if (res.recommendations) {
        setRecommendations(res.recommendations);
      }
    } catch (err: any) {
      console.error('Rejection failed:', err);
      alert(err.message || 'Failed to submit feedback');
    }
  };

  // Goal Persistence
  const handleFinalGoalCommitment = async (targetRole: string, rationale?: string) => {
    let session = currentSession;
    if (!session) {
      const sRes = await api.createSession('direct_goal', targetRole);
      session = sRes.session;
      setCurrentSession(session);
    }

    const source = goalConfirmTarget?.source || 'CAREER_DISCOVERY';
    const res = await api.saveGoal(session.id, targetRole, source, rationale);
    setActiveGoal(res.goal);
    setActiveMode(null);
    setEngineState(null);
    setRecommendations([]);
    setComparisonData(null);
    setLearningInitialTab('requirements');
    setActiveModule('learning');
  };

  // Career Detail Inspector
  const handleOpenDetailModal = (rec: RecommendationItem) => {
    setDetailResearch({
      research: rec.research,
      recommendation: rec,
    });
  };

  const handleOpenResearchByTitle = async (roleTitle: string) => {
    try {
      const res = await api.researchRole(roleTitle);
      setDetailResearch({
        research: res.research,
        recommendation: recommendations.find(
          (r) => r.role_title.toLowerCase() === roleTitle.toLowerCase()
        ),
      });
    } catch (err) {
      console.error('Error fetching career detail:', err);
    }
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-slate-600">
            Initializing CareerOS Adaptive Discovery Engine...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeModule={activeModule}
        onChangeModule={(mod) => setActiveModule(mod)}
        currentMode={activeMode}
        hasActiveGoal={Boolean(activeGoal)}
        activeGoalTitle={activeGoal?.target_role}
        onResetDiscovery={handleResetDiscovery}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleConfig={() => setIsConfigBannerOpen(!isConfigBannerOpen)}
        isConfigOpen={isConfigBannerOpen}
        supabaseStatus={systemConfig?.supabase.status || 'NOT CONFIGURED'}
        geminiStatus={systemConfig?.gemini.status || 'NOT CONFIGURED'}
      />

      {/* Developer Configuration Check Banner */}
      {isConfigBannerOpen && (
        <ConfigBanner
          config={systemConfig}
          onClose={() => setIsConfigBannerOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Phase 2: Personalized Career Roadmap & Learning Engine */}
        {activeModule === 'learning' && (
          <LearningOverview
            initialTab={learningInitialTab}
            onNavigateToDiscovery={() => {
              setActiveModule('discovery');
              handleResetDiscovery();
            }}
          />
        )}

        {/* Phase 1: Career Discovery */}
        {activeModule === 'discovery' && (
          <>
            {/* If Active Goal exists and no discovery in progress, show Active Goal summary */}
            {activeGoal && !activeMode && (
              <ActiveGoalCard
                goal={activeGoal}
                onExploreResearch={() => {
                  setLearningInitialTab('requirements');
                  setActiveModule('learning');
                }}
                onOpenLearning={() => {
                  setLearningInitialTab('today');
                  setActiveModule('learning');
                }}
                onStartNewDiscovery={() => {
                  setActiveMode('adaptive_discovery');
                  handleSelectMode('adaptive_discovery');
                }}
              />
            )}

        {/* Primary Choice: What do you want to become? */}
        {!activeMode && !activeGoal && (
          <ModeSelection onSelectMode={handleSelectMode} />
        )}

        {/* Branch A: Direct Goal -> Step 1: Input */}
        {activeMode === 'direct_goal' && directGoalStage === 'input' && (
          <DirectGoalInput
            onBack={handleResetDiscovery}
            onStartDirectVerification={handleStartDirectVerification}
          />
        )}

        {/* Branch A: Direct Goal -> Step 2: Targeted Adaptive Verification */}
        {activeMode === 'direct_goal' &&
          directGoalStage === 'verifying' &&
          engineState &&
          !engineState.is_sufficient && (
            <DiscoveryQuestionnaire
              engineState={engineState}
              onAnswerQuestion={handleAnswerAdaptiveQuestion}
              onBack={handleResetDiscovery}
              isSubmitting={isAnswering}
            />
          )}

        {/* Branch B: Adaptive Discovery -> Active Conversation */}
        {activeMode === 'adaptive_discovery' &&
          engineState &&
          !engineState.is_sufficient && (
            <DiscoveryQuestionnaire
              engineState={engineState}
              onAnswerQuestion={handleAnswerAdaptiveQuestion}
              onBack={handleResetDiscovery}
              isSubmitting={isAnswering}
            />
          )}

        {/* Branch C: Compare Ideas -> Step 1: Input Roles */}
        {activeMode === 'compare_ideas' && compareStage === 'input' && (
          <CompareIdeasInput
            onBack={handleResetDiscovery}
            onStartCompareVerification={handleStartCompareVerification}
          />
        )}

        {/* Branch C: Compare Ideas -> Step 2: Targeted Distinguishing Questions */}
        {activeMode === 'compare_ideas' &&
          compareStage === 'distinguishing' &&
          engineState &&
          !engineState.is_sufficient && (
            <DiscoveryQuestionnaire
              engineState={engineState}
              onAnswerQuestion={handleAnswerAdaptiveQuestion}
              onBack={handleResetDiscovery}
              isSubmitting={isAnswering}
            />
          )}

        {/* Recommendations Shortlist View (Branch A & B completed) */}
        {engineState?.is_sufficient && recommendations.length > 0 && !comparisonData && (
          <RecommendationsView
            recommendations={recommendations}
            profile={studentProfile}
            onSelectGoal={(roleTitle, rec) =>
              setGoalConfirmTarget({
                roleTitle,
                source: activeMode === 'direct_goal' ? 'DIRECT_CONFIRMATION' : 'CAREER_DISCOVERY',
              })
            }
            onOpenDetail={handleOpenDetailModal}
            onOpenReject={(rec) => setRejectionTarget(rec)}
            onCompareAll={() =>
              handleCompareShortlist(
                recommendations.filter((r) => !r.is_rejected).map((r) => r.role_title)
              )
            }
          />
        )}

        {/* Comparison Matrix View (Branch C or Shortlist Compare) */}
        {comparisonData && (
          <ComparisonMatrix
            data={comparisonData}
            onBack={() => setComparisonData(null)}
            onSelectGoal={(roleTitle) =>
              setGoalConfirmTarget({
                roleTitle,
                source: 'COMPARE_CHOICE',
              })
            }
          />
        )}
          </>
        )}
      </main>

      {/* Modals */}
      {detailResearch && (
        <CareerDetailModal
          research={detailResearch.research}
          recommendation={detailResearch.recommendation}
          onClose={() => setDetailResearch(null)}
          onSelectGoal={(roleTitle) =>
            setGoalConfirmTarget({
              roleTitle,
              source: 'CAREER_DISCOVERY',
            })
          }
        />
      )}

      {rejectionTarget && (
        <RejectionModal
          recommendation={rejectionTarget}
          onClose={() => setRejectionTarget(null)}
          onSubmitRejection={handleSubmitRejection}
        />
      )}

      {goalConfirmTarget && (
        <GoalConfirmationModal
          roleTitle={goalConfirmTarget.roleTitle}
          goalSource={goalConfirmTarget.source}
          onClose={() => setGoalConfirmTarget(null)}
          onConfirm={handleFinalGoalCommitment}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onUserChanged={loadInitialData}
        />
      )}
    </div>
  );
}
