
import React from 'react';
import { CheckIcon } from './icons';

interface LoadingOverlayProps {
  steps: string[];
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ steps }) => {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">Making it 10x Better...</h2>
        <div className="w-16 h-16 border-4 border-t-indigo-400 border-gray-600 rounded-full animate-spin mx-auto mb-8"></div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center justify-center text-left gap-3 text-gray-300">
               <CheckIcon className="h-5 w-5 text-green-400" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
