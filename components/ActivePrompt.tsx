import React, { useState } from 'react';
import { PromptVersion } from '../types';
import { CopyIcon, CheckIcon } from './icons';

interface ActivePromptProps {
  prompt: PromptVersion;
}

const ActivePrompt: React.FC<ActivePromptProps> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl p-6 relative flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-800">Active Prompt (Version {prompt.id})</h3>
        <button 
            onClick={handleCopy} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 bg-rose-100/50 rounded-md hover:bg-rose-100 transition-colors"
        >
          {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-slate-700 text-sm bg-rose-50/70 p-4 rounded-lg overflow-y-auto scrollbar-thin">
        <code>{prompt.content}</code>
      </pre>
    </div>
  );
};

export default ActivePrompt;