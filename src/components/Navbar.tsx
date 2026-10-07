import React from 'react';
import { Compass, CheckCircle2, User, RefreshCw, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  activeModule: 'discovery' | 'learning';
  onChangeModule: (mod: 'discovery' | 'learning') => void;
  currentMode: string | null;
  hasActiveGoal: boolean;
  activeGoalTitle?: string;
  onResetDiscovery: () => void;
  onOpenAuth: () => void;
  onToggleConfig: () => void;
  isConfigOpen: boolean;
  supabaseStatus: 'CONNECTED' | 'NOT CONFIGURED';
  geminiStatus: 'CONNECTED' | 'NOT CONFIGURED';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onChangeModule,
  currentMode,
  hasActiveGoal,
  activeGoalTitle,
  onResetDiscovery,
  onOpenAuth,
  onToggleConfig,
  isConfigOpen,
  supabaseStatus,
  geminiStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark & Tagline */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChangeModule(hasActiveGoal ? 'learning' : 'discovery')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              CareerOS
            </span>
          </button>

          {/* Module Switcher Tabs */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onChangeModule('discovery')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'discovery'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Phase 1: Discovery</span>
            </button>

            <button
              onClick={() => onChangeModule('learning')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'learning'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Phase 2: Roadmap & Learning</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Active Goal Status */}
        {hasActiveGoal && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-medium">Target:</span>
            <span className="font-semibold text-slate-900">{activeGoalTitle}</span>
          </div>
        )}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Developer status toggle button */}
          <button
            onClick={onToggleConfig}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="System & API Configuration Status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                geminiStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-[11px] hidden sm:inline">System Status</span>
          </button>

          {activeModule === 'discovery' && currentMode && (
            <button
              onClick={onResetDiscovery}
              className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              title="Restart Career Discovery"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
