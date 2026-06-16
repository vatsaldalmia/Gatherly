
# Gatherly Collaborative Upgrade

Extends the existing Gatherly app (no redesign) with a real shareable meetup flow, Google Maps-powered location capture, a host dashboard, and group voting. All new screens reuse the current Indigo/Mint design system, sidebar, topbar, cards, and `FairnessScore` widget.

## What gets added

### 1. Shared state (frontend-only, localStorage)
New `src/lib/meetup-store.ts`:
- Types: `Participant { id, name, lat, lng, address, transport, joinedAt }`, `MeetupRecord { id, name, type, hostName, createdAt, status, participants, votes: Record<areaId, participantId[]> }`
- CRUD helpers backed by `localStorage` key `gatherly:meetups`
- Tiny pub/sub (`subscribe` + `useMeetup(id)` hook) so host dashboard updates live across tabs (storage event)
- Seeded with existing dummy meetups on first load so current Meetups list keeps working

### 2. Create → Share confirmation
Update `_app.meetups.create.tsx` submit handler:
- Generate `id = nanoid(8)` (already-installed? else simple random), persist via store, navigate to `/meetups/$id` with `?created=1`
- On results page, when `?created=1`, show a **"Meetup created" success modal** (shadcn `Dialog`) with:
  - Shareable URL `${window.location.origin}/meetup/{id}`
  - Copy Link button (clipboard + toast)
  - Share via WhatsApp (`https://wa.me/?text=...`)
  - Open Meetup button (closes modal)

### 3. Public participant join route
New `src/routes/meetup.$id.tsx` (public, outside `_app` so no sidebar — uses simple centered layout matching `auth-shell` styling):
- Header: meetup name, host name, member avatars
- Form: Name, Location (Google Places Autocomplete + "📍 Use Current Location" button), Transport select (Walking/Bike/Car/Taxi/Metro/Train/Bus with lucide icons)
- Embedded Google Map showing current pin (draggable marker, click-to-place)
- On submit: append participant via store, show "You're in!" confirmation with link back to results
- Already-joined detection via `localStorage` key `gatherly:me:{meetupId}`

### 4. Google Maps integration
Uses the **Google Maps Platform connector** (browser key `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`):
- `src/lib/google-maps-loader.ts`: singleton async loader with `loading=async&callback=` pattern, channel = tracking ID
- `src/components/location-picker.tsx`: reusable component wrapping
  - `PlaceAutocompleteElement` (Places API New) for search
  - `google.maps.Map` + draggable `google.maps.Marker`
  - Geolocation button → reverse geocode via gateway (`/maps/api/geocode/json?latlng=`) through a small server function `src/lib/maps.functions.ts` (`reverseGeocode({ lat, lng })`) so the secret key stays server-side
- Graceful fallback if connector not linked: shows manual address `Input` + warning toast
- I'll check `standard_connectors--list_connections` first; if Google Maps isn't linked, prompt user to connect before relying on it. Map UI degrades to address-only input until linked.

### 5. Host dashboard (results page upgrade)
Rework `_app.meetups.$id.tsx` (keep existing layout/shell):
- **Status pill**: Waiting for Participants → Ready for Calculation (≥2) → Voting in Progress → Finalized
- **Participants panel**: list with ✅ joined / ⏳ pending, transport icon, distance preview
- **Share card** (always visible): link + Copy + WhatsApp
- **Map**: shows all participant markers + recommended area markers
- **"Find Best Area" button**: disabled until ≥2 participants; clicking flips status to "Voting in Progress" and reveals recommendation cards
- **Recommendation cards** (reuse `areas` dummy data, sorted by fairness): Area Name, `FairnessScore`, avg travel time, avg distance, **Vote** + **View Venues** buttons
- **Voting tally**: live count, "Current winner" highlight, "Finalize" button → status Finalized

### 6. Venue discovery wiring
Existing `_app.venues.tsx` already covers categories; add a `?area=` filter so "View Venues" from a recommendation deep-links into filtered venues. Add Parks/Coworking/Activities filters if missing (the dummy data already has them — just expose in the filter chip list).

### 7. Mobile polish
- Join route is mobile-first (single column, sticky CTA)
- Share modal uses `Drawer` on `useIsMobile`
- WhatsApp button prominent on mobile

## Technical details

- **Routing**: TanStack file-based. New files: `src/routes/meetup.$id.tsx` (public). Update `_app.meetups.$id.tsx`, `_app.meetups.create.tsx`, `_app.venues.tsx`.
- **State**: `localStorage` + tiny custom hook. No backend yet (matches "frontend MVP" framing).
- **Maps**: Browser key from connector for JS API + Places Autocomplete; server function via gateway for reverse geocoding (keeps secret server-side, complies with connector rules).
- **Server fn file**: `src/lib/maps.functions.ts` (client-safe path per server-function-authoring rule).
- **Deps**: no new npm packages (use native `crypto.randomUUID().slice(0,8)` for IDs; Google Maps types via `@types/google.maps` only if needed — will inline-type instead to avoid install).
- **Design tokens**: only existing utilities (`bg-gradient-primary`, `shadow-elegant`, `text-mint`, etc.). No hardcoded colors.

## Files

Created:
- `src/lib/meetup-store.ts`
- `src/lib/google-maps-loader.ts`
- `src/lib/maps.functions.ts`
- `src/components/location-picker.tsx`
- `src/components/share-meetup-dialog.tsx`
- `src/routes/meetup.$id.tsx`

Edited:
- `src/routes/_app.meetups.create.tsx` (persist + redirect with `?created=1`)
- `src/routes/_app.meetups.$id.tsx` (host dashboard, share, voting, recommendations gating)
- `src/routes/_app.meetups.tsx` (read from store, fallback to dummy)
- `src/routes/_app.venues.tsx` (accept `?area=` filter)

## Out of scope

- Real backend / auth-bound persistence (still localStorage)
- Real fairness math (uses placeholder formula on dummy areas)
- Push/email notifications

## First step before coding

Check whether the Google Maps Platform connector is linked. If not, I'll prompt you to connect it via the standard connectors tool before building the map-dependent pieces — the rest of the flow (share, join form, voting) works regardless.
