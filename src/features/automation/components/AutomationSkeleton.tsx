import { memo } from "react";

const AutomationSkeleton = () => {
  return (
    <div className="font-body text-black pb-40 bg-[#fafafa] font-light min-h-screen">
      {/* Header Skeleton */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md flex justify-between items-center h-20 px-8 border-b border-black/10">
        <div className="w-24 h-6 bg-black/10 animate-pulse rounded-md" />
        <div className="w-32 h-10 bg-black/10 animate-pulse rounded-full" />
      </header>

      <main className="max-w-7xl mx-auto pt-32 px-6 space-y-10">
        {/* Title Section Skeleton */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div className="space-y-4">
            <div className="h-12 w-96 bg-black/10 animate-pulse rounded-lg" />
            <div className="h-12 w-64 bg-black/10 animate-pulse rounded-lg" />
            <div className="h-4 w-80 bg-black/10 animate-pulse rounded-md mt-4" />
          </div>
          <div className="glass-panel px-8 py-5 rounded-token flex items-center gap-6 border border-black/10 w-64 h-20" />
        </section>

        {/* Timezone Section Skeleton */}
        <div className="glass-panel p-6 rounded-token flex items-center gap-8 border border-black/10 h-20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-panel p-8 rounded-token h-80 border-l-4 border-l-black/20 border border-black/10" />
            <div className="glass-panel p-8 rounded-token h-80 border-l-4 border-l-black/20 border border-black/10" />
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-panel p-8 rounded-token h-96 border border-black/10" />
            <div className="glass-panel p-6 rounded-token h-32 border border-black/10" />
            <div className="glass-panel p-6 rounded-token h-48 border border-black/10" />
          </div>
        </div>

        {/* Summary Bar Skeleton */}
        <div className="p-8 bg-black/10 rounded-token border border-black/15 h-32" />
      </main>

      {/* Floating Action Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 p-8 z-[60] flex justify-center mb-4">
        <div className="glass-panel max-w-3xl w-full px-10 py-5 rounded-full h-24 border-t border-white/60" />
      </div>
    </div>
  );
};

export default memo(AutomationSkeleton);
