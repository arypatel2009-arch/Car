import React from 'react';
import { ShieldCheck, AlertCircle, X, ExternalLink } from 'lucide-react';
import { SystemConfigStatus } from '../server/config.ts';

interface ConfigBannerProps {
  config: SystemConfigStatus | null;
  onClose: () => void;
}

export const ConfigBanner: React.FC<ConfigBannerProps> = ({ config, onClose }) => {
  if (!config) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
              System Configuration & Credentials Check
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 max-w-3xl">
          CareerOS validates external providers server-side to guarantee authentic labor data and data persistence. Secret keys are never exposed to browser client code.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Supabase status */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">Supabase Database & Auth</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  config.supabase.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {config.supabase.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {config.supabase.status === 'CONNECTED'
                ? `Connected to ${config.supabase.url || 'configured project'}`
                : `Missing: ${config.supabase.missingVars.join(', ')}. Local session persistence is active.`}
            </p>
          </div>

          {/* Gemini AI status */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">Gemini AI Model</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  config.gemini.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {config.gemini.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {config.gemini.status === 'CONNECTED'
                ? `Active model: ${config.gemini.model} (Server-side via @google/genai)`
                : `Missing: GEMINI_API_KEY. Deterministic profiling and candidate heuristic active.`}
            </p>
          </div>

          {/* Research provider status */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">Occupational Research</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  config.research.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-sky-950 text-sky-400 border border-sky-800'
                }`}
              >
                {config.research.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Provider: {config.research.primaryProvider}. Sourced from official BLS / O*NET / ACM standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
