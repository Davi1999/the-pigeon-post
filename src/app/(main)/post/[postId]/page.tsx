import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPostForUser } from "@/lib/feed";
import { getCommentsForPost } from "@/lib/comments";
import { PostArticle } from "../../dashboard/PostArticle";
import { PostCommentsSection } from "./PostCommentsSection";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const session = await requireSession();
  const currentUserId = session.user.id;

  const post = await getPostForUser(currentUserId, postId);
  const comments = await getCommentsForPost(postId, currentUserId);

  if (!post) {
    notFound();
  }

  const currentUserDisplayName =
    session.user.name ?? session.user.email ?? "You";

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-[0.25em] uppercase font-diplomata">
            Article
          </h1>
        </header>

        <PostArticle
          postId={post.id}
          title={post.title}
          body={post.body}
          authorDisplayName={post.authorDisplayName}
          createdAt={post.createdAt}
          isOwnPost={post.isOwnPost}
          showContinueButton={false}
        />

        <PostCommentsSection
          postId={post.id}
          initialComments={comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
          currentUserDisplayName={currentUserDisplayName}
        />
      </div>
    </div>
  );
}

