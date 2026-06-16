import { useEffect, useState } from "react";
import { meetups as seedMeetups } from "./dummy-data";

export type TransportMode =
  | "walking"
  | "bike"
  | "car"
  | "taxi"
  | "metro"
  | "train"
  | "bus";

export type Participant = {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  transport: TransportMode;
  joinedAt: number;
  avatar?: string;
};

export type MeetupStatus =
  | "waiting"
  | "ready"
  | "voting"
  | "finalized";

export type MeetupRecord = {
  id: string;
  name: string;
  type: string;
  hostName: string;
  date?: string;
  time?: string;
  notes?: string;
  createdAt: number;
  status: MeetupStatus;
  participants: Participant[];
  expectedCount?: number;
  votes: Record<string, string[]>; // areaName -> participantIds
  finalizedArea?: string;
};

const KEY = "gatherly:meetups";
const SEED_FLAG = "gatherly:seeded:v1";

function read(): MeetupRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MeetupRecord[];
  } catch {
    return [];
  }
}

function write(list: MeetupRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("gatherly:meetups-change"));
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const existing = read();
  if (existing.length > 0) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }
  const seeded: MeetupRecord[] = seedMeetups.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    hostName: m.members[0]?.name ?? "Host",
    date: m.date,
    time: m.time,
    createdAt: Date.now() - Math.random() * 1e9,
    status:
      m.status === "voting"
        ? "voting"
        : m.status === "past"
          ? "finalized"
          : "ready",
    participants: m.members.map((mm, i) => ({
      id: `seed-${m.id}-${i}`,
      name: mm.name,
      address: mm.location,
      transport: (["car", "metro", "bike", "walking"] as TransportMode[])[i % 4],
      joinedAt: Date.now() - i * 60000,
      avatar: mm.avatar,
    })),
    expectedCount: m.members.length,
    votes: {},
    finalizedArea: m.area,
  }));
  write(seeded);
  localStorage.setItem(SEED_FLAG, "1");
}

export function listMeetups(): MeetupRecord[] {
  ensureSeeded();
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getMeetup(id: string): MeetupRecord | undefined {
  ensureSeeded();
  return read().find((m) => m.id === id);
}

export function createMeetup(
  input: Omit<MeetupRecord, "id" | "createdAt" | "status" | "participants" | "votes">,
): MeetupRecord {
  ensureSeeded();
  const id =
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
      .replace(/-/g, "")
      .slice(0, 8);
  const rec: MeetupRecord = {
    ...input,
    id,
    createdAt: Date.now(),
    status: "waiting",
    participants: [],
    votes: {},
  };
  write([rec, ...read()]);
  return rec;
}

export function updateMeetup(id: string, patch: Partial<MeetupRecord>) {
  const list = read();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  write(list);
}

export function addParticipant(id: string, p: Omit<Participant, "id" | "joinedAt">): Participant {
  const list = read();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Meetup not found");
  const participant: Participant = {
    ...p,
    id: Math.random().toString(36).slice(2, 10),
    joinedAt: Date.now(),
  };
  list[idx].participants.push(participant);
  if (list[idx].status === "waiting" && list[idx].participants.length >= 2) {
    list[idx].status = "ready";
  }
  write(list);
  return participant;
}

export function castVote(id: string, areaName: string, participantId: string) {
  const list = read();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return;
  const votes = { ...(list[idx].votes ?? {}) };
  // remove previous vote
  for (const k of Object.keys(votes)) {
    votes[k] = votes[k].filter((v) => v !== participantId);
  }
  votes[areaName] = [...(votes[areaName] ?? []), participantId];
  list[idx].votes = votes;
  if (list[idx].status === "ready") list[idx].status = "voting";
  write(list);
}

export function finalizeMeetup(id: string, areaName: string) {
  updateMeetup(id, { status: "finalized", finalizedArea: areaName });
}

export function useMeetup(id: string | undefined) {
  const [meetup, setMeetup] = useState<MeetupRecord | undefined>(() =>
    id ? getMeetup(id) : undefined,
  );
  useEffect(() => {
    if (!id) return;
    const sync = () => setMeetup(getMeetup(id));
    sync();
    window.addEventListener("gatherly:meetups-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gatherly:meetups-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);
  return meetup;
}

export function useMeetupsList() {
  const [list, setList] = useState<MeetupRecord[]>(() => listMeetups());
  useEffect(() => {
    const sync = () => setList(listMeetups());
    sync();
    window.addEventListener("gatherly:meetups-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gatherly:meetups-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

export const TRANSPORT_OPTIONS: { id: TransportMode; label: string }[] = [
  { id: "walking", label: "Walking" },
  { id: "bike", label: "Bike" },
  { id: "car", label: "Car" },
  { id: "taxi", label: "Taxi" },
  { id: "metro", label: "Metro" },
  { id: "train", label: "Train" },
  { id: "bus", label: "Bus" },
];

export function getMyParticipantId(meetupId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`gatherly:me:${meetupId}`);
}

export function setMyParticipantId(meetupId: string, participantId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`gatherly:me:${meetupId}`, participantId);
}