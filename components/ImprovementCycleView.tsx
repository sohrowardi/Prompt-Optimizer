import React from 'react';
import { ImprovementLog } from '../types';
import { CheckIcon, FinishIcon, RocketIcon } from './icons';

interface ImprovementCycleViewProps {
    log: ImprovementLog[];
    onRunAgain: () => void;
    onFinish: () => void;
    isLoading: boolean;
}

const ImprovementCycleView: React.FC<ImprovementCycleViewProps> = ({ log, onRunAgain, onFinish, isLoading }) => {
    return (
        <div className="flex-1 flex flex-col min-h-0 p-4 bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">10x Improvement Hub</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {log.map((entry, index) => (
                    <div key={index} className="bg-rose-50/50 p-4 rounded-lg border border-rose-100">
                        <h3 className="flex items-center gap-3 font-semibold text-lg text-slate-800 mb-2">
                             {entry.content ? (
                                <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                            ) : (
                                <div className="w-5 h-5 border-2 border-t-rose-500 border-rose-100 rounded-full animate-spin flex-shrink-0 ml-0.5"></div>
                            )}
                            {entry.title}
                        </h3>
                        {entry.content && (
                             <div className="mt-2 ml-9 max-h-80 overflow-y-auto bg-white/50 p-3 rounded-md border border-rose-100 scrollbar-thin">
                                <pre className="whitespace-pre-wrap break-words font-mono text-slate-600 text-xs">
                                    {entry.content}
                                </pre>
                             </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="pt-4 mt-4 border-t border-rose-200/80 flex items-center justify-center gap-4">
                <button
                    onClick={onRunAgain}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-md font-semibold text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-t-white border-rose-200 rounded-full animate-spin"></div>
                    ) : (
                        <RocketIcon className="h-5 w-5" />
                    )}
                    Run Another 10x Cycle
                </button>
                 <button
                    onClick={onFinish}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-md font-semibold text-rose-700 bg-rose-100 rounded-lg shadow-lg hover:bg-rose-200 disabled:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300 transition-all"
                >
                    <FinishIcon className="h-5 w-5" />
                    Finish & Return
                </button>
            </div>
        </div>
    );
};

export default ImprovementCycleView;