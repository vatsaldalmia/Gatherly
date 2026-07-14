import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, desc, or, inArray } from "drizzle-orm";
import { getDb } from "../db/index.server";
import { meetups, participants, areas, votes } from "../db/schema";
import { requireAuth } from "../auth/auth-middleware.server";

/**
 * Every meetup the signed-in user is part of — the ones they host *and* the ones they joined
 * from someone else's invite link. Hosting used to be the only way a meetup could show up
 * here, so joining a friend's plan left you with nothing to come back to: the invite link was
 * the only way to reach it again.
 *
 * Callers must not read "it's in this list" as "I host it" — check `hostUserId` for that.
 */
export const listMeetups = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireAuth();
  const db = getDb();

  const joined = db
    .select({ id: participants.meetupId })
    .from(participants)
    .where(eq(participants.userId, session.user.id));

  return db.query.meetups.findMany({
    where: or(eq(meetups.hostUserId, session.user.id), inArray(meetups.id, joined)),
    with: { participants: true, areas: true, votes: true },
    orderBy: [desc(meetups.createdAt)],
  });
});

export const getMeetup = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const row = await db.query.meetups.findFirst({
      where: eq(meetups.id, data.id),
      with: { participants: true, areas: true, votes: true },
    });
    if (!row) throw new Response("Not found", { status: 404 });
    return row;
  });

const CreateMeetupInput = z.object({
  name: z.string().min(1).max(120),
  type: z.string().default("friends"),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  expectedCount: z.number().int().min(2).max(100).optional(),
});

export const createMeetup = createServerFn({ method: "POST" })
  .inputValidator(CreateMeetupInput)
  .handler(async ({ data }) => {
    const session = await requireAuth();
    const db = getDb();
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const now = new Date();
    await db.insert(meetups).values({
      id,
      name: data.name,
      type: data.type,
      hostUserId: session.user.id,
      hostName: session.user.name,
      date: data.date,
      time: data.time,
      notes: data.notes,
      expectedCount: data.expectedCount,
      status: "waiting",
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  });

export const deleteMeetup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireAuth();
    const db = getDb();
    const meetup = await db.query.meetups.findFirst({ where: eq(meetups.id, data.id) });
    if (!meetup) throw new Response("Not found", { status: 404 });
    if (meetup.hostUserId !== session.user.id) throw new Response("Forbidden", { status: 403 });
    // Delete child rows first (FK constraints)
    await db.delete(votes).where(eq(votes.meetupId, data.id));
    await db.delete(areas).where(eq(areas.meetupId, data.id));
    await db.delete(participants).where(eq(participants.meetupId, data.id));
    await db.delete(meetups).where(eq(meetups.id, data.id));
    return { ok: true };
  });

export const updateMeetup = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      patch: z.object({
        name: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        notes: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    await requireAuth();
    const db = getDb();
    await db
      .update(meetups)
      .set({ ...data.patch, updatedAt: new Date() })
      .where(eq(meetups.id, data.id));
    return { ok: true };
  });
