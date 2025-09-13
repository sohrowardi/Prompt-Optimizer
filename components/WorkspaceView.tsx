import React from 'react';
import { PromptVersion, ChatMessage } from '../types';
import ChatInterface from './ChatInterface';
import ActivePrompt from './ActivePrompt';
import { RocketIcon } from './icons';
import { WorkspaceViewSkeleton } from './skeletons';

interface WorkspaceViewProps {
  activePrompt: PromptVersion;
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  onStartImprovement: () => void;
  isStreaming: boolean;
  isLoading: boolean;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  activePrompt,
  chatHistory,
  onChatSubmit,
  onStartImprovement,
  isStreaming,
  isLoading,
}) => {
  // When loading (e.g., after 10x cycle), show a skeleton loader.
  if (isLoading) {
    return <WorkspaceViewSkeleton />;
  }
  
  return (
    <div className="flex-1 flex flex-row min-h-0 gap-6">
      <div className="flex-1 basis-1/2 flex flex-col">
        <ActivePrompt prompt={activePrompt} />
      </div>
      
      <div className="flex-1 basis-1/2 flex flex-col min-h-0 bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Refinement Studio</h3>
            <p className="text-sm text-gray-400">Chat with the AI to refine your prompt.</p>
          </div>
          <button
              onClick={onStartImprovement}
              disabled={isStreaming || isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-md font-semibold text-white bg-[#ff91af] rounded-lg shadow-lg hover:bg-[#f76a94] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
              title="Begin the automated 10x improvement process"
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