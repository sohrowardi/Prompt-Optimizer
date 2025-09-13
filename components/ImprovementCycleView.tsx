import React, { useLayoutEffect, useRef } from 'react';
import { ImprovementLog } from '../types';
import { CheckIcon, FinishIcon, RocketIcon } from './icons';

// Helper to get cycle number from log entry title
const getCycleNumberFromTitle = (title: string): number | null => {
    const match = title.match(/Cycle (\d+):/);
    return match ? parseInt(match[1], 10) : null;
};

// Sub-component for a single log entry (Evaluation or Refinement)
const LogEntry: React.FC<{ entry: ImprovementLog; isStreaming: boolean; }> = ({ entry, isStreaming }) => {
    const endOfLogRef = useRef<HTMLDivElement>(null);

    // This effect ensures that as new content streams in, the view automatically
    // scrolls to the bottom, keeping the latest text visible.
    useLayoutEffect(() => {
        // scrollIntoView is a reliable way to scroll to the end of the content.
        // 'auto' behavior ensures the scroll is instant, not animated.
        endOfLogRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [entry.content]);


    return (
        <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 flex-1 basis-1/2">
            <h4 className="flex items-center gap-3 font-semibold text-lg text-slate-800 mb-2">
                {isStreaming ? (
                    <div className="w-5 h-5 border-2 border-t-rose-500 border-rose-100 rounded-full animate-spin flex-shrink-0 ml-0.5"></div>
                ) : (
                    <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                )}
                {entry.title.substring(entry.title.indexOf(': ') + 2)}
            </h4>
            <div className="mt-2 ml-9 max-h-80 overflow-y-auto bg-white/50 p-3 rounded-md border border-rose-100 scrollbar-thin">
                <pre className="whitespace-pre-wrap break-words font-mono text-slate-600 text-xs">
                    {/* The content is rendered directly for maximum speed. */}
                    <code>{entry.content || '\u00A0'}</code>
                </pre>
                {/* This empty div acts as an anchor to scroll to the bottom of the content. */}
                <div ref={endOfLogRef} />
            </div>
        </div>
    );
};

// Sub-component for a placeholder log entry
const LogPlaceholder: React.FC<{ title: string; }> = ({ title }) => (
    <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 flex-1 basis-1/2 animate-pulse">
        <h4 className="flex items-center gap-3 font-semibold text-lg text-slate-800 mb-2">
            <div className="w-5 h-5 border-2 border-rose-100 rounded-full flex-shrink-0 ml-0.5"></div>
            {title}
        </h4>
        <div className="mt-2 ml-9 max-h-80 bg-white/50 p-3 rounded-md border border-rose-100">
             <div className="space-y-2.5">
                <div className="h-3 bg-rose-200 rounded w-full"></div>
                <div className="h-3 bg-rose-200 rounded w-5/6"></div>
                <div className="h-3 bg-rose-200 rounded w-full"></div>
             </div>
        </div>
    </div>
);


const ImprovementCycleView: React.FC<{ log: ImprovementLog[], onRunAgain: () => void, onFinish: () => void, isLoading: boolean }> = ({ log, onRunAgain, onFinish, isLoading }) => {
    // Group logs by cycle number
    const cycles = log.reduce<Record<number, ImprovementLog[]>>((acc, entry) => {
        const cycleNum = getCycleNumberFromTitle(entry.title);
        if (cycleNum !== null) {
            if (!acc[cycleNum]) {
                acc[cycleNum] = [];
            }
            acc[cycleNum].push(entry);
        }
        return acc;
    }, {});

    return (
        <div className="flex-1 flex flex-col min-h-0 p-4 bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center flex-shrink-0">10x Improvement Hub</h2>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                {Object.entries(cycles).map(([cycleNum, cycleEntries]) => {
                    const evaluationEntry = cycleEntries.find(e => e.type === 'evaluation');
                    const refinementEntry = cycleEntries.find(e => e.type === 'refinement');
                    
                    return (
                        <div key={cycleNum}>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">Cycle {cycleNum}</h3>
                            <div className="flex flex-col lg:flex-row gap-4">
                                {evaluationEntry && (
                                    <LogEntry 
                                        entry={evaluationEntry} 
                                        isStreaming={isLoading && log[log.length-1]?.id === evaluationEntry.id} 
                                    />
                                )}
                                
                                {refinementEntry ? (
                                    <LogEntry 
                                        entry={refinementEntry} 
                                        isStreaming={isLoading && log[log.length-1]?.id === refinementEntry.id} 
                                    />
                                ) : (
                                    evaluationEntry && <LogPlaceholder title="Refining Prompt..." />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="pt-4 mt-4 border-t border-rose-200/80 flex items-center justify-center gap-4 flex-shrink-0">
                <button
                    onClick={onRunAgain}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-md font-semibold text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed transition-all"
                    title="Run another automated evaluation and refinement cycle"
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
                    title="Finish and return to the chat refinement studio"
                >
                    <FinishIcon className="h-5 w-5" />
                    Finish & Return
                </button>
            </div>
        </div>
    );
};

export default ImprovementCycleView;