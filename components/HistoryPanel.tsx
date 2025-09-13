import React from 'react';
import { PromptVersion, PromptType } from '../types';
import { CopyIcon, NewFileIcon } from './icons';

interface HistoryPanelProps {
  history: PromptVersion[];
  onSelect: (id: number) => void;
  activePromptId: number | null;
  onReset: () => void;
  isOpen: boolean;
}

const typeColors: Record<PromptType, string> = {
  'Original': 'text-amber-300 bg-amber-900/50 border-amber-700/50',
  'Enhanced': 'text-cyan-300 bg-cyan-900/50 border-cyan-700/50',
  'Refined': 'text-fuchsia-300 bg-fuchsia-900/50 border-fuchsia-700/50',
  '10x': 'text-green-300 bg-green-900/50 border-green-700/50',
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, activePromptId, onReset, isOpen }) => {
  const handleCopy = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  return (
    <aside className={`bg-slate-900/70 backdrop-blur-md border-r border-slate-700/50 flex-shrink-0 flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-96' : 'w-0 border-r-0'}`}>
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center flex-shrink-0">
        <div>
            <h2 className="text-lg font-semibold text-slate-200">Prompt History</h2>
            <p className="text-sm text-slate-400">Latest is at the top.</p>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 rounded-md hover:bg-slate-700/70 transition-colors" title="Start New Session">
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
              className={`p-4 border-b border-slate-800 cursor-pointer group transition-colors relative ${
                isActive
                  ? 'bg-indigo-500/20'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm text-slate-300 truncate-3-lines ${isActive ? 'font-semibold text-slate-100' : ''}`}>
                  {prompt.content}
                </p>
                <button
                  onClick={(e) => handleCopy(e, prompt.content)}
                  className="p-1.5 text-slate-400 rounded-md hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                  title="Copy prompt"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[prompt.type]}`}>
                    {prompt.type}
                 </span>
                 <span className="text-xs text-slate-500">
                    Version {history.length - index}
                 </span>
              </div>
            </div>
          );
        }) : (
            <div className="p-6 text-center text-slate-500">
                Your prompt history will appear here.
            </div>
        )}
      </div>
    </aside>
  );
};

export default HistoryPanel;