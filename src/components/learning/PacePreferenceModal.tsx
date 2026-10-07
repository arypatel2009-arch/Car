import React, { useState } from 'react';
import { Clock, Loader2, Sparkles, X, Calendar } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { LearningRoadmap } from '../../types/learning.ts';

interface PacePreferenceModalProps {
  currentHours: number;
  currentDays: number;
  onClose: () => void;
  onPaceUpdated: (updatedRoadmap: LearningRoadmap) => void;
}

export const PacePreferenceModal: React.FC<PacePreferenceModalProps> = ({
  currentHours,
  currentDays,
  onClose,
  onPaceUpdated,
}) => {
  const [hours, setHours] = useState<number>(currentHours || 2.0);
  const [days, setDays] = useState<number>(currentDays || 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.updateTimePreferences(hours, days);
      onPaceUpdated(res.roadmap);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update pace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Committed Learning Pace</h3>
              <p className="text-xs text-slate-500">Recalculates realistic weekly timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Hours per Day */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Available Learning Time Per Day:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1.0, 2.0, 3.0, 4.0].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    hours === h
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {h} {h === 1 ? 'hr' : 'hrs'}
                </button>
              ))}
            </div>
          </div>

          {/* Days per Week */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Committed Learning Days Per Week:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    days === d
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Calculation Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Weekly Commitment:</span>
              <span className="font-mono text-blue-700">{hours * days} hours/week</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Estimated total roadmap duration will be updated to reflect this schedule. Your completed tasks remain preserved.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Pace...</span>
                </>
              ) : (
                <span>Save New Pace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
