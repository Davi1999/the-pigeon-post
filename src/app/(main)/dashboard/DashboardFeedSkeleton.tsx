/** Presentational skeletons: safe for Server and Client imports (no hooks). */

import { NEWSPAPER_SKELETON_FRAME } from "./dashboardFeedLayout";

function SkeletonArticleBlocks({ count = 9 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <article
          key={i}
          className="animate-pulse space-y-2 break-inside-avoid border-b border-black/15 pb-3 dark:border-[#f5ecd8]/25"
        >
          <div className="mx-auto h-4 max-w-[85%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="mx-auto h-0.5 w-8 bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="mx-auto space-y-1.5 pt-1">
            <div className="h-2.5 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[92%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[78%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="hidden h-2.5 w-[85%] rounded bg-black/10 sm:block dark:bg-[#f5ecd8]/15" />
            <div className="hidden h-2.5 w-[70%] rounded bg-black/10 sm:block dark:bg-[#f5ecd8]/15" />
          </div>
        </article>
      ))}
    </>
  );
}

/**
 * Direct children only — must sit inside `.newspaper-paged-columns` so `column-count: 3`
 * applies (no wrapper div between multicol container and blocks).
 */
export function NewspaperFeedSkeletonContent({ count }: { count?: number }) {
  return <SkeletonArticleBlocks count={count} />;
}

/**
 * Full desktop grid + sidebar placeholders for `loading.tsx` (route transition).
 */
export function DashboardDesktopRouteSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_1px_minmax(0,1fr)]">
      <div
        className="newspaper-paged-columns lg:col-span-3"
        style={NEWSPAPER_SKELETON_FRAME}
        aria-busy="true"
        aria-label="Loading edition"
        role="status"
      >
        <NewspaperFeedSkeletonContent />
      </div>

      <div
        className="hidden bg-black dark:bg-[#f5ecd8] lg:block"
        aria-hidden
      />

      <aside className="space-y-4 text-sm" aria-hidden>
        <div className="flex flex-col items-center gap-6 pb-3">
          <div className="h-20 w-full max-w-44 rounded border border-black/20 bg-black/5 dark:border-[#f5ecd8]/30 dark:bg-[#f5ecd8]/10" />
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="mx-auto h-5 w-48 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="mx-auto h-px w-8 bg-black/15 dark:bg-[#f5ecd8]/20" />
          <div className="space-y-2 pt-1">
            <div className="h-2.5 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[90%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[70%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          </div>
          <div className="h-10 w-full rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-10 w-full rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-24 w-full rounded border border-black/15 bg-black/5 dark:border-[#f5ecd8]/25 dark:bg-[#f5ecd8]/10" />
        </div>
      </aside>
    </div>
  );
}
