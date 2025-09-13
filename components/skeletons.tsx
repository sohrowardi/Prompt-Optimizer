import React from 'react';

const ActivePromptSkeleton: React.FC = () => (
    <div className="bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl p-6 relative flex-1 flex flex-col animate-pulse">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="h-6 bg-rose-100 rounded w-3/4"></div>
            <div className="h-8 bg-rose-100 rounded w-20"></div>
        </div>
        <div className="flex-1 bg-rose-50/70 p-4 rounded-lg space-y-3">
            <div className="h-4 bg-rose-100 rounded w-full"></div>
            <div className="h-4 bg-rose-100 rounded w-5/6"></div>
            <div className="h-4 bg-rose-100 rounded w-full"></div>
            <div className="h-4 bg-rose-100 rounded w-3/4"></div>
        </div>
    </div>
);

const ChatInterfaceSkeleton: React.FC = () => (
    <div className="flex-1 basis-1/2 flex flex-col min-h-0 bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl animate-pulse">
        <div className="p-4 border-b border-rose-200/80 flex justify-between items-center">
            <div>
                <div className="h-6 bg-rose-100 rounded w-48 mb-2"></div>
                <div className="h-4 bg-rose-100 rounded w-64"></div>
            </div>
            <div className="h-10 bg-rose-100 rounded-lg w-48"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-100 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-rose-100 rounded w-full"></div>
                    <div className="h-4 bg-rose-100 rounded w-5/6"></div>
                </div>
            </div>
        </div>
        <div className="p-4 border-t border-rose-200/80">
            <div className="h-12 bg-rose-100 rounded-xl w-full"></div>
        </div>
    </div>
);

export const WorkspaceViewSkeleton: React.FC = () => (
    <div className="flex-1 flex flex-row min-h-0 gap-6">
        <div className="flex-1 basis-1/2 flex flex-col">
            <ActivePromptSkeleton />
        </div>
        <ChatInterfaceSkeleton />
    </div>
);