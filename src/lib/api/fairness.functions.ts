import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.server";
import { areas, meetups } from "../db/schema";
import { runFairnessEngine } from "../fairness/engine.server";
import { requireAuth } from "../auth/auth-middleware.server";

// Triggered by the host clicking "Find best area". Expensive — calls Distance Matrix API.
// Results are cached in the areas table; re-triggering replaces previous results.
export const calculateAreas = createServerFn({ method: "POST" })
  .inputValidator(z.object({ meetupId: z.string() }))
  .handler(async ({ data }) => {
    await requireAuth();
    const db = getDb();

    const meetup = await db.query.meetups.findFirst({
      where: eq(meetups.id, data.meetupId),
      with: { participants: true },
    });
    if (!meetup) throw new Response("Not found", { status: 404 });
    if (meetup.participants.length < 2) {
      throw new Response("Need at least 2 participants", { status: 400 });
    }

    const invalid = meetup.participants.filter((p) => p.lat == null || p.lng == null);
    const valid = meetup.participants.filter((p) => p.lat != null && p.lng != null);
    if (valid.length < 2) {
      const names = invalid.map((p) => `${p.name} ("${p.address}")`).join(", ");
      throw new Error(`Need at least 2 participants with valid addresses. Please fix: ${names}`);
    }

    const computed = await runFairnessEngine(meetup.participants);

    // Replace existing areas for this meetup
    await db.delete(areas).where(eq(areas.meetupId, data.meetupId));

    const now = new Date();
    let firstAreaId: string | null = null;
    for (const a of computed) {
      const areaId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      if (!firstAreaId) firstAreaId = areaId;
      await db.insert(areas).values({
        id: areaId,
        meetupId: data.meetupId,
        name: a.name,
        lat: a.lat,
        lng: a.lng,
        fairnessScore: a.fairnessScore,
        avgTravelTimeMin: a.avgTravelTimeMin,
        avgDistanceKm: a.avgDistanceKm,
        description: a.description,
        computedAt: now,
      });
    }

    // Close-knit group: the engine returns a single central area, so there's
    // nothing to vote on — finalize it straight away. Otherwise open voting.
    if (computed.length <= 1) {
      await db
        .update(meetups)
        .set({ status: "finalized", finalizedAreaId: firstAreaId, updatedAt: now })
        .where(eq(meetups.id, data.meetupId));
    } else if (meetup.status === "ready" || meetup.status === "waiting") {
      await db
        .update(meetups)
        .set({ status: "voting", updatedAt: now })
        .where(eq(meetups.id, data.meetupId));
    }

    return computed;
  });
