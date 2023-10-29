import { relations } from "drizzle-orm";
import {
  pgTable,
  uniqueIndex,
  text,
  timestamp,
  index,
  bigint,
  boolean,
  serial,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const topic = pgTable(
  "Topic",
  {
    id: serial("id").primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    context: text("context"),
    projectId: serial("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Topic_id_key").on(table.id),
    };
  }
);
export type Topic = typeof topic.$inferSelect;

export const topicRelations = relations(topic, ({ many }) => ({
  usersInTopics: many(usersInTopics),
  messages: many(message),
}));

export const session = pgTable(
  "Session",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    idleExpires: bigint("idle_expires", { mode: "number" }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Session_id_key").on(table.id),
      userIdIdx: index("Session_user_id_idx").on(table.userId),
    };
  }
);
export type Session = typeof session.$inferSelect;

export const key = pgTable(
  "Key",
  {
    id: text("id").primaryKey().notNull(),
    hashedPassword: text("hashed_password"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Key_id_key").on(table.id),
      userIdIdx: index("Key_user_id_idx").on(table.userId),
    };
  }
);
export type Key = typeof key.$inferSelect;

export const user = pgTable(
  "User",
  {
    id: text("id").primaryKey().notNull(),
    email: text("email"),
    username: text("username").notNull(),
    avatar: text("avatar"),
  },
  (table) => {
    return {
      idKey: uniqueIndex("User_id_key").on(table.id),
    };
  }
);
export type User = typeof user.$inferSelect;

export const userRelations = relations(user, ({ many }) => ({
  usersInProjects: many(usersInProjects),
  usersInTopics: many(usersInTopics),
}));

export const modelEnum = pgEnum("model", [
  "gpt-4",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
]);

export const project = pgTable(
  "Project",
  {
    id: serial("id").primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    context: text("context"),
    model: modelEnum("model").default("gpt-3.5-turbo-16k").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Project_id_key").on(table.id),
    };
  }
);
export type Project = typeof project.$inferSelect;

export const projectRelations = relations(project, ({ many }) => ({
  usersInProjects: many(usersInProjects),
  topics: many(topic),
}));

export const usersInProjects = pgTable(
  "UsersInProjects",
  {
    id: serial("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: serial("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
    admin: boolean("admin").default(false).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("UsersInProjects_id_key").on(table.id),
    };
  }
);
export type UsersInProjects = typeof usersInProjects.$inferSelect;

export const usersInProjectsRelations = relations(
  usersInProjects,
  ({ one }) => ({
    user: one(user),
    project: one(project),
  })
);

export const usersInTopics = pgTable(
  "UsersInTopics",
  {
    id: serial("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    topicId: serial("topic_id")
      .notNull()
      .references(() => topic.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
    admin: boolean("admin").default(false).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("UsersInTopics_id_key").on(table.id),
    };
  }
);
export type UsersInTopics = typeof usersInTopics.$inferSelect;

export const usersInTopicsRelations = relations(usersInTopics, ({ one }) => ({
  user: one(user),
  topic: one(topic),
}));

export const message = pgTable(
  "Message",
  {
    id: serial("id").primaryKey().notNull(),
    content: text("content").notNull(),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    aiGenerated: boolean("ai_generated").default(false).notNull(),
    topicId: serial("topic_id")
      .notNull()
      .references(() => topic.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Message_id_key").on(table.id),
    };
  }
);
export type Message = typeof message.$inferSelect;

export const messageRelations = relations(message, ({ one }) => ({
  topic: one(topic, {
    fields: [message.topicId],
    references: [topic.id],
  }),
  user: one(user, {
    fields: [message.authorId],
    references: [user.id],
  }),
}));

export const userOpenAiKey = pgTable(
  "UserOpenAiKey",
  {
    id: serial("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    key: text("key").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("UserOpenAiKey_id_key").on(table.id),
    };
  }
);
export type UserOpenAiKey = typeof userOpenAiKey.$inferSelect;

export const userOpenAiKeyRelations = relations(userOpenAiKey, ({ one }) => ({
  user: one(user),
}));

export const donatedKeyInProjects = pgTable(
  "DonatedKeyInProjects",
  {
    id: serial("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userOpenAiKeyId: integer("user_open_ai_key_id")
      .notNull()
      .references(() => userOpenAiKey.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("DonatedKeysInProjects_id_key").on(table.id),
    };
  }
);

export const donatedKeysInProjectsRelations = relations(
  donatedKeyInProjects,
  ({ one }) => ({
    user: one(user),
    project: one(project),
    userOpenAiKey: one(userOpenAiKey),
  })
);

// a simple key value store for storing temporary tokens
export const temporaryTokens = pgTable(
  "TemporaryTokens",
  {
    id: text("id").primaryKey().notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("TemporaryTokens_id_key").on(table.id),
    };
  }
);
