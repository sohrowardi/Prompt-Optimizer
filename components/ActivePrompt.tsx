
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
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Active Prompt (Version {prompt.id})</h3>
        <button 
            onClick={handleCopy} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
        >
          {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <CopyIcon className="h-5 w-5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-gray-300 text-sm bg-gray-900/50 p-4 rounded-lg max-h-60 overflow-y-auto scrollbar-thin">
        <code>{prompt.content}</code>
      </pre>
    </div>
  );
};

export default ActivePrompt;
