
import React from 'react';
import { PromptVersion, ChatMessage } from '../types';
import ChatInterface from './ChatInterface';
import ActivePrompt from './ActivePrompt';
import { RocketIcon } from './icons';

interface WorkspaceViewProps {
  activePrompt: PromptVersion;
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  onStartImprovement: () => void;
  isStreaming: boolean;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  activePrompt,
  chatHistory,
  onChatSubmit,
  onStartImprovement,
  isStreaming,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6">
      <ActivePrompt prompt={activePrompt} />
      
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800/50 border border-gray-700 rounded-xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Refinement Studio</h3>
            <p className="text-sm text-gray-400">Chat with the AI to refine your prompt.</p>
          </div>
          <button
              onClick={onStartImprovement}
              disabled={isStreaming}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-md font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300"
            >
              <RocketIcon className="h-5 w-5" />
              Start 10x Improvement
          </button>
        </div>
        <ChatInterface
          chatHistory={chatHistory}
          onChatSubmit={onChatSubmit}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default WorkspaceView;
