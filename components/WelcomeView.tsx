import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';
import { fetchTrendingPrompts } from '../services/geminiService';

interface WelcomeViewProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const defaultExamplePrompts = [
  "Explain quantum computing in simple terms",
  "Write a python script to scrape a website",
  "Draft a professional email to a client",
  "Create a 3-day itinerary for a trip to Paris",
  "Generate a list of creative blog post ideas",
];

const WelcomeView: React.FC<WelcomeViewProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [examplesLoading, setExamplesLoading] = useState(true);

  useEffect(() => {
    const loadTrendingPrompts = async () => {
      setExamplesLoading(true);
      try {
        const trendingPrompts = await fetchTrendingPrompts();
        if (trendingPrompts.length > 0) {
          setExamplePrompts(trendingPrompts);
        } else {
          setExamplePrompts(defaultExamplePrompts);
        }
      } catch (error) {
        console.error("Failed to fetch trending prompts, using default examples.", error);
        setExamplePrompts(defaultExamplePrompts);
      } finally {
        setExamplesLoading(false);
      }
    };

    loadTrendingPrompts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (prompt.trim() && !isLoading) {
        onSubmit(prompt.trim());
      }
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
            onKeyDown={handleKeyDown}
            placeholder="e.g., 'write a story about a robot who discovers music' (Ctrl+Enter to submit)"
            className="w-full h-48 p-4 bg-white/80 backdrop-blur-sm border border-rose-200/80 rounded-lg text-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow resize-none"
            disabled={isLoading}
            autoFocus
          />
          <div className="mt-8">
            <p className="text-slate-500 mb-3 text-sm">Or try a trending example:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {examplesLoading ? (
                 Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="px-3 py-1.5 h-8 w-64 bg-rose-100 rounded-full animate-pulse"></div>
                ))
              ) : (
                examplePrompts.map((ex, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-rose-700 bg-rose-100 rounded-full hover:bg-rose-200 disabled:bg-rose-50 disabled:text-rose-300 transition-colors"
                    title="Use this example prompt"
                  >
                    {ex}
                  </button>
                ))
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="mt-10 w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            title="Enhance your prompt idea"
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