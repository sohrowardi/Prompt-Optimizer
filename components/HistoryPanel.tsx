import React from 'react';
import { PromptVersion, PromptType } from '../types';
import { CopyIcon } from './icons';

interface HistoryPanelProps {
  history: PromptVersion[];
  onSelect: (id: number) => void;
  activePromptId: number | null;
  isOpen: boolean;
}

const typeColors: Record<PromptType, string> = {
  'Original': 'text-amber-400 bg-amber-900/50 border-amber-800',
  'Enhanced': 'text-cyan-400 bg-cyan-900/50 border-cyan-800',
  'Refined': 'text-fuchsia-400 bg-fuchsia-900/50 border-fuchsia-800',
  '10x': 'text-green-400 bg-green-900/50 border-green-800',
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, activePromptId, isOpen }) => {
  const handleCopy = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  return (
    <aside className={`bg-gray-800/60 backdrop-blur-md border-r border-gray-700/80 flex-shrink-0 flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-96' : 'w-0 border-r-0'}`}>
      <div className="p-4 border-b border-gray-700/80 flex justify-between items-center flex-shrink-0">
        <div>
            <h2 className="text-lg font-semibold text-gray-200">Prompt History</h2>
            <p className="text-sm text-gray-400">Latest is at the top.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {history.length > 0 ? history.map((prompt, index) => {
          const isActive = prompt.id === activePromptId;
          return (
            <div
              key={prompt.id}
              onClick={() => onSelect(prompt.id)}
              title="Select this prompt version"
              className={`p-4 border-b border-gray-800 cursor-pointer group transition-colors relative ${
                isActive
                  ? 'bg-[#ff91af]/10'
                  : 'hover:bg-gray-700/30'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm text-gray-300 truncate-3-lines ${isActive ? 'font-semibold text-gray-100' : ''}`}>
                  {prompt.content}
                </p>
                <button
                  onClick={(e) => handleCopy(e, prompt.content)}
                  className="p-1.5 text-gray-400 rounded-md hover:text-white hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                  title="Copy prompt content"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[prompt.type]}`}>
                    {prompt.type}
                 </span>
                 <span className="text-xs text-gray-400">
                    Version {history.length - index}
                 </span>
              </div>
            </div>
          );
        }) : (
            <div className="p-6 text-center text-gray-400">
                Your prompt history will appear here.
            </div>
        )}
      </div>
    </aside>
  );
};

export default HistoryPanel;
