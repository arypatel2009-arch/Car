import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { CareerGoalRecord } from '../types/career.ts';

interface GoalConfirmationModalProps {
  roleTitle: string;
  onClose: () => void;
  onConfirm: (targetRole: string, rationale?: string) => Promise<void>;
  goalSource: CareerGoalRecord['goal_source'];
}

export const GoalConfirmationModal: React.FC<GoalConfirmationModalProps> = ({
  roleTitle,
  onClose,
  onConfirm,
  goalSource,
}) => {
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(roleTitle, rationale.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to confirm goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Career Goal
              </h3>
              <p className="text-xs text-slate-500">
                Establish your verified CareerOS baseline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-5">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
            Selected Target Role
          </span>
          <span className="text-xl font-bold text-slate-900 block">
            {roleTitle}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Goal Status: ACTIVE · Source: {goalSource}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          By confirming this goal, CareerOS will record your choice in Supabase. You are in complete control and may explore other career tracks at any time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Personal Goal Note (optional)
            </label>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="What motivated your choice? e.g. Strong alignment with my passion for building user interfaces..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Save Goal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
