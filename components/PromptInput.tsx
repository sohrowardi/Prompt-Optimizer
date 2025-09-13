import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-2xl w-full">
        <h2 className="text-4xl font-bold text-gray-100 mb-2">Make Your Prompt 10x Better</h2>
        <p className="text-lg text-gray-400 mb-8">
          Start with a basic idea, and our AI will refine it into a high-quality, professional-grade instruction ready for optimal results.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'write a story about a robot who discovers music'"
            className="w-full h-40 p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-[#ff91af] focus:border-[#ff91af] transition-shadow resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white bg-[#ff91af] rounded-lg shadow-lg hover:bg-[#f76a94] disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              'Generating...'
            ) : (
              <>
                <SparklesIcon className="h-6 w-6" />
                Generate Professional Prompt
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromptInput;