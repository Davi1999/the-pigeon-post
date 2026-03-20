import { DashboardDesktopRouteSkeleton } from "./DashboardFeedSkeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-black pb-4 text-center dark:border-[#f5ecd8]">
          <h1 className="text-3xl font-semibold tracking-[0.25em] uppercase font-diplomata text-center">
            Personal Dispatches from You and Your Friends!
          </h1>
        </header>

        <DashboardDesktopRouteSkeleton />
      </div>
    </div>
  );
}
