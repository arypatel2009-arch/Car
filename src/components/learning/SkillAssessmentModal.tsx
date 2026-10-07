import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  SkillAssessment,
  SkillAssessmentResult,
  SkillProficiency,
} from '../../types/learning.ts';
import { api } from '../../lib/api.ts';

interface SkillAssessmentModalProps {
  skillName: string;
  roleTitle: string;
  onClose: () => void;
  onAssessmentCompleted: (result: SkillAssessmentResult) => void;
}

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  skillName,
  roleTitle,
  onClose,
  onAssessmentCompleted,
}) => {
  const [assessment, setAssessment] = useState<SkillAssessment | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SkillAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadQuestions() {
      try {
        const res = await api.startSkillAssessment(skillName, roleTitle);
        if (mounted) {
          setAssessment(res.assessment);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load assessment');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadQuestions();
    return () => {
      mounted = false;
    };
  }, [skillName, roleTitle]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.submitSkillAssessment(skillName, roleTitle, userAnswers);
      setResult(res.result);
      onAssessmentCompleted(res.result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered =
    assessment && assessment.questions.every((q) => userAnswers[q.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Skill Diagnostic: {skillName}</h3>
              <p className="text-xs text-slate-500 font-mono">
                {roleTitle} • 3-Question Verification Check
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500">Preparing targeted diagnostic questions...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Assessment Questions State */}
          {!isLoading && !result && assessment && (
            <div className="space-y-6">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                Answer these targeted concept questions to verify your current level in{' '}
                <span className="font-semibold text-slate-800">{skillName}</span>. Your roadmap will dynamically adapt to reflect your demonstrated competence.
              </p>

              <div className="space-y-5">
                {assessment.questions.map((q, qIdx) => (
                  <div key={q.id} className="space-y-2.5 border-b border-slate-100 pb-5 last:border-b-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Q{qIdx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-1 pl-6">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left text-xs p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-medium'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/60'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result State */}
          {result && (
            <div className="space-y-5">
              <div
                className={`p-5 rounded-2xl border text-center space-y-2 ${
                  result.passed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                {result.passed ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                )}

                <h4 className="text-lg font-bold text-slate-900">
                  {result.passed ? 'Demonstrated Competency Verified!' : 'Knowledge Gaps Identified'}
                </h4>

                <div className="flex items-center justify-center gap-3 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
                    Score: {result.score_percentage}%
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-bold text-blue-700">
                    Assessed Level: {result.assessed_proficiency}
                  </span>
                </div>

                <p className="text-xs text-slate-600 max-w-md mx-auto pt-1 leading-relaxed">
                  {result.recommended_action}
                </p>
              </div>

              {/* Weak and Strong Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {result.strong_areas.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Concepts Mastered:
                    </span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {result.strong_areas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.weak_areas.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Concepts to Strengthen:
                    </span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {result.weak_areas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Diagnostic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Close & Update Roadmap
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
