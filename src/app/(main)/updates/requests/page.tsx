import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getFeatureRequestsWithLikeCounts } from "@/lib/featureRequests";
import { FeatureRequestsClient } from "./FeatureRequestsClient";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export default async function FeatureRequestsPage() {
  const session = await requireSession();

  const requests = await getFeatureRequestsWithLikeCounts(session.user.id);

  const clientRequests = requests.map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    createdAt: request.createdAt.toISOString(),
    likeCount: request.likeCount,
    likedByCurrentUser: request.likedByCurrentUser,
  }));

  return (
    <div className="space-y-6 py-6">
      <header className="border-b border-black pb-4 text-center dark:border-[#f5ecd8]">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.3em] font-diplomata">
          Feature Requests
        </h1>
        <p className="mt-1 text-[11px] text-gray-600">
          File your requests and vote for what should land next.
        </p>
      </header>

      <FeatureRequestsClient initialRequests={clientRequests} />
    </div>
  );
}

