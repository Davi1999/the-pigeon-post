/** Serialized shape of a post as it crosses the server/client boundary. */
export type FeedPostSerialized = {
  id: string;
  title: string;
  body: string;
  featuredImage: string | null;
  authorDisplayName: string;
  createdAt: string;
  isOwnPost: boolean;
};

export type FeedPage = {
  posts: FeedPostSerialized[];
  nextCursor: string | null;
};
