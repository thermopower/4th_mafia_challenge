'use client';

export const ChatListSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-4 border-b border-slate-700/30 animate-pulse"
        >
          <div className="w-12 h-12 bg-slate-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-700 rounded w-2/3" />
          </div>
          <div className="h-3 bg-slate-700 rounded w-12" />
        </div>
      ))}
    </div>
  );
};
