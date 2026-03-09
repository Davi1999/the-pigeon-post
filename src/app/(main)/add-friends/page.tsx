// src/app/(main)/add-friends/page.tsx

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { friendRequests } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ADD_FRIENDS_PATH = "/add-friends";

type SearchParams = Promise<{
  status?: string;
  message?: string;
}>;

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

function splitName(name: string | null | undefined) {
  if (!name) {
    return { firstName: "", lastName: "" };
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
}

export async function sendFriendRequest(formData: FormData) {
  "use server";

  const session = await requireSession();
  const currentUserId = session.user.id;

  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email) {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "Please enter an email address.",
      )}`,
    );
  }

  // Look up the target user by email
  const [targetUser] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
    })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (!targetUser) {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "No user found with that email.",
      )}`,
    );
  }

  if (targetUser.id === currentUserId) {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "You cannot send a friend request to yourself.",
      )}`,
    );
  }

  // Check existing relationship / requests in either direction
  const existingRequests = await db
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      receiverId: friendRequests.receiverId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(
      or(
        and(
          eq(friendRequests.senderId, currentUserId),
          eq(friendRequests.receiverId, targetUser.id),
        ),
        and(
          eq(friendRequests.senderId, targetUser.id),
          eq(friendRequests.receiverId, currentUserId),
        ),
      ),
    );

  const existing = existingRequests[0];

  if (existing && existing.status === "accepted") {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "You are already friends with this user.",
      )}`,
    );
  }

  if (existing && existing.status === "pending") {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "There is already a pending friend request between you and this user.",
      )}`,
    );
  }

  // If previously declined in the same direction, allow resending by updating to pending
  if (
    existing &&
    existing.status === "declined" &&
    existing.senderId === currentUserId &&
    existing.receiverId === targetUser.id
  ) {
    await db
      .update(friendRequests)
      .set({ status: "pending" })
      .where(eq(friendRequests.id, existing.id));

    redirect(
      `${ADD_FRIENDS_PATH}?status=success&message=${encodeURIComponent(
        "Friend request sent again.",
      )}`,
    );
  }

  // Otherwise, insert a new pending request
  await db.insert(friendRequests).values({
    senderId: currentUserId,
    receiverId: targetUser.id,
    status: "pending",
  });

  redirect(
    `${ADD_FRIENDS_PATH}?status=success&message=${encodeURIComponent(
      "Friend request sent.",
    )}`,
  );
}

export async function respondToFriendRequest(formData: FormData) {
  "use server";

  const session = await requireSession();
  const currentUserId = session.user.id;

  const requestId = formData.get("requestId");
  const decision = formData.get("decision");

  if (typeof requestId !== "string" || typeof decision !== "string") {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "Invalid request.",
      )}`,
    );
  }

  if (decision !== "accept" && decision !== "reject") {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "Invalid decision.",
      )}`,
    );
  }

  const [request] = await db
    .select({
      id: friendRequests.id,
      receiverId: friendRequests.receiverId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);

  if (!request || request.receiverId !== currentUserId || request.status !== "pending") {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "Unable to update this friend request.",
      )}`,
    );
  }

  const newStatus = decision === "accept" ? "accepted" : "declined";

  await db
    .update(friendRequests)
    .set({ status: newStatus })
    .where(eq(friendRequests.id, requestId));

  const successMessage =
    decision === "accept" ? "Friend request accepted." : "Friend request rejected.";

  redirect(
    `${ADD_FRIENDS_PATH}?status=success&message=${encodeURIComponent(successMessage)}`,
  );
}

export async function removeFriend(formData: FormData) {
  "use server";

  const session = await requireSession();
  const currentUserId = session.user.id;

  const friendUserId = formData.get("friendUserId");

  if (typeof friendUserId !== "string" || !friendUserId) {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "Invalid friend.",
      )}`,
    );
  }

  const [friendship] = await db
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      receiverId: friendRequests.receiverId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "accepted"),
        or(
          and(
            eq(friendRequests.senderId, currentUserId),
            eq(friendRequests.receiverId, friendUserId),
          ),
          and(
            eq(friendRequests.senderId, friendUserId),
            eq(friendRequests.receiverId, currentUserId),
          ),
        ),
      ),
    )
    .limit(1);

  if (!friendship) {
    redirect(
      `${ADD_FRIENDS_PATH}?status=error&message=${encodeURIComponent(
        "You are not currently friends with this user.",
      )}`,
    );
  }

  await db
    .update(friendRequests)
    .set({ status: "declined" })
    .where(eq(friendRequests.id, friendship.id));

  redirect(
    `${ADD_FRIENDS_PATH}?status=success&message=${encodeURIComponent(
      "Friend removed.",
    )}`,
  );
}

export default async function AddFriendsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();
  const { user } = session;
  const currentUserId = user.id;

  const { status, message } = await searchParams;

  // Inbound (received) pending friend requests
  const inboundRequests = await db
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      senderName: userTable.name,
      senderEmail: userTable.email,
    })
    .from(friendRequests)
    .innerJoin(userTable, eq(friendRequests.senderId, userTable.id))
    .where(
      and(
        eq(friendRequests.receiverId, currentUserId),
        eq(friendRequests.status, "pending"),
      ),
    );

  // Outbound (sent) pending friend requests
  const outboundRequests = await db
    .select({
      id: friendRequests.id,
      receiverId: friendRequests.receiverId,
      receiverName: userTable.name,
      receiverEmail: userTable.email,
    })
    .from(friendRequests)
    .innerJoin(userTable, eq(friendRequests.receiverId, userTable.id))
    .where(
      and(
        eq(friendRequests.senderId, currentUserId),
        eq(friendRequests.status, "pending"),
      ),
    );

  // Current friends: accepted requests where current user is either sender or receiver
  const acceptedFriendships = await db
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      receiverId: friendRequests.receiverId,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "accepted"),
        or(
          eq(friendRequests.senderId, currentUserId),
          eq(friendRequests.receiverId, currentUserId),
        ),
      ),
    );

  const friendUserIds = acceptedFriendships.map((friendship) =>
    friendship.senderId === currentUserId
      ? friendship.receiverId
      : friendship.senderId,
  );

  let friends: { id: string; name: string | null; email: string }[] = [];

  if (friendUserIds.length > 0) {
    friends = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      })
      .from(userTable)
      .where(inArray(userTable.id, friendUserIds));
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Add friends
            </h1>
            <p className="text-sm text-gray-500">
              Send and manage friend requests.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>

        {message && (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              status === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Outbound requests */}
          <section className="space-y-4 rounded-md border bg-background p-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Send friend requests</h2>
              <p className="text-sm text-gray-500">
                Enter a friend&apos;s email address to send a request.
              </p>
            </header>

            <form action={sendFriendRequest} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="friend-email"
                  className="block text-sm font-medium"
                >
                  Friend&apos;s email
                </label>
                <input
                  id="friend-email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="friend@example.com"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Send request
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                Pending requests you&apos;ve sent
              </h3>
              {outboundRequests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven&apos;t sent any friend requests yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {outboundRequests.map((request) => {
                    const { firstName, lastName } = splitName(
                      request.receiverName,
                    );
                    const displayName =
                      firstName || lastName
                        ? [firstName, lastName].filter(Boolean).join(" ")
                        : request.receiverEmail;

                    return (
                      <li
                        key={request.id}
                        className="flex items-center justify-between rounded border border-dashed px-3 py-2"
                      >
                        <div>
                          <div className="font-medium">{displayName}</div>
                          <div className="text-xs text-gray-500">
                            {request.receiverEmail}
                          </div>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Pending
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Inbound requests */}
          <section className="space-y-4 rounded-md border bg-background p-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Incoming requests</h2>
              <p className="text-sm text-gray-500">
                Approve or decline requests from other users.
              </p>
            </header>

            {inboundRequests.length === 0 ? (
              <p className="text-sm text-gray-500">
                You don&apos;t have any incoming friend requests right now.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {inboundRequests.map((request) => {
                  const { firstName, lastName } = splitName(request.senderName);
                  const displayName =
                    firstName || lastName
                      ? [firstName, lastName].filter(Boolean).join(" ")
                      : request.senderEmail;

                  return (
                    <li
                      key={request.id}
                      className="space-y-2 rounded border px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500">
                          {request.senderEmail}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <form
                          action={respondToFriendRequest}
                          className="flex-1"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <input
                            type="hidden"
                            name="decision"
                            value="accept"
                          />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
                          >
                            Accept
                          </button>
                        </form>
                        <form
                          action={respondToFriendRequest}
                          className="flex-1"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <input
                            type="hidden"
                            name="decision"
                            value="reject"
                          />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Current friends */}
          <section className="space-y-4 rounded-md border bg-background p-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Your friends</h2>
              <p className="text-sm text-gray-500">
                A list of everyone you&apos;re connected with.
              </p>
            </header>

            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">
                You don&apos;t have any friends yet. Send a request to get
                started.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {friends.map((friend) => {
                  const { firstName, lastName } = splitName(friend.name);
                  const displayName =
                    firstName || lastName
                      ? [firstName, lastName].filter(Boolean).join(" ")
                      : friend.email;

                  return (
                    <li
                      key={friend.id}
                      className="flex items-center justify-between rounded border px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500">
                          {friend.email}
                        </div>
                      </div>
                      <form action={removeFriend}>
                        <input
                          type="hidden"
                          name="friendUserId"
                          value={friend.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

