import dotenv from 'dotenv';

dotenv.config();

export interface SystemConfigStatus {
  supabase: {
    configured: boolean;
    url: string | null;
    hasPublishableKey: boolean;
    hasServiceRoleKey: boolean;
    status: 'CONNECTED' | 'NOT CONFIGURED';
    missingVars: string[];
  };
  gemini: {
    configured: boolean;
    status: 'CONNECTED' | 'NOT CONFIGURED';
    model: string;
    missingVars: string[];
  };
  research: {
    configured: boolean;
    primaryProvider: 'GEMINI_GROUNDED_SEARCH' | 'EXTERNAL_SEARCH_API' | 'OCCUPATIONAL_DB';
    status: 'CONNECTED' | 'PARTIAL' | 'NOT CONFIGURED';
  };
  youtube: {
    configured: boolean;
    status: 'CONNECTED' | 'NOT CONFIGURED';
    message: string;
  };
}

export const serverConfig = {
  // Supabase (Safe or Service)
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Server-only Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-3.8-flash',

  // Server-only Research
  researchApiKey: process.env.RESEARCH_API_KEY || '',

  // Server-only YouTube Data API v3
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',

  port: parseInt(process.env.PORT || '3000', 10),
  isProduction: process.env.NODE_ENV === 'production',
};

export function getSystemConfigStatus(): SystemConfigStatus {
  const supabaseMissing: string[] = [];
  if (!serverConfig.supabaseUrl) supabaseMissing.push('VITE_SUPABASE_URL');
  if (!serverConfig.supabasePublishableKey) supabaseMissing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  const geminiMissing: string[] = [];
  if (!serverConfig.geminiApiKey) geminiMissing.push('GEMINI_API_KEY');

  const isSupabaseConfigured = Boolean(serverConfig.supabaseUrl && serverConfig.supabasePublishableKey);
  const isGeminiConfigured = Boolean(serverConfig.geminiApiKey);

  let researchProvider: 'GEMINI_GROUNDED_SEARCH' | 'EXTERNAL_SEARCH_API' | 'OCCUPATIONAL_DB' = 'OCCUPATIONAL_DB';
  let researchStatus: 'CONNECTED' | 'PARTIAL' | 'NOT CONFIGURED' = 'CONNECTED';

  if (serverConfig.researchApiKey) {
    researchProvider = 'EXTERNAL_SEARCH_API';
    researchStatus = 'CONNECTED';
  } else if (isGeminiConfigured) {
    researchProvider = 'GEMINI_GROUNDED_SEARCH';
    researchStatus = 'CONNECTED';
  } else {
    researchProvider = 'OCCUPATIONAL_DB';
    researchStatus = 'PARTIAL'; // Fallback to verified official BLS / O*NET occupational database
  }

  return {
    supabase: {
      configured: isSupabaseConfigured,
      url: serverConfig.supabaseUrl ? serverConfig.supabaseUrl.replace(/^(https?:\/\/[^/]+).*/, '$1') : null,
      hasPublishableKey: Boolean(serverConfig.supabasePublishableKey),
      hasServiceRoleKey: Boolean(serverConfig.supabaseServiceRoleKey),
      status: isSupabaseConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      missingVars: supabaseMissing,
    },
    gemini: {
      configured: isGeminiConfigured,
      status: isGeminiConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      model: serverConfig.geminiModel,
      missingVars: geminiMissing,
    },
    research: {
      configured: true,
      primaryProvider: researchProvider,
      status: researchStatus,
    },
    youtube: {
      configured: Boolean(serverConfig.youtubeApiKey),
      status: serverConfig.youtubeApiKey ? 'CONNECTED' : 'NOT CONFIGURED',
      message: serverConfig.youtubeApiKey
        ? 'YouTube Data API v3 active'
        : 'YouTube integration not configured (using verified educational catalog)',
    },
  };
}
