function SkeletonCard() {
  return (
    <article className="mb-6 break-inside-avoid border-b border-black/20 pb-5 dark:border-[#f5ecd8]/25">
      <div className="animate-pulse space-y-2">
        <div className="mx-auto h-4 w-4/5 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
        <div className="mx-auto h-px w-8 bg-black/10 dark:bg-[#f5ecd8]/15" />
        <div className="mx-auto h-2.5 w-24 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
        <div className="mx-auto h-px w-8 bg-black/10 dark:bg-[#f5ecd8]/15" />
        <div className="space-y-2 pt-2">
          <div className="h-2.5 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-2.5 w-[92%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-2.5 w-[84%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-2.5 w-[90%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-2.5 w-[70%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
        </div>
      </div>
    </article>
  );
}

export function FeedSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"
      role="status"
      aria-busy="true"
      aria-label="Loading front page"
    >
      <div className="newspaper-feed-columns">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <aside
        className="min-w-0 border-t border-black/20 pt-6 dark:border-[#f5ecd8]/25 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
        aria-hidden
      >
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-5 w-48 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="mx-auto h-px w-8 bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="space-y-2">
            <div className="h-2.5 rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[90%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
            <div className="h-2.5 w-[75%] rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          </div>
          <div className="h-9 w-full rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-9 w-full rounded bg-black/10 dark:bg-[#f5ecd8]/15" />
          <div className="h-24 w-full rounded border border-black/15 dark:border-[#f5ecd8]/25" />
        </div>
      </aside>
    </div>
  );
}
