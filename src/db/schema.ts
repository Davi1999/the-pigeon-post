import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "declined",
]);
  
  // ---------------------------------------------------------------------------
  // Posts
  // ---------------------------------------------------------------------------
  
  export const posts = pgTable(
    "posts",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      authorId: text("author_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
      deletedAt: timestamp("deleted_at"),
    },
    (t) => [index("posts_author_id_idx").on(t.authorId)],
  );
  
  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------
  
  export const comments = pgTable(
    "comments",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      postId: uuid("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
      authorId: text("author_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      // null = top-level comment; set to a comment id for nested replies
      parentId: uuid("parent_id"),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
      deletedAt: timestamp("deleted_at"),
    },
    (t) => [
      index("comments_post_id_idx").on(t.postId),
      index("comments_author_id_idx").on(t.authorId),
    ],
  );
  
  // ---------------------------------------------------------------------------
  // Friend Requests
  // ---------------------------------------------------------------------------
  
  export const friendRequests = pgTable(
    "friend_requests",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      senderId: text("sender_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      receiverId: text("receiver_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      status: friendRequestStatusEnum("status").notNull().default("pending"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    },
    (t) => [
      // Prevent duplicate A→B requests
      uniqueIndex("friend_requests_pair_idx").on(t.senderId, t.receiverId),
      index("friend_requests_receiver_id_idx").on(t.receiverId),
    ],
  );
  
  // ---------------------------------------------------------------------------
  // Site Updates
  // ---------------------------------------------------------------------------
  
  export const siteUpdates = pgTable("site_updates", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
  
  // ---------------------------------------------------------------------------
  // Feature Requests
  // ---------------------------------------------------------------------------
  
  export const featureRequests = pgTable(
    "feature_requests",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      authorId: text("author_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      description: text("description").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [index("feature_requests_created_at_idx").on(t.createdAt)],
  );
  
  // ---------------------------------------------------------------------------
  // Feature Request Likes
  // ---------------------------------------------------------------------------
  
export const featureRequestLikes = pgTable(
  "feature_request_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => featureRequests.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("feature_request_likes_request_user_idx").on(
      t.requestId,
      t.userId,
    ),
    index("feature_request_likes_request_idx").on(t.requestId),
    index("feature_request_likes_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: text("body").notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationViews = pgTable(
  "notification_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("notification_views_notification_user_idx").on(
      t.notificationId,
      t.userId,
    ),
    index("notification_views_user_idx").on(t.userId),
  ],
);
  
  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------
  
  // Extends the userRelations defined in auth-schema.ts.
  // Drizzle merges all relations() calls for the same table at runtime,
  // so auth-schema.ts doesn't need to be modified.
export const userSocialRelations = relations(user, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  sentFriendRequests: many(friendRequests, { relationName: "sender" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  featureRequests: many(featureRequests),
  featureRequestLikes: many(featureRequestLikes),
  notificationViews: many(notificationViews),
}));
  
  export const postRelations = relations(posts, ({ one, many }) => ({
    author: one(user, { fields: [posts.authorId], references: [user.id] }),
    comments: many(comments),
  }));
  
  export const commentRelations = relations(comments, ({ one, many }) => ({
    post: one(posts, { fields: [comments.postId], references: [posts.id] }),
    author: one(user, { fields: [comments.authorId], references: [user.id] }),
    parent: one(comments, {
      fields: [comments.parentId],
      references: [comments.id],
      relationName: "replies",
    }),
    replies: many(comments, { relationName: "replies" }),
  }));
  
  export const friendRequestRelations = relations(friendRequests, ({ one }) => ({
    sender: one(user, {
      fields: [friendRequests.senderId],
      references: [user.id],
      relationName: "sender",
    }),
    receiver: one(user, {
      fields: [friendRequests.receiverId],
      references: [user.id],
      relationName: "receiver",
    }),
  }));
  
  export const featureRequestRelations = relations(
    featureRequests,
    ({ one, many }) => ({
      author: one(user, {
        fields: [featureRequests.authorId],
        references: [user.id],
      }),
      likes: many(featureRequestLikes),
    }),
  );
  
export const featureRequestLikeRelations = relations(
  featureRequestLikes,
  ({ one }) => ({
    request: one(featureRequests, {
      fields: [featureRequestLikes.requestId],
      references: [featureRequests.id],
    }),
    user: one(user, {
      fields: [featureRequestLikes.userId],
      references: [user.id],
    }),
  }),
);

export const notificationRelations = relations(
  notifications,
  ({ many }) => ({
    views: many(notificationViews),
  }),
);

export const notificationViewRelations = relations(
  notificationViews,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationViews.notificationId],
      references: [notifications.id],
    }),
    user: one(user, {
      fields: [notificationViews.userId],
      references: [user.id],
    }),
  }),
);