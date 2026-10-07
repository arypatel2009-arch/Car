import React, { useState } from 'react';
import { X, User, LogIn, Key, Shield, Check, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseClientConfigured } from '../lib/supabase.ts';
import { getCurrentUserId, setCurrentUserId } from '../lib/api.ts';

interface AuthModalProps {
  onClose: () => void;
  onUserChanged: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onUserChanged }) => {
  const [currentId, setCurrentId] = useState(getCurrentUserId());
  const [customId, setCustomId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSwitchUser = (newId: string) => {
    setCurrentUserId(newId);
    setCurrentId(newId);
    setMessage(`Switched active student to: ${newId}`);
    onUserChanged();
  };

  const handleCustomSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;
    handleSwitchUser(customId.trim());
    setCustomId('');
  };

  const handleSupabaseSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email || !password) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        handleSwitchUser(data.user.id);
        setMessage(`Authenticated via Supabase: ${data.user.email}`);
      }
    } catch (err: any) {
      setMessage(`Auth error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Student Profile & Auth
              </h3>
              <p className="text-xs text-slate-500">
                User identity and session isolation
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

        {/* Current Active ID */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-5">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-0.5">
            Active Student Identity
          </span>
          <span className="text-xs font-mono font-semibold text-slate-900 break-all block">
            {currentId}
          </span>
        </div>

        {message && (
          <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            {message}
          </div>
        )}

        {/* Switch / Test Isolation */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Switch Profile (Test Multi-User Data Isolation)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchUser('student-alex-chen')}
                className="px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors cursor-pointer text-left"
              >
                Alex Chen (Student A)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchUser('student-maya-patel')}
                className="px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors cursor-pointer text-left"
              >
                Maya Patel (Student B)
              </button>
            </div>
          </div>

          <form onSubmit={handleCustomSwitch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter custom user ID..."
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={!customId.trim()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Switch
            </button>
          </form>
        </div>

        {/* Supabase Auth Form */}
        {isSupabaseClientConfigured ? (
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-900 block mb-2">
              Supabase Authentication
            </span>
            <form onSubmit={handleSupabaseSignUp} className="space-y-2.5">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In / Sign Up with Supabase'}
              </button>
            </form>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Supabase Auth credentials can be added to your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY). Local secure session isolation is active.</span>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
