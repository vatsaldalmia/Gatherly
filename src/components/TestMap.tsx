import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, X, Loader2, LocateFixed } from "lucide-react";

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const INDIA_ZOOM = 5;
const LOCAL_ZOOM = 15;
const SEARCH_ZOOM = 14;

const INDIA_BOUNDS = {
  north: 37.5,
  south: 6.5,
  west: 68.0,
  east: 97.5,
};

const PIN_BG = ["bg-violet-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500", "bg-teal-500"];

export type ParticipantPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  meetupName: string;
};

export type SearchedPlace = { lat: number; lng: number; name: string };

type Coords = { lat: number; lng: number };

function isWithinIndia({ lat, lng }: Coords) {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
}

function GeolocateUser({ onLocate, hasPins }: { onLocate: (c: Coords) => void; hasPins: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!isWithinIndia(coords)) return;
        onLocate(coords);
        if (!hasPins) { map.panTo(coords); map.setZoom(LOCAL_ZOOM); }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function FitToPins({ participants, user }: { participants: ParticipantPin[]; user: Coords | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const pts: Coords[] = [...participants.map((p) => ({ lat: p.lat, lng: p.lng }))];
    if (user) pts.push(user);
    if (pts.length === 0) return;
    if (pts.length === 1) { map.panTo(pts[0]); map.setZoom(LOCAL_ZOOM); return; }
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      80,
    );
  }, [map, participants, user]);
  return null;
}

function LocateButton({ user, onLocate }: { user: Coords | null; onLocate: (c: Coords) => void }) {
  const map = useMap();
  const [busy, setBusy] = useState(false);

  const goToMe = () => {
    if (!map) return;
    if (user) { map.panTo(user); map.setZoom(LOCAL_ZOOM); return; }
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setBusy(false);
        if (!isWithinIndia(coords)) return;
        onLocate(coords);
        map.panTo(coords);
        map.setZoom(LOCAL_ZOOM);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <button
      type="button"
      onClick={goToMe}
      title="Go to my location"
      className="absolute bottom-4 right-3 z-10 h-11 w-11 grid place-items-center rounded-full bg-white/95 backdrop-blur text-primary shadow-lg ring-1 ring-primary/25 hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
    </button>
  );
}

function SearchBox({ onPick }: { onPick: (p: SearchedPlace) => void }) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    if (!placesLib || !inputRef.current || acRef.current) return;

    // No country restriction — allow searching anywhere
    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "name", "geometry"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const picked: SearchedPlace = {
        lat: loc.lat(),
        lng: loc.lng(),
        name: place.name ?? place.formatted_address ?? "Searched location",
      };
      onPick(picked);
      map?.panTo({ lat: picked.lat, lng: picked.lng });
      map?.setZoom(SEARCH_ZOOM);
    });

    acRef.current = ac;
    return () => {
      if (acRef.current) {
        google.maps.event.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, [placesLib]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setHasValue(false);
  };

  return (
    <div className="absolute top-3 left-3 right-3 z-10 sm:right-auto sm:w-80">
      {/* 1.5px orange gradient border using bg-gradient-primary (always orange, light + dark) */}
      <div className="p-[1.5px] rounded-full shadow-lg overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.672 0.131 39) 0%, oklch(0.73 0.118 42) 100%)" }}>
        <div className="relative rounded-full overflow-hidden bg-white dark:bg-gray-900">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: "oklch(0.672 0.131 39)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search any area or place…"
            onChange={(e) => setHasValue(e.target.value.length > 0)}
            className="w-full h-11 pl-10 pr-9 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {hasValue && (
            <button
              type="button"
              onClick={clear}
              title="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestMap({
  participants = [],
  onSearch,
}: {
  participants?: ParticipantPin[];
  onSearch?: (place: SearchedPlace | null) => void;
}) {
  const [user, setUser] = useState<Coords | null>(null);
  const [searched, setSearched] = useState<SearchedPlace | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  if (!apiKey) {
    return (
      <div className="h-[500px] grid place-items-center text-sm text-muted-foreground bg-muted/40">
        Add VITE_GOOGLE_MAPS_API_KEY to enable the map
      </div>
    );
  }

  const hasPins = participants.length > 0;

  const handlePick = (place: SearchedPlace) => {
    setSearched(place);
    onSearch?.(place);
  };

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <div className="relative w-full h-[500px]">
        <Map
          defaultCenter={INDIA_CENTER}
          defaultZoom={INDIA_ZOOM}
          mapId="gatherly-dashboard"
          tilt={0}
          heading={0}
          restriction={{ latLngBounds: INDIA_BOUNDS, strictBounds: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <GeolocateUser onLocate={setUser} hasPins={hasPins} />
          <FitToPins participants={participants} user={user} />
          <SearchBox onPick={handlePick} />
          <LocateButton user={user} onLocate={setUser} />

          {/* User pin */}
          {user && (
            <AdvancedMarker position={user} title="You are here">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-white">
                  <Navigation className="h-5 w-5" />
                </div>
                <div className="mt-1.5 bg-gray-900/85 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow">
                  You are here
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Searched location pin */}
          {searched && (
            <AdvancedMarker position={{ lat: searched.lat, lng: searched.lng }} title={searched.name}>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full text-white flex items-center justify-center shadow-lg ring-4 ring-white" style={{ background: "oklch(0.672 0.131 39)" }}>
                  <Search className="h-5 w-5" />
                </div>
                <div className="mt-1.5 bg-gray-900/85 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow max-w-[200px] truncate">
                  {searched.name}
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Participant pins */}
          {participants.map((p, i) => (
            <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={`${p.name} · ${p.meetupName}`}>
              <div className="group relative flex flex-col items-center">
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.meetupName}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1" />
                </div>
                <div className={`h-9 w-9 rounded-full ${PIN_BG[i % PIN_BG.length]} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {p.name[0].toUpperCase()}
                </div>
                <div className={`w-2 h-2 ${PIN_BG[i % PIN_BG.length]} rotate-45 -mt-1`} />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
