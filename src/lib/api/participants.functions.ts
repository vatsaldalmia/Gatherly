import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { getDb } from "../db/index.server";
import { participants, meetups, areas as areasTable } from "../db/schema";
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

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const now = new Date();
    await db.insert(participants).values({
      id,
      meetupId: data.meetupId,
      name: data.name,
      address: data.address,
      lat,
      lng,
      transport: data.transport,
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

    // Auto-recalculate areas when a new participant joins and areas already exist
    // (i.e. the host has already run "Find best area" at least once)
    if (lat != null && lng != null) {
      const existingAreas = await db
        .select({ id: areasTable.id })
        .from(areasTable)
        .where(eq(areasTable.meetupId, data.meetupId))
        .limit(1);

      if (existingAreas.length > 0) {
        try {
          const allParticipants = await db.query.participants.findMany({
            where: eq(participants.meetupId, data.meetupId),
          });
          const computed = await runFairnessEngine(allParticipants);
          const recalcAt = new Date();
          await db.delete(areasTable).where(eq(areasTable.meetupId, data.meetupId));
          let firstAreaId: string | null = null;
          for (const a of computed) {
            const areaId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
            if (!firstAreaId) firstAreaId = areaId;
            await db.insert(areasTable).values({
              id: areaId,
              meetupId: data.meetupId,
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
              .where(eq(meetups.id, data.meetupId));
          } else {
            await db
              .update(meetups)
              .set({ status: "voting", updatedAt: recalcAt })
              .where(eq(meetups.id, data.meetupId));
          }
        } catch {
          // Recalculation is best-effort — join still succeeds even if this fails
        }
      }
    }

    return { id, lat, lng };
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
