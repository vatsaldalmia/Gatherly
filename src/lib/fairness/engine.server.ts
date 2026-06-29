import { reverseGeocode } from "../maps/geocoding.server";

type ParticipantInput = {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  transport: string;
};

export type FairnessArea = {
  name: string;
  lat: number;
  lng: number;
  fairnessScore: number;
  avgTravelTimeMin: number;
  avgDistanceKm: number;
  description: string | null;
};

const TRANSPORT_TO_GOOGLE_MODE: Record<string, string> = {
  car: "driving",
  taxi: "driving",
  auto: "driving",
  "2-wheeler": "driving",
  motorbike: "driving",
  metro: "transit",
  bus: "transit",
  train: "transit",
  bicycle: "bicycling",
  bike: "bicycling",
  walking: "walking",
};

// When every participant is within this radius of each other, they're already
// close enough that a single central spot serves the whole group — no need to
// search a grid of "fair midpoint" areas. Only spread-out groups (>5 km apart)
// get the full fairness grid search.
const CLOSE_RADIUS_KM = 5;

type DistanceMatrixResponse = {
  status: string;
  rows: Array<{
    elements: Array<{
      status: string;
      duration: { value: number };
      duration_in_traffic?: { value: number };
      distance: { value: number };
    }>;
  }>;
};

export async function runFairnessEngine(
  participantList: ParticipantInput[],
  meetupAt?: Date,
): Promise<FairnessArea[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Filter out participants without coordinates (geocoding failed)
  const withCoords = participantList.filter(
    (p): p is ParticipantInput & { lat: number; lng: number } =>
      p.lat != null && p.lng != null,
  );

  // If no API key, fall back to Haversine-based mock scores so the full flow
  // still works during local development without a Maps API key.
  if (!apiKey) {
    return haversineFallback(participantList.filter(
      (p): p is ParticipantInput & { lat: number; lng: number } =>
        p.lat != null && p.lng != null,
    ));
  }

  if (withCoords.length < 2) {
    throw new Error("Need at least 2 participants with valid addresses");
  }

  const centroid = computeCentroid(withCoords);

  // Close-knit group: everyone is within CLOSE_RADIUS_KM of the centroid, so a
  // single central area is enough — skip the grid search entirely and let users
  // browse all the places right around them.
  if (isCloseGroup(centroid, withCoords)) {
    return [await buildCentralArea(centroid, withCoords, apiKey, meetupAt)];
  }

  const candidates = generateCandidateGrid(centroid, withCoords, 8);

  // Reverse-geocode candidate names (best-effort)
  const namedCandidates = await Promise.all(
    candidates.map(async (c, i) => {
      const name = await reverseGeocode(c.lat, c.lng).catch(() => null);
      return { ...c, name: name ?? `Area ${i + 1}` };
    }),
  );

  // Group participants by transport mode
  const modeGroups = groupByMode(withCoords);

  // Build travel time matrix: participantIdx → candidateIdx → { seconds, meters }
  const matrix = await buildMatrix(withCoords, namedCandidates, modeGroups, apiKey, meetupAt);

  // Fill haversine estimates for any participant/candidate pair the API couldn't route
  // (e.g. bicycling routes unavailable in India). Silently excluding participants causes
  // biased scores that ignore the outlier entirely.
  const HAVERSINE_SPEED: Record<string, number> = {
    driving: 30, transit: 25, bicycling: 15, walking: 5, auto: 25, motorbike: 35,
  };
  withCoords.forEach((p, pi) => {
    const mode = TRANSPORT_TO_GOOGLE_MODE[p.transport] ?? "driving";
    const kph = HAVERSINE_SPEED[mode] ?? 30;
    namedCandidates.forEach((c, ci) => {
      if (!matrix[pi]?.[ci]) {
        if (!matrix[pi]) matrix[pi] = {};
        const km = haversineKm({ lat: p.lat, lng: p.lng }, c);
        matrix[pi][ci] = { seconds: (km / kph) * 3600, meters: km * 1000 };
      }
    });
  });

  // Score and sort
  const scored = namedCandidates.map((c, ci) => {
    const times = withCoords.map((_, pi) => matrix[pi]?.[ci]?.seconds ?? Infinity);
    const dists = withCoords.map((_, pi) => matrix[pi]?.[ci]?.meters ?? Infinity);
    return scoreCandidate(c, times, dists);
  });

  return scored.sort((a, b) => b.fairnessScore - a.fairnessScore).slice(0, 5);
}

function computeCentroid(pts: { lat: number; lng: number }[]) {
  return {
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
  };
}

// True when every participant is within CLOSE_RADIUS_KM of the centroid AND no
// two participants are more than CLOSE_RADIUS_KM apart — i.e. the whole group is
// already clustered tightly enough to meet at one central spot.
function isCloseGroup(
  centroid: { lat: number; lng: number },
  participants: { lat: number; lng: number }[],
): boolean {
  const allNearCentroid = participants.every(
    (p) => haversineKm(centroid, p) <= CLOSE_RADIUS_KM,
  );
  if (!allNearCentroid) return false;

  // Also check pairwise max spread (diameter) so two opposite-edge participants
  // ~10 km apart but each <5 km from centroid don't slip through.
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      if (haversineKm(participants[i], participants[j]) > CLOSE_RADIUS_KM) return false;
    }
  }
  return true;
}

// Builds a single "central area" for a close-knit group, scored against the
// group's own centroid using real travel times. Only called when an API key is
// present (the no-key path handles close groups inside haversineFallback).
async function buildCentralArea(
  centroid: { lat: number; lng: number },
  participants: (ParticipantInput & { lat: number; lng: number })[],
  apiKey: string,
  meetupAt?: Date,
): Promise<FairnessArea> {
  const name =
    (await reverseGeocode(centroid.lat, centroid.lng).catch(() => null)) ?? "Central area";

  const modeGroups = groupByMode(participants);
  const matrix = await buildMatrix(participants, [centroid], modeGroups, apiKey, meetupAt);
  const times = participants.map((_, pi) => matrix[pi]?.[0]?.seconds ?? Infinity);
  const dists = participants.map((_, pi) => matrix[pi]?.[0]?.meters ?? Infinity);
  const scored = scoreCandidate({ name, lat: centroid.lat, lng: centroid.lng }, times, dists);
  return {
    ...scored,
    description: "Everyone's within 5 km — meet anywhere central.",
  };
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function generateCandidateGrid(
  centroid: { lat: number; lng: number },
  participants: { lat: number; lng: number }[],
  count: number,
): { lat: number; lng: number }[] {
  const spread = Math.max(...participants.map((p) => haversineKm(centroid, p)), 2);
  const radius = spread * 0.5;

  const candidates: { lat: number; lng: number }[] = [];
  // Include centroid itself as first candidate
  candidates.push({ lat: centroid.lat, lng: centroid.lng });

  const ring1Count = Math.ceil((count - 1) / 2);
  const ring2Count = count - 1 - ring1Count;

  for (let i = 0; i < ring1Count; i++) {
    const angle = (i / ring1Count) * 2 * Math.PI;
    const r = radius * 0.6;
    candidates.push({
      lat: centroid.lat + (r / 111.32) * Math.cos(angle),
      lng:
        centroid.lng +
        (r / (111.32 * Math.cos((centroid.lat * Math.PI) / 180))) * Math.sin(angle),
    });
  }
  for (let i = 0; i < ring2Count; i++) {
    const angle = ((i + 0.5) / ring2Count) * 2 * Math.PI;
    const r = radius;
    candidates.push({
      lat: centroid.lat + (r / 111.32) * Math.cos(angle),
      lng:
        centroid.lng +
        (r / (111.32 * Math.cos((centroid.lat * Math.PI) / 180))) * Math.sin(angle),
    });
  }
  return candidates.slice(0, count);
}

function groupByMode(
  participants: (ParticipantInput & { lat: number; lng: number })[],
): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  participants.forEach((p, i) => {
    const mode = TRANSPORT_TO_GOOGLE_MODE[p.transport] ?? "driving";
    const existing = groups.get(mode) ?? [];
    existing.push(i);
    groups.set(mode, existing);
  });
  return groups;
}

async function buildMatrix(
  participants: (ParticipantInput & { lat: number; lng: number })[],
  candidates: { lat: number; lng: number }[],
  modeGroups: Map<string, number[]>,
  apiKey: string,
  meetupAt?: Date,
): Promise<Record<number, Record<number, { seconds: number; meters: number }>>> {
  const matrix: Record<number, Record<number, { seconds: number; meters: number }>> = {};

  // For driving: use the meetup time if it's in the future, otherwise use now.
  // departure_time gives real traffic-aware estimates from Google.
  const drivingDepartureTs = (() => {
    const base = meetupAt && meetupAt.getTime() > Date.now() ? meetupAt : new Date();
    return Math.floor(base.getTime() / 1000);
  })();

  for (const [mode, pIdxs] of modeGroups) {
    const origins = pIdxs.map((i) => `${participants[i].lat},${participants[i].lng}`).join("|");
    const destinations = candidates.map((c) => `${c.lat},${c.lng}`).join("|");

    let url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(origins)}` +
      `&destinations=${encodeURIComponent(destinations)}` +
      `&mode=${mode}` +
      `&units=metric` +
      `&key=${apiKey}`;

    // departure_time + traffic_model only supported for driving
    if (mode === "driving") {
      url += `&departure_time=${drivingDepartureTs}&traffic_model=best_guess`;
    }

    let json: DistanceMatrixResponse;
    try {
      const res = await fetch(url);
      json = (await res.json()) as DistanceMatrixResponse;
    } catch {
      continue; // Skip on network error; fallback to Infinity
    }

    if (json.status !== "OK") continue;

    pIdxs.forEach((pIdx, rowIdx) => {
      matrix[pIdx] = matrix[pIdx] ?? {};
      json.rows[rowIdx]?.elements.forEach((el, ci) => {
        if (el.status === "OK") {
          const seconds = el.duration_in_traffic?.value ?? el.duration.value;
          matrix[pIdx][ci] = { seconds, meters: el.distance.value };
        }
      });
    });
  }

  return matrix;
}

function scoreCandidate(
  candidate: { name: string; lat: number; lng: number },
  timesSeconds: number[],
  distancesMeters: number[],
): FairnessArea {
  const validTimes = timesSeconds.filter((t) => t < Infinity);
  if (validTimes.length === 0) {
    return {
      name: candidate.name,
      lat: candidate.lat,
      lng: candidate.lng,
      fairnessScore: 0,
      avgTravelTimeMin: 0,
      avgDistanceKm: 0,
      description: null,
    };
  }

  const avgSec = validTimes.reduce((s, t) => s + t, 0) / validTimes.length;
  const maxSec = Math.max(...validTimes);
  const stdDev = Math.sqrt(
    validTimes.reduce((s, t) => s + (t - avgSec) ** 2, 0) / validTimes.length,
  );

  // Normalise components (0=worst, 1=best). Weights sum to 1.
  // Ceilings are set for realistic Indian city conditions with traffic.
  const normTime = Math.max(0, Math.min(1, 1 - avgSec / (120 * 60)));     // 120-min avg ceiling
  const normVariance = Math.max(0, Math.min(1, 1 - stdDev / (60 * 60)));  // 60-min stddev ceiling
  const normMax = Math.max(0, Math.min(1, 1 - maxSec / (150 * 60)));      // 150-min worst-case ceiling

  // normMax gets extra weight to protect the most disadvantaged participant
  const rawScore = normTime * 0.25 + normVariance * 0.45 + normMax * 0.30;

  const validDists = distancesMeters.filter((d) => d < Infinity);
  const avgDistKm =
    validDists.length > 0
      ? validDists.reduce((s, d) => s + d, 0) / validDists.length / 1000
      : 0;

  return {
    name: candidate.name,
    lat: candidate.lat,
    lng: candidate.lng,
    fairnessScore: Math.round(rawScore * 100),
    avgTravelTimeMin: Math.round(avgSec / 60),
    avgDistanceKm: Math.round(avgDistKm * 10) / 10,
    description: null,
  };
}

// Offline fallback: use straight-line Haversine distances instead of real travel times.
// Less accurate than Distance Matrix but works with no API key for dev/testing.
function haversineFallback(
  participants: (ParticipantInput & { lat: number; lng: number })[],
): FairnessArea[] {
  if (participants.length < 2) return [];
  const centroid = computeCentroid(participants);

  // Close-knit group: one central area, same rule as the live engine.
  if (isCloseGroup(centroid, participants)) {
    const distances = participants.map((p) => haversineKm(p, centroid));
    const avgKm = distances.reduce((s, d) => s + d, 0) / distances.length;
    const maxKm = Math.max(...distances);
    const stdDev = Math.sqrt(
      distances.reduce((s, d) => s + (d - avgKm) ** 2, 0) / distances.length,
    );
    const avgMin = (avgKm / 40) * 60;
    const maxMin = (maxKm / 40) * 60;
    const normTime = Math.max(0, Math.min(1, 1 - avgMin / 120));
    const normVariance = Math.max(0, Math.min(1, 1 - (stdDev / 40 * 60) / 60));
    const normMax = Math.max(0, Math.min(1, 1 - maxMin / 150));
    const rawScore = normTime * 0.25 + normVariance * 0.45 + normMax * 0.30;
    return [
      {
        name: "Central area (est.)",
        lat: centroid.lat,
        lng: centroid.lng,
        fairnessScore: Math.round(rawScore * 100),
        avgTravelTimeMin: Math.round(avgMin),
        avgDistanceKm: Math.round(avgKm * 10) / 10,
        description: "Everyone's within 5 km — meet anywhere central.",
      },
    ];
  }

  const candidates = generateCandidateGrid(centroid, participants, 5);

  return candidates
    .map((c, i) => {
      // Estimate travel time: assume avg 40 km/h in city traffic
      const distances = participants.map((p) => haversineKm(p, c));
      const avgKm = distances.reduce((s, d) => s + d, 0) / distances.length;
      const maxKm = Math.max(...distances);
      const stdDev = Math.sqrt(
        distances.reduce((s, d) => s + (d - avgKm) ** 2, 0) / distances.length,
      );
      const avgMin = (avgKm / 40) * 60;
      const maxMin = (maxKm / 40) * 60;
      const normTime = Math.max(0, Math.min(1, 1 - avgMin / 120));
      const normVariance = Math.max(0, Math.min(1, 1 - (stdDev / 40 * 60) / 60));
      const normMax = Math.max(0, Math.min(1, 1 - maxMin / 150));
      const rawScore = normTime * 0.25 + normVariance * 0.45 + normMax * 0.30;
      return {
        name: `Area ${i + 1} (est.)`,
        lat: c.lat,
        lng: c.lng,
        fairnessScore: Math.round(rawScore * 100),
        avgTravelTimeMin: Math.round(avgMin),
        avgDistanceKm: Math.round(avgKm * 10) / 10,
        description: "Estimated — add GOOGLE_MAPS_API_KEY for real travel times",
      };
    })
    .sort((a, b) => b.fairnessScore - a.fairnessScore);
}
