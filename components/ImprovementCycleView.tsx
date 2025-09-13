import React, { useState, useEffect, useRef } from 'react';
import { ImprovementLog } from '../types';
import { CheckIcon, FinishIcon, RocketIcon } from './icons';

// A component to render text with a typewriter effect, mimicking a rapid terminal update.
const Typewriter: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');
    const textRef = useRef(text);

    // Keep the ref updated with the latest full text from props
    useEffect(() => {
        textRef.current = text;
    }, [text]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Animate from the current displayed text to the target text in the ref
            if (displayedText.length < textRef.current.length) {
                const nextLength = Math.min(
                    displayedText.length + 5, // Render 5 characters per frame for a rapid feel
                    textRef.current.length
                );
                setDisplayedText(textRef.current.substring(0, nextLength));
            } else {
                // Once caught up, we can clear the interval until the next text update.
                // However, letting it run is simpler and handles continuous streams well.
            }
        }, 16); // ~60 FPS

        return () => clearInterval(interval);
    }, [displayedText]); // This dependency makes the effect act like a render loop

    // Return a non-breaking space if empty to maintain container height
    return <code>{displayedText || '\u00A0'}</code>;
};


// Helper to get cycle number from log entry title
const getCycleNumberFromTitle = (title: string): number | null => {
    const match = title.match(/Cycle (\d+):/);
    return match ? parseInt(match[1], 10) : null;
};

// Sub-component for a single log entry (Evaluation or Refinement)
const LogEntry: React.FC<{ entry: ImprovementLog; isStreaming: boolean; }> = ({ entry, isStreaming }) => (
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
                <Typewriter text={entry.content} />
            </pre>
        </div>
    </div>
);

// Sub-component for a placeholder log entry
const LogPlaceholder: React.FC<{ title: string; message: string; }> = ({ title, message }) => (
    <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 flex-1 basis-1/2 opacity-60">
        <h4 className="flex items-center gap-3 font-semibold text-lg text-slate-800 mb-2">
            <div className="w-5 h-5 border-2 border-rose-100 rounded-full flex-shrink-0 ml-0.5"></div>
            {title}
        </h4>
        <div className="mt-2 ml-9 max-h-80 overflow-y-auto bg-white/50 p-3 rounded-md border border-rose-100 scrollbar-thin">
            <pre className="whitespace-pre-wrap break-words font-mono text-slate-600 text-xs">
                {message}
            </pre>
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
                                    evaluationEntry && <LogPlaceholder title="Refining Prompt..." message="Awaiting evaluation..." />
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