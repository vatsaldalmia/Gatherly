import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Better Auth tables ───────────────────────────────────────────────────────
// Better Auth creates and manages these. We define them here for Drizzle relations.

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ─── App tables ───────────────────────────────────────────────────────────────

export const meetups = sqliteTable("meetup", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("friends"),
  hostUserId: text("host_user_id").references(() => users.id, { onDelete: "set null" }),
  hostName: text("host_name").notNull(),
  date: text("date"),
  time: text("time"),
  notes: text("notes"),
  status: text("status", {
    enum: ["waiting", "ready", "voting", "finalized"],
  })
    .notNull()
    .default("waiting"),
  expectedCount: integer("expected_count"),
  finalizedAreaId: text("finalized_area_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const participants = sqliteTable("participant", {
  id: text("id").primaryKey(),
  meetupId: text("meetup_id")
    .notNull()
    .references(() => meetups.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  transport: text("transport", {
    enum: ["walking", "bicycle", "bike", "2-wheeler", "motorbike", "auto", "car", "taxi", "metro", "train", "bus"],
  })
    .notNull()
    .default("car"),
  avatar: text("avatar"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
});

export const areas = sqliteTable("area", {
  id: text("id").primaryKey(),
  meetupId: text("meetup_id")
    .notNull()
    .references(() => meetups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  fairnessScore: integer("fairness_score").notNull(),
  avgTravelTimeMin: integer("avg_travel_time_min").notNull(),
  avgDistanceKm: real("avg_distance_km").notNull(),
  description: text("description"),
  computedAt: integer("computed_at", { mode: "timestamp" }).notNull(),
});

export const votes = sqliteTable(
  "vote",
  {
    id: text("id").primaryKey(),
    meetupId: text("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    areaId: text("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("vote_uniq").on(t.meetupId, t.participantId)],
);

// ─── Relations (required for Drizzle's relational query API) ─────────────────

export const meetupsRelations = relations(meetups, ({ many }) => ({
  participants: many(participants),
  areas: many(areas),
  votes: many(votes),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  meetup: one(meetups, { fields: [participants.meetupId], references: [meetups.id] }),
  votes: many(votes),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  meetup: one(meetups, { fields: [areas.meetupId], references: [meetups.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  meetup: one(meetups, { fields: [votes.meetupId], references: [meetups.id] }),
  area: one(areas, { fields: [votes.areaId], references: [areas.id] }),
  participant: one(participants, { fields: [votes.participantId], references: [participants.id] }),
}));
