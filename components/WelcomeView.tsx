import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface WelcomeViewProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-3xl w-full">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Start with an Idea</h2>
        <p className="text-lg text-slate-600 mb-10">
          Enter a basic prompt, and we'll transform it into a professional-grade instruction, ready for refinement and 10x improvement.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'write a story about a robot who discovers music'"
            className="w-full h-48 p-4 bg-white/80 backdrop-blur-sm border border-rose-200/80 rounded-lg text-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow resize-none"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-t-white border-rose-200 rounded-full animate-spin"></div>
            ) : (
              <>
                <SparklesIcon className="h-6 w-6" />
                Enhance Prompt
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeView;