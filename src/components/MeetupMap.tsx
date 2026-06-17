import { APIProvider, Map as GMap, useMap, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#f43f5e", "#14b8a6"];
const PIN_BG   = ["bg-violet-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500", "bg-teal-500"];

export type MeetupParticipant = { id: string; name: string; lat: number; lng: number; address: string };
export type BestArea = { lat: number; lng: number; name: string };

function shortAddr(addr: string) {
  const first = addr.split(",")[0].trim();
  return first.length > 20 ? first.slice(0, 18) + "…" : first;
}

function centroid(pts: { lat: number; lng: number }[]) {
  return {
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
  };
}

function Lines({ participants, center }: { participants: MeetupParticipant[]; center: { lat: number; lng: number } }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const lines = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !mapsLib) return;
    lines.current.forEach((l) => l.setMap(null));
    lines.current = participants.map((p, i) =>
      new mapsLib.Polyline({
        path: [{ lat: p.lat, lng: p.lng }, center],
        strokeColor: COLORS[i % COLORS.length],
        strokeOpacity: 0.55,
        strokeWeight: 2,
        geodesic: true,
        map,
      }),
    );
    return () => { lines.current.forEach((l) => l.setMap(null)); lines.current = []; };
  }, [map, mapsLib, participants, center]);

  return null;
}

function MapContent({ participants, bestArea }: { participants: MeetupParticipant[]; bestArea?: BestArea }) {
  const map = useMap();
  const center = participants.length >= 2 ? centroid(participants) : bestArea ?? null;
  const meetingPoint = bestArea ?? center;

  useEffect(() => {
    if (!map || participants.length === 0) return;
    if (participants.length === 1) {
      map.panTo({ lat: participants[0].lat, lng: participants[0].lng });
      map.setZoom(14);
      return;
    }
    const lats = participants.map((p) => p.lat);
    const lngs = participants.map((p) => p.lng);
    const bounds = { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) };
    map.fitBounds(bounds, 80);
  }, [map, participants]);

  return (
    <>
      {center && <Lines participants={participants} center={center} />}

      {/* Best area / centroid marker */}
      {meetingPoint && (
        <AdvancedMarker position={meetingPoint} title={(meetingPoint as BestArea).name ?? "Best area"}>
          <div className="flex flex-col items-center">
            <div className="bg-emerald-500 text-white rounded-full h-11 w-11 flex items-center justify-center shadow-lg ring-4 ring-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="mt-1.5 bg-gray-900/85 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow">
              {(meetingPoint as BestArea).name ?? "Best area"}
            </div>
          </div>
        </AdvancedMarker>
      )}

      {/* Participant pins */}
      {participants.map((p, i) => (
        <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={`${p.name} · ${shortAddr(p.address)}`}>
          <div className="group relative flex flex-col items-center">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-gray-500 mt-0.5">{shortAddr(p.address)}</p>
              </div>
              <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1" />
            </div>
            {/* Pin */}
            <div className={`h-9 w-9 rounded-full ${PIN_BG[i % PIN_BG.length]} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm`}>
              {p.name[0].toUpperCase()}
            </div>
            <div className={`w-2 h-2 ${PIN_BG[i % PIN_BG.length]} rotate-45 -mt-1`} />
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
}

export function MeetupMap({ participants, bestArea, height = "h-72 sm:h-96" }: {
  participants: MeetupParticipant[];
  bestArea?: BestArea;
  height?: string;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) return (
    <div className={`${height} bg-muted/40 grid place-items-center text-sm text-muted-foreground`}>
      Add VITE_GOOGLE_MAPS_API_KEY to enable map
    </div>
  );

  const defaultCenter = participants[0]
    ? { lat: participants[0].lat, lng: participants[0].lng }
    : { lat: 20, lng: 78 };

  return (
    <APIProvider apiKey={apiKey}>
      <div className={`w-full ${height}`}>
        <GMap
          defaultCenter={defaultCenter}
          defaultZoom={participants.length > 0 ? 12 : 5}
          mapTypeId="roadmap"
          mapId="gatherly-meetup"
          tilt={0}
          heading={0}
          style={{ width: "100%", height: "100%" }}
        >
          <MapContent participants={participants} bestArea={bestArea} />
        </GMap>
      </div>
    </APIProvider>
  );
}
