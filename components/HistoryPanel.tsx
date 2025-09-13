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
  'Original': 'text-amber-700 bg-amber-100 border-amber-200',
  'Enhanced': 'text-cyan-700 bg-cyan-100 border-cyan-200',
  'Refined': 'text-fuchsia-700 bg-fuchsia-100 border-fuchsia-200',
  '10x': 'text-green-700 bg-green-100 border-green-200',
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, activePromptId, onReset, isOpen }) => {
  const handleCopy = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  return (
    <aside className={`bg-white/60 backdrop-blur-md border-r border-rose-200/80 flex-shrink-0 flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-96' : 'w-0 border-r-0'}`}>
      <div className="p-4 border-b border-rose-200/80 flex justify-between items-center flex-shrink-0">
        <div>
            <h2 className="text-lg font-semibold text-slate-800">Prompt History</h2>
            <p className="text-sm text-slate-500">Latest is at the top.</p>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-rose-100/50 rounded-md hover:bg-rose-100 transition-colors" title="Start a new session and clear history">
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
              title="Select this prompt version"
              className={`p-4 border-b border-rose-100 cursor-pointer group transition-colors relative ${
                isActive
                  ? 'bg-rose-500/10'
                  : 'hover:bg-rose-50/50'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className={`text-sm text-slate-700 truncate-3-lines ${isActive ? 'font-semibold text-slate-900' : ''}`}>
                  {prompt.content}
                </p>
                <button
                  onClick={(e) => handleCopy(e, prompt.content)}
                  className="p-1.5 text-slate-500 rounded-md hover:text-slate-800 hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                  title="Copy prompt content"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[prompt.type]}`}>
                    {prompt.type}
                 </span>
                 <span className="text-xs text-slate-400">
                    Version {history.length - index}
                 </span>
              </div>
            </div>
          );
        }) : (
            <div className="p-6 text-center text-slate-400">
                Your prompt history will appear here.
            </div>
        )}
      </div>
    </aside>
  );
};

export default HistoryPanel;