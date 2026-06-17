import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { getDb } from "../db/index.server";
import { participants, meetups } from "../db/schema";
import { geocodeAddress } from "../maps/geocoding.server";

const TransportEnum = z.enum(["walking", "bike", "car", "taxi", "metro", "train", "bus"]);

const AddParticipantInput = z.object({
  meetupId: z.string(),
  name: z.string().min(1).max(80),
  address: z.string().min(1),
  transport: TransportEnum,
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
      const geocoded = await geocodeAddress(data.address);
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

    return { id, lat, lng };
  });

export const updateParticipant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      participantId: z.string(),
      meetupId: z.string(),
      address: z.string().min(1),
      transport: TransportEnum,
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    let lat = data.lat;
    let lng = data.lng;
    if (lat == null || lng == null) {
      const geocoded = await geocodeAddress(data.address);
      lat = geocoded?.lat;
      lng = geocoded?.lng;
    }
    await db
      .update(participants)
      .set({ address: data.address, transport: data.transport, lat, lng })
      .where(eq(participants.id, data.participantId));
    return { ok: true, lat, lng };
  });
