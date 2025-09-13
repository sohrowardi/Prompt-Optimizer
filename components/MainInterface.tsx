
import React from 'react';
import { ChatMessage } from '../types';
import ChatInterface from './ChatInterface';
import { CopyIcon, UpArrowIcon } from './icons';

interface MainInterfaceProps {
  currentPrompt: string;
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  onImprove: () => void;
  isLoading: boolean;
}

const MainInterface: React.FC<MainInterfaceProps> = ({
  currentPrompt,
  chatHistory,
  onChatSubmit,
  onImprove,
  isLoading,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Current Prompt</h3>
          <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
            <CopyIcon className="h-5 w-5" />
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono text-gray-300 text-sm bg-gray-900/50 p-4 rounded-lg">
          <code>{currentPrompt}</code>
        </pre>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800/50 border border-gray-700 rounded-xl">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">Refine & Improve</h3>
          <p className="text-sm text-gray-400">Chat to refine the prompt, or make it 10x better.</p>
        </div>
        <ChatInterface
          chatHistory={chatHistory}
          onChatSubmit={onChatSubmit}
          isLoading={isLoading}
        />
        <div className="p-4 border-t border-gray-700">
           <button
              onClick={onImprove}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-md font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300"
            >
              <UpArrowIcon className="h-5 w-5" />
              Make it 10x Better
            </button>
        </div>
      </div>
    </div>
  );
};

export default MainInterface;
