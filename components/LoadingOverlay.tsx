import React from 'react';
import { CheckIcon } from './icons';
// fix: Use ImprovementLog as ImprovementStep is not defined in ../types
import { ImprovementLog } from '../types';

interface LoadingOverlayProps {
  steps: ImprovementLog[];
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ steps }) => {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-gray-800/80 border border-gray-700 rounded-xl p-6 shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Making it 10x Better...</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="w-full text-left">
              <div className="flex items-center gap-3 text-gray-300">
                {/* fix: Check for step.content to determine if the step is complete, instead of step.status */}
                {step.content ? (
                  <CheckIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-t-[#ff91af] border-gray-600 rounded-full animate-spin flex-shrink-0 ml-0.5"></div>
                )}
                <span className="font-semibold text-lg">{step.title}</span>
              </div>
              {step.content && (
                <div className="mt-2 ml-9 max-h-60 overflow-y-auto bg-gray-900/70 p-3 rounded-md border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <pre className="whitespace-pre-wrap break-words font-mono text-gray-400 text-xs">
                    {step.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add styles for scrollbar
const style = document.createElement('style');
style.textContent = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #1f2937; /* bg-gray-800 */
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #4b5563; /* bg-gray-600 */
    border-radius: 4px;
    border: 2px solid #1f2937; /* bg-gray-800 */
  }
`;
document.head.append(style);

export default LoadingOverlay;