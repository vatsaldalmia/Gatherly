import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { and, eq, count } from "drizzle-orm";
import { getDb, type Db } from "../db/index.server";
import { participants, meetups, areas as areasTable, votes } from "../db/schema";
import { getSessionOptional } from "../auth/auth-middleware.server";
import { geocodeAddress, geocodeByPlaceId } from "../maps/geocoding.server";
import { runFairnessEngine } from "../fairness/engine.server";

const TransportEnum = z.enum(["walking", "bicycle", "2-wheeler", "auto", "car", "taxi", "metro", "train", "bus"]);

const AddParticipantInput = z.object({
  meetupId: z.string(),
  name: z.string().min(1).max(80),
  address: z.string().min(1),
  transport: TransportEnum,
  placeId: z.string().optional(),
  // Browser geolocation coords — skip geocoding round-trip when provided
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/**
 * Re-runs the fairness engine for a meetup whose areas have already been calculated, because
 * the set of people (or where they are) just changed and the old areas no longer describe the
 * group. A meetup that has never been calculated is left alone — the host hasn't asked yet.
 *
 * Best-effort by design: the caller's own change (a join, a leave) has already been committed
 * and must stand even if this fails.
 */
async function recalculateAreas(db: Db, meetupId: string) {
  const existingAreas = await db
    .select({ id: areasTable.id })
    .from(areasTable)
    .where(eq(areasTable.meetupId, meetupId))
    .limit(1);
  if (existingAreas.length === 0) return;

  try {
    const allParticipants = await db.query.participants.findMany({
      where: eq(participants.meetupId, meetupId),
    });
    // Below two people there is no "fair midpoint" to find, and the host's own calculate
    // button is disabled for the same reason. Leave the areas standing rather than replacing
    // them with nonsense; the next join recalculates them properly.
    if (allParticipants.length < 2) return;

    const computed = await runFairnessEngine(allParticipants);
    const recalcAt = new Date();
    await db.delete(areasTable).where(eq(areasTable.meetupId, meetupId));
    let firstAreaId: string | null = null;
    for (const a of computed) {
      const areaId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      if (!firstAreaId) firstAreaId = areaId;
      await db.insert(areasTable).values({
        id: areaId,
        meetupId,
        name: a.name,
        lat: a.lat,
        lng: a.lng,
        fairnessScore: a.fairnessScore,
        avgTravelTimeMin: a.avgTravelTimeMin,
        avgDistanceKm: a.avgDistanceKm,
        description: a.description,
        computedAt: recalcAt,
      });
    }
    if (computed.length <= 1) {
      await db
        .update(meetups)
        .set({ status: "finalized", finalizedAreaId: firstAreaId, updatedAt: recalcAt })
        .where(eq(meetups.id, meetupId));
    } else {
      await db
        .update(meetups)
        .set({ status: "voting", updatedAt: recalcAt })
        .where(eq(meetups.id, meetupId));
    }
  } catch {
    // Recalculation is best-effort — the join/leave still succeeds even if this fails.
  }
}

export const addParticipant = createServerFn({ method: "POST" })
  .inputValidator(AddParticipantInput)
  .handler(async ({ data }) => {
    const db = getDb();

    const meetup = await db.query.meetups.findFirst({
      where: eq(meetups.id, data.meetupId),
    });
    if (!meetup) throw new Response("Meetup not found", { status: 404 });

    let lat = data.lat;
    let lng = data.lng;
    if (lat == null || lng == null) {
      const geocoded = data.placeId
        ? await geocodeByPlaceId(data.placeId)
        : await geocodeAddress(data.address);
      lat = geocoded?.lat;
      lng = geocoded?.lng;
    }

    // The invite link works with no account at all, so there is usually no session here. When
    // there is one, tie the row to that user: it gives them their own face in the participant
    // list, and lets any device they're signed in on recognise them as this participant.
    const session = await getSessionOptional();
    const user = session?.user;

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const now = new Date();
    await db.insert(participants).values({
      id,
      meetupId: data.meetupId,
      userId: user?.id ?? null,
      name: data.name,
      address: data.address,
      lat,
      lng,
      transport: data.transport,
      avatar: user?.image ?? null,
      joinedAt: now,
    });

    // Auto-advance waiting → ready when ≥ 2 participants
    const [{ value: participantCount }] = await db
      .select({ value: count() })
      .from(participants)
      .where(eq(participants.meetupId, data.meetupId));

    if (meetup.status === "waiting" && participantCount >= 2) {
      await db
        .update(meetups)
        .set({ status: "ready", updatedAt: now })
        .where(eq(meetups.id, data.meetupId));
    }

    // Areas already on screen describe a group this person wasn't in yet.
    if (lat != null && lng != null) {
      await recalculateAreas(db, data.meetupId);
    }

    return { id, lat, lng };
  });

/**
 * Removes one participant from a meetup — the joiner's own "leave", and the only way out of a
 * meetup you joined by mistake.
 *
 * A joiner has no account (the invite link is deliberately account-free), so possession of the
 * participant id — handed out at join time and kept in their browser — is what authorises this,
 * exactly as it already does for editing that participant's address. The id is checked against
 * the meetup so one meetup's id can never delete a row in another.
 */
export const leaveMeetup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ meetupId: z.string(), participantId: z.string() }))
  .handler(async ({ data }) => {
    const db = getDb();

    const participant = await db.query.participants.findFirst({
      where: and(
        eq(participants.id, data.participantId),
        eq(participants.meetupId, data.meetupId),
      ),
    });
    if (!participant) throw new Response("Participant not found", { status: 404 });

    // Votes reference the participant, so they have to go first (FK), and a vote from someone
    // who left shouldn't count toward the tally anyway.
    await db.delete(votes).where(eq(votes.participantId, data.participantId));
    await db.delete(participants).where(eq(participants.id, data.participantId));

    const [{ value: remaining }] = await db
      .select({ value: count() })
      .from(participants)
      .where(eq(participants.meetupId, data.meetupId));

    const meetup = await db.query.meetups.findFirst({ where: eq(meetups.id, data.meetupId) });

    // Drop back to "waiting" once there aren't enough people left to calculate for. A finalized
    // meetup keeps its decision — the group already agreed on a spot.
    if (remaining < 2 && meetup && meetup.status !== "finalized" && meetup.status !== "waiting") {
      await db
        .update(meetups)
        .set({ status: "waiting", updatedAt: new Date() })
        .where(eq(meetups.id, data.meetupId));
    } else {
      // The areas were computed with this person's location in the mix; without them the fair
      // midpoint sits somewhere else.
      await recalculateAreas(db, data.meetupId);
    }

    return { ok: true, remaining };
  });

export const updateParticipant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      participantId: z.string(),
      meetupId: z.string(),
      address: z.string().min(1),
      transport: TransportEnum,
      placeId: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    let lat = data.lat;
    let lng = data.lng;
    if (lat == null || lng == null) {
      const geocoded = data.placeId
        ? await geocodeByPlaceId(data.placeId)
        : await geocodeAddress(data.address);
      lat = geocoded?.lat;
      lng = geocoded?.lng;
    }
    await db
      .update(participants)
      .set({ address: data.address, transport: data.transport, lat, lng })
      .where(eq(participants.id, data.participantId));
    return { ok: true, lat, lng };
  });
