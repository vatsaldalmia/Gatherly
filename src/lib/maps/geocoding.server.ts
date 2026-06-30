// Server-side only. GOOGLE_MAPS_API_KEY stays private.

type GeocodeResult = { lat: number; lng: number } | null;

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (json.status !== "OK" || json.results.length === 0) return null;
  return json.results[0].geometry.location;
}

export async function geocodeByPlaceId(placeId: string): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${key}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (json.status !== "OK" || json.results.length === 0) return null;
  return json.results[0].geometry.location;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=neighborhood|sublocality|locality&key=${key}`;
  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ formatted_address: string; address_components: Array<{ long_name: string; types: string[] }> }>;
  };
  if (json.status !== "OK" || json.results.length === 0) return null;

  // Prefer the neighbourhood or sublocality name over the full address
  const result = json.results[0];
  const neighbourhood = result.address_components.find(
    (c) => c.types.includes("neighborhood") || c.types.includes("sublocality_level_1"),
  );
  return neighbourhood?.long_name ?? result.formatted_address;
}
