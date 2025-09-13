
import React from 'react';
import { CopyIcon } from './icons';

interface HistoryPanelProps {
  history: string[];
  onSelect: (prompt: string) => void;
  currentPrompt: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, currentPrompt }) => {
  if (history.length === 0) {
    return null;
  }

  const handleCopy = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
  };

  return (
    <aside className="w-80 bg-gray-800/50 border-l border-gray-700 flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Prompt History</h2>
        <p className="text-sm text-gray-400">Latest version is at the top.</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.map((prompt, index) => {
          const isActive = prompt === currentPrompt;
          return (
            <div
              key={index}
              onClick={() => onSelect(prompt)}
              className={`p-4 border-b border-gray-700 cursor-pointer group transition-colors ${
                isActive
                  ? 'bg-indigo-900/50'
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className={`text-sm text-gray-300 truncate-3-lines ${isActive ? 'font-semibold' : ''}`}>
                  {prompt}
                </p>
                <button
                  onClick={(e) => handleCopy(e, prompt)}
                  className="ml-2 p-1.5 text-gray-400 rounded-md hover:text-white hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy prompt"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
              <span className={`text-xs mt-2 inline-block ${isActive ? 'text-indigo-300' : 'text-gray-500'}`}>
                Version {history.length - index}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

// Custom CSS for truncating text
const style = document.createElement('style');
style.textContent = `
  .truncate-3-lines {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;  
    overflow: hidden;
  }
`;
document.head.append(style);


export default HistoryPanel;
