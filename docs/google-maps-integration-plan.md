# KAZI Google Maps Integration Plan

This plan maps Google Maps integration onto the current KAZI codebase. The goal is to improve address entry, geocoding, ETA accuracy, and live tracking UX without replacing the existing booking model.

## Recommendation

Do not integrate Uber into KAZI.

`Uber-style` in the brief should be implemented as:

- fast booking flow
- strong location search
- reliable provider tracking
- route and ETA support
- clean customer and provider mobile experience

For this repo, the correct integration is Google Maps APIs plus the current KAZI booking and dispatch logic.

## Current Location Surface In The Repo

The current code already supports the right data model for a first Google Maps integration:

- booking address text is already sent from mobile in [apps/mobile/lib/app_api.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\app_api.dart)
- booking latitude and longitude already exist in [apps/api/src/modules/bookings/entities/booking.entity.ts](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\api\src\modules\bookings\entities\booking.entity.ts)
- provider live coordinates already exist in [apps/api/src/modules/bookings/bookings.service.ts](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\api\src\modules\bookings\bookings.service.ts)
- the mobile app already sends provider tracking updates through [apps/mobile/lib/app_api.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\app_api.dart)
- the mobile app currently opens a Google Maps URL fallback from [apps/mobile/lib/main.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\main.dart)
- a Google Maps API key is already anticipated in [apps/api/src/config/app.config.ts](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\api\src\config\app.config.ts)

That means the integration should extend existing fields and flows, not redesign them.

## Best MVP Integration Order

### Phase 1: Address Search And Geocoding

Add Google Places Autocomplete and Geocoding so customers pick a real address instead of typing free text only.

Why first:

- it improves booking quality immediately
- it reduces bad addresses for Johannesburg jobs
- it makes later ETA and routing much more accurate

Backend touchpoints:

- add a small maps module in `apps/api/src/modules/maps`
- add endpoints for place autocomplete and place details or geocode lookup
- keep the Google key on the API side so the mobile app does not call Google directly for server-controlled requests

Mobile touchpoints:

- replace the plain address field in the booking sheet inside [apps/mobile/lib/main.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\main.dart) with a searchable address picker
- extend booking creation in [apps/mobile/lib/app_api.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\app_api.dart) to send `customerLat` and `customerLng` as well as `customerAddress`

Data shape:

- continue storing `customerAddress`
- always populate `customerLat`
- always populate `customerLng`

### Phase 2: Embedded Customer Tracking Map

Replace the current open-map fallback with an embedded map view in the Flutter app.

Why second:

- the provider tracking data already exists
- this turns the current tracking flow into a stronger product experience without changing the API much

Mobile touchpoints:

- add a map screen or modal for active bookings in [apps/mobile/lib/main.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\main.dart)
- render the customer pin and provider pin
- keep the current `openTrackingMap` behavior as a fallback if the embedded map cannot load

Recommended Flutter package direction:

- `google_maps_flutter` for Android and iPhone map rendering

Use existing API fields:

- `customerLat`
- `customerLng`
- `providerCurrentLat`
- `providerCurrentLng`
- `providerLocationUpdatedAt`

### Phase 3: ETA And Route Intelligence

Add route distance and ETA using Google Directions or Routes API.

Why third:

- this is useful but not required for the first embedded map release
- it depends on stable origin and destination coordinates from phase 1

Backend touchpoints:

- add a route calculation service in the maps module
- calculate provider-to-customer ETA for active bookings
- optionally cache route responses briefly to control API cost

UI touchpoints:

- show ETA on booking cards and tracking screen
- show route freshness based on `providerLocationUpdatedAt`

### Phase 4: Provider-Side Address Selection And Better Routing

Only after customer-side improvements are stable:

- add provider route launch to Google Maps navigation intent
- optionally show provider route preview in-app
- optionally use Places for provider service area setup during onboarding

## What To Change In This Repo

### Backend

Create a maps module:

- `apps/api/src/modules/maps/maps.module.ts`
- `apps/api/src/modules/maps/maps.controller.ts`
- `apps/api/src/modules/maps/maps.service.ts`

Suggested endpoints:

- `GET /api/v1/maps/places/autocomplete?input=...`
- `GET /api/v1/maps/places/:placeId`
- `GET /api/v1/maps/geocode?address=...`
- `GET /api/v1/maps/routes?originLat=...&originLng=...&destinationLat=...&destinationLng=...`

Extend booking creation payload handling if not already wired through the controller and DTO chain:

- accept `customerLat`
- accept `customerLng`

Configuration:

- continue using `GOOGLE_MAPS_API_KEY`
- if needed later, add `GOOGLE_MAPS_ANDROID_API_KEY` and `GOOGLE_MAPS_IOS_API_KEY` for mobile SDK setup

### Mobile

Update the booking request flow:

- in [apps/mobile/lib/main.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\main.dart), replace the plain service address input with a place search flow
- in [apps/mobile/lib/app_api.dart](c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile\lib\app_api.dart), extend `createBooking` to submit `customerLat` and `customerLng`

Update tracking UX:

- keep the current polling loop and tracking API call
- replace the current map-launch-only customer experience with embedded map rendering for active bookings
- keep external Google Maps open as a fallback action

Suggested mobile packages:

- `google_maps_flutter`
- optionally a place autocomplete helper package, or use your own API-backed suggestion list

## Best Architecture Choice

For KAZI, the cleanest architecture is:

- Google Places and Geocoding via the backend for controlled search and normalized addresses
- Google Maps SDK in mobile for embedded map display
- KAZI backend remains the source of truth for bookings, providers, and tracking state

That keeps the product scalable and avoids binding core marketplace behavior to an outside transport platform.

## Cost And Scope Impact

Google Maps should be treated as an incremental enhancement, not a rewrite.

Expected engineering impact from current repo state:

- phase 1 and phase 2 together: roughly 2 to 5 focused days
- phase 3 ETA and routing polish: another 1 to 3 days

API usage cost depends on search, geocoding, and route volume, but it is usually manageable for an MVP if you:

- debounce autocomplete requests
- avoid unnecessary route recalculations
- cache short-lived route responses for active bookings

## Launch Recommendation

Best practical path:

1. Do not integrate Uber.
2. Add Google Places autocomplete plus geocoding first.
3. Add embedded Google Maps tracking second.
4. Add ETA and route polish third.

That gives KAZI the `Uber-style` experience the brief is aiming for while staying aligned with the current repo and the Johannesburg services-marketplace use case.