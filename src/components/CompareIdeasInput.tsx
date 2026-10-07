import React, { useState } from 'react';
import { GitCompare, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface CompareIdeasInputProps {
  onBack: () => void;
  onStartCompareVerification: (roles: string[]) => void;
}

export const CompareIdeasInput: React.FC<CompareIdeasInputProps> = ({
  onBack,
  onStartCompareVerification,
}) => {
  const [roleInputs, setRoleInputs] = useState<string[]>(['Frontend Developer', 'AI Engineer', 'Data Analyst']);
  const [currentText, setCurrentText] = useState('');

  const handleAddRole = () => {
    if (!currentText.trim()) return;
    if (roleInputs.length >= 5) return;
    if (!roleInputs.includes(currentText.trim())) {
      setRoleInputs([...roleInputs, currentText.trim()]);
      setCurrentText('');
    }
  };

  const handleRemoveRole = (index: number) => {
    setRoleInputs(roleInputs.filter((_, i) => i !== index));
  };

  const handleQuickAdd = (title: string) => {
    if (roleInputs.length < 5 && !roleInputs.includes(title)) {
      setRoleInputs([...roleInputs, title]);
    }
  };

  const quickIdeas = [
    'Backend Developer',
    'Cybersecurity Analyst',
    'UI/UX Designer',
    'Product Manager',
    'Data Analyst',
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to choices</span>
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-xl mb-6">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase">
            <GitCompare className="w-4 h-4" />
            <span>Targeted Idea Comparison</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Enter 2 to 5 career ideas you are considering
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            CareerOS will identify the core differences between these careers and ask targeted questions to distinguish which path best aligns with your preferences.
          </p>
        </div>

        {/* Input box */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Type a career (e.g. AI Engineer, UI/UX Designer)..."
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRole();
              }
            }}
            disabled={roleInputs.length >= 5}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={handleAddRole}
            disabled={!currentText.trim() || roleInputs.length >= 5}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Current list of candidate ideas */}
        <div className="space-y-2.5 mb-6">
          <span className="text-xs font-medium text-slate-600 block">
            Selected for comparison ({roleInputs.length}/5):
          </span>
          {roleInputs.map((role, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800">{role}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRole(idx)}
                className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                title="Remove career"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick add chips */}
        <div className="mb-8 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500 block mb-2 font-medium">
            Quick additions:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickIdeas.map((idea) => {
              const alreadySelected = roleInputs.includes(idea);
              return (
                <button
                  key={idea}
                  type="button"
                  onClick={() => handleQuickAdd(idea)}
                  disabled={alreadySelected || roleInputs.length >= 5}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    alreadySelected
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  + {idea}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {roleInputs.length < 2 ? 'Add at least 2 roles to compare' : 'Ready to start targeted comparison'}
          </span>
          <button
            type="button"
            onClick={() => onStartCompareVerification(roleInputs)}
            disabled={roleInputs.length < 2}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <span>Differentiate {roleInputs.length} Careers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
