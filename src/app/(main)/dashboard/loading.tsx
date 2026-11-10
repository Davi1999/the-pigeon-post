import { FeedSkeleton } from "./FeedSkeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="border-b border-black pb-4 text-center dark:border-[#f5ecd8]">
          <h1 className="text-center font-diplomata text-[1.4rem] font-semibold uppercase tracking-[0.08em] sm:text-3xl sm:tracking-[0.25em]">
            Personal Dispatches from You and Your Friends!
          </h1>
        </header>

        <FeedSkeleton />
      </div>
    </div>
  );
}
