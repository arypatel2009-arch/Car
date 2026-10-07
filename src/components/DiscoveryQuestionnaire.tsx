import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Sparkles,
  Loader2,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { AdaptiveEngineState, AdaptiveQuestion, QuestionOption } from '../types/career.ts';

interface DiscoveryQuestionnaireProps {
  engineState: AdaptiveEngineState;
  onAnswerQuestion: (questionId: string, answerValue: any, questionText: string) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export const DiscoveryQuestionnaire: React.FC<DiscoveryQuestionnaireProps> = ({
  engineState,
  onAnswerQuestion,
  onBack,
  isSubmitting,
}) => {
  const currentQ = engineState.current_question;
  const [selectedSingle, setSelectedSingle] = useState<string>('');
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [scaleValue, setScaleValue] = useState<number>(3);

  // Reset local state when question changes
  React.useEffect(() => {
    if (currentQ) {
      setSelectedSingle('');
      setSelectedMultiple([]);
      if (currentQ.scale_config) {
        setScaleValue(currentQ.scale_config.defaultValue || 3);
      }
    }
  }, [currentQ?.question_id]);

  if (!currentQ) {
    return (
      <div className="py-16 px-4 text-center max-w-xl mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">
          Synthesizing your career profile signals...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating evidence and building candidate comparisons.
        </p>
      </div>
    );
  }

  const handleToggleMultiple = (val: string) => {
    if (selectedMultiple.includes(val)) {
      setSelectedMultiple(selectedMultiple.filter((v) => v !== val));
    } else {
      if (selectedMultiple.length < 3) {
        setSelectedMultiple([...selectedMultiple, val]);
      }
    }
  };

  const canProceed = () => {
    if (currentQ.answer_type === 'single' || currentQ.answer_type === 'clarification') {
      return Boolean(selectedSingle);
    }
    if (currentQ.answer_type === 'multiple') {
      return selectedMultiple.length > 0;
    }
    if (currentQ.answer_type === 'scale') {
      return typeof scaleValue === 'number';
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed() || isSubmitting) return;

    let finalValue: any = selectedSingle;
    if (currentQ.answer_type === 'multiple') finalValue = selectedMultiple;
    if (currentQ.answer_type === 'scale') finalValue = scaleValue;

    await onAnswerQuestion(currentQ.question_id, finalValue, currentQ.question_text);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Contextual Progress Banner — NO "Question X of Y", NO fake percentage */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-medium text-slate-700">
            {engineState.current_focus_area}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>{engineState.questions_answered_count} dimensions explored</span>
        </div>
      </div>

      {/* Clarification Alert (if this question is resolving an active contradiction) */}
      {currentQ.is_clarification && (
        <div className="mb-5 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Preference Clarification</span>
            <p className="leading-relaxed text-amber-800">
              {currentQ.clarification_target?.conflicting_statement ||
                'We noticed two earlier answers suggest different directions. Let’s clarify which feels most authentic to you.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        {/* Context Note (Conversational bridge to previous answer) */}
        {currentQ.context_note && !currentQ.is_clarification && (
          <p className="text-xs text-blue-600 font-medium mb-2">
            {currentQ.context_note}
          </p>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-6 text-balance">
          {currentQ.question_text}
        </h2>

        {/* Options Rendering */}
        {(currentQ.answer_type === 'single' || currentQ.answer_type === 'clarification') && (
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedSingle === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setSelectedSingle(opt.value)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </h3>
                      {opt.desc && (
                        <p
                          className={`text-xs mt-1 ${
                            isSelected ? 'text-blue-700' : 'text-slate-500'
                          }`}
                        >
                          {opt.desc}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.answer_type === 'multiple' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedMultiple.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleToggleMultiple(opt.value)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.answer_type === 'scale' && currentQ.scale_config && (
          <div className="py-6 px-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700">Dedicated Daily Bandwidth</span>
              <span className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
                {scaleValue} {currentQ.scale_config.unit}
              </span>
            </div>
            <input
              type="range"
              min={currentQ.scale_config.min}
              max={currentQ.scale_config.max}
              step={currentQ.scale_config.step}
              value={scaleValue}
              onChange={(e) => setScaleValue(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>{currentQ.scale_config.min} hr/day</span>
              <span>{currentQ.scale_config.max} hrs/day</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Discovery</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canProceed() || isSubmitting}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing candidate signals...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Emerging Candidate Signals Footer Note */}
      {engineState.candidate_signals.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-200/60 text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Emerging paths in consideration:</span>
          {engineState.candidate_signals.slice(0, 3).map((cand, idx) => (
            <span key={cand.role_title} className="text-slate-600 font-medium">
              {idx > 0 && <span className="mx-1 text-slate-300">·</span>}
              {cand.role_title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
