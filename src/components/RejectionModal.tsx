import React, { useState } from 'react';
import { X, ThumbsDown, Loader2 } from 'lucide-react';
import { RecommendationItem, RejectionPayload } from '../types/career.ts';

interface RejectionModalProps {
  recommendation: RecommendationItem | null;
  onClose: () => void;
  onSubmitRejection: (payload: RejectionPayload) => Promise<void>;
}

const REJECTION_REASONS: RejectionPayload['reason_category'][] = [
  "I don't like coding",
  "I don't like mathematics",
  "I don't like this type of work",
  "I prefer creativity",
  "I prefer business",
  "I prefer people-focused work",
  "I want something different",
  "Other",
];

export const RejectionModal: React.FC<RejectionModalProps> = ({
  recommendation,
  onClose,
  onSubmitRejection,
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionPayload['reason_category'] | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!recommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmitRejection({
        recommendation_id: recommendation.id,
        role_title: recommendation.role_title,
        reason_category: selectedReason as RejectionPayload['reason_category'],
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit rejection feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ThumbsDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reject "{recommendation.role_title}"
              </h3>
              <p className="text-xs text-slate-500">
                Help us refine your candidate paths
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

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          CareerOS will incorporate your feedback into future recommendations without silently changing your raw profile answers. Why is this career not a fit?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? 'border-red-500 bg-red-50/50 font-semibold text-red-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="rejection_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="mr-2.5 accent-red-600"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Additional Details (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I prefer working more on user research rather than managing databases..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
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
              disabled={!selectedReason || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating paths...</span>
                </>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
