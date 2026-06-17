import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/index.server";
import { votes, meetups } from "../db/schema";
import { requireAuth } from "../auth/auth-middleware.server";

export const castVote = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      meetupId: z.string(),
      areaId: z.string(),
      participantId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();

    // Delete existing vote from this participant in this meetup (one vote per meetup)
    await db
      .delete(votes)
      .where(
        and(eq(votes.meetupId, data.meetupId), eq(votes.participantId, data.participantId)),
      );

    const now = new Date();
    await db.insert(votes).values({
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 8),
      meetupId: data.meetupId,
      areaId: data.areaId,
      participantId: data.participantId,
      createdAt: now,
    });

    // Advance ready → voting on first vote
    await db
      .update(meetups)
      .set({ status: "voting", updatedAt: now })
      .where(and(eq(meetups.id, data.meetupId), eq(meetups.status, "ready")));

    return { ok: true };
  });

export const removeVote = createServerFn({ method: "POST" })
  .inputValidator(z.object({ meetupId: z.string(), participantId: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();
    await db
      .delete(votes)
      .where(
        and(eq(votes.meetupId, data.meetupId), eq(votes.participantId, data.participantId)),
      );
    return { ok: true };
  });

export const finalizeMeetup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ meetupId: z.string(), areaId: z.string() }))
  .handler(async ({ data }) => {
    await requireAuth();
    const db = getDb();
    await db
      .update(meetups)
      .set({ status: "finalized", finalizedAreaId: data.areaId, updatedAt: new Date() })
      .where(eq(meetups.id, data.meetupId));
    return { ok: true };
  });
