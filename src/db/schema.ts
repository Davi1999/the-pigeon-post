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
    (t) => [index("posts_author_id_idx").on(t.authorId)]
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
    ]
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
    ]
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