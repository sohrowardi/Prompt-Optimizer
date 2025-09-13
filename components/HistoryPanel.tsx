
import React from 'react';
import { PromptVersion, PromptType } from '../types';
import { CopyIcon, NewFileIcon } from './icons';

interface HistoryPanelProps {
  history: PromptVersion[];
  onSelect: (id: number) => void;
  activePromptId: number | null;
  onReset: () => void;
}

const typeColors: Record<PromptType, string> = {
  'Original': 'text-amber-400 border-amber-400/50',
  'Enhanced': 'text-cyan-400 border-cyan-400/50',
  'Refined': 'text-fuchsia-400 border-fuchsia-400/50',
  '10x': 'text-green-400 border-green-400/50',
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, activePromptId, onReset }) => {
  const handleCopy = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  return (
    <aside className="w-96 bg-gray-800/50 border-r border-gray-700 flex-shrink-0 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-semibold text-gray-100">Prompt History</h2>
            <p className="text-sm text-gray-400">Latest is at the top.</p>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors" title="Start New Session">
            <NewFileIcon className="h-4 w-4" />
            New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {history.length > 0 ? history.map((prompt, index) => {
          const isActive = prompt.id === activePromptId;
          return (
            <div
              key={prompt.id}
              onClick={() => onSelect(prompt.id)}
              className={`p-4 border-b border-gray-700 cursor-pointer group transition-colors relative ${
                isActive
                  ? 'bg-indigo-900/50'
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm text-gray-300 truncate-3-lines ${isActive ? 'font-semibold' : ''}`}>
                  {prompt.content}
                </p>
                <button
                  onClick={(e) => handleCopy(e, prompt.content)}
                  className="p-1.5 text-gray-400 rounded-md hover:text-white hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                  title="Copy prompt"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[prompt.type]}`}>
                    {prompt.type}
                 </span>
                 <span className="text-xs text-gray-500">
                    Version {history.length - index}
                 </span>
              </div>
            </div>
          );
        }) : (
            <div className="p-6 text-center text-gray-500">
                Your prompt history will appear here.
            </div>
        )}
      </div>
    </aside>
  );
};

export default HistoryPanel;
