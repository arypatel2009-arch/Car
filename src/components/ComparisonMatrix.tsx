import React from 'react';
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { ComparisonDimensionRow, ComparisonMatrixData, ResearchSource } from '../types/career.ts';

interface ComparisonMatrixProps {
  data: ComparisonMatrixData;
  onBack: () => void;
  onSelectGoal: (roleTitle: string) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  data,
  onBack,
  onSelectGoal,
}) => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBack}
            className="mb-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to discovery</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Transparent Career Comparison
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Qualitative, evidence-backed evaluation across key occupational dimensions without fabricated percentage scores.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="p-4 sm:p-5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64 min-w-[200px]">
                  Evaluation Dimension
                </th>
                {data.roles.map((role: string) => (
                  <th
                    key={role}
                    className="p-4 sm:p-5 text-sm font-bold text-slate-900 min-w-[240px] border-l border-slate-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{role}</span>
                      <button
                        onClick={() => onSelectGoal(role)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        Choose
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.dimensions.map((row: ComparisonDimensionRow, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 sm:p-5 align-top">
                    <span className="font-semibold text-slate-900 block text-xs">
                      {row.dimension}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1 leading-normal">
                      {row.description}
                    </span>
                  </td>
                  {data.roles.map((role: string) => {
                    const val = row.values[role];
                    const isQualitative = ['Strong', 'Moderate', 'Limited', 'Low', 'High'].includes(String(val));

                    return (
                      <td
                        key={role}
                        className="p-4 sm:p-5 align-top border-l border-slate-200 text-slate-700 leading-relaxed font-sans"
                      >
                        {isQualitative ? (
                          <span
                            className={`font-semibold ${
                              val === 'Strong'
                                ? 'text-emerald-700'
                                : val === 'Moderate'
                                ? 'text-blue-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {String(val)}
                          </span>
                        ) : (
                          <span>{String(val || '—')}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sources & Evidence Footnotes */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Occupational Sources & Real Evidence Citations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.sources_by_role).map(([role, sources]) => {
            const sourceList = (sources as ResearchSource[]) || [];
            return (
              <div key={role} className="bg-white p-4 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block mb-2">{role}</span>
                <div className="space-y-2">
                  {sourceList.map((src: ResearchSource) => (
                    <div key={src.id} className="text-[11px] border-t border-slate-100 pt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">{src.publisher}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <p className="text-slate-500 italic mt-0.5 line-clamp-2">
                        "{src.evidence_excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
