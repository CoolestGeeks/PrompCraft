import React from 'react';
import { LogoIcon } from '../icons/LogoIcon';

export const ConfigWarning: React.FC = () => {
  const codeBlock = `
// supabaseConfig.ts
export const supabaseUrl = 'https://your-project-ref.supabase.co';
export const supabaseAnonKey = 'your-public-anon-key';
  `;
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-red-500/50">
        <div className="text-center">
          <LogoIcon className="w-16 h-16 mx-auto text-accent" />
          <h2 className="mt-6 text-3xl font-bold text-white">Configuration Required</h2>
          <p className="mt-2 text-md text-gray-400">
            Your Supabase credentials are not set. The application cannot start.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-gray-300">
            Please update the file <code className="px-2 py-1 text-sm bg-gray-900 rounded-md font-mono">supabaseConfig.ts</code> with your project's URL and public anonymous key from your Supabase dashboard.
          </p>
          <pre className="p-4 bg-gray-900 rounded-md text-sm text-gray-300 font-mono overflow-x-auto">
            <code>{codeBlock.trim()}</code>
          </pre>
          <p className="text-center text-gray-400 text-sm">
            After updating the file, please refresh the page.
          </p>
        </div>
      </div>
    </div>
  );
};