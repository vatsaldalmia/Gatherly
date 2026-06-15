import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const INDIA_ZOOM = 5;
const LOCAL_ZOOM = 11;

const INDIA_BOUNDS = {
  north: 37.5,
  south: 6.5,
  west: 68.0,
  east: 97.5,
};

function isWithinIndia({ lat, lng }: { lat: number; lng: number }) {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
}

function GeolocateUser() {
  const map = useMap();

  useEffect(() => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (!isWithinIndia(coords)) return;

        map.panTo(coords);
        map.setZoom(LOCAL_ZOOM);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [map]);

  return null;
}

export default function TestMap() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="w-full h-[600px]">
        <Map
          defaultCenter={INDIA_CENTER}
          defaultZoom={INDIA_ZOOM}
          restriction={{
            latLngBounds: INDIA_BOUNDS,
            strictBounds: false,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <GeolocateUser />
        </Map>
      </div>
    </APIProvider>
  );
}
