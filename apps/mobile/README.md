# STITCHD App

Flutter application for the STITCHD customer and provider MVP on Android and iPhone.

## Scope

This app is currently focused on the launch MVP surfaces required by the brief:

- Android phones and tablets
- iPhone and iPad

The admin dashboard remains a separate web application in the monorepo.

## Local Validation

Use the selected Puro-managed Flutter SDK for local checks:

```powershell
$flutter = 'C:\Users\nkazi\.puro\envs\stable\flutter\bin\flutter.bat'
Set-Location $PSScriptRoot
& $flutter pub get
& $flutter analyze
& $flutter test
```

## Fresh Web Preview

Use the repo-level preview command when you want a rebuilt Flutter web bundle served with cache-disabled headers:

```powershell
Set-Location (Resolve-Path "$PSScriptRoot\..\..")
corepack yarn preview:mobile:web
```

Default behavior:

- rebuilds `apps/mobile/build/web`
- passes `STITCHD_API_BASE_URL=http://127.0.0.1:3002/api/v1`
- serves the bundle on `http://127.0.0.1:8082/`
- sends `no-store` cache headers to avoid stale service-worker-style preview issues

Optional direct usage:

```powershell
Set-Location $PSScriptRoot
py -3 .\tool\preview_web_build.py --skip-build --port 8083
py -3 .\tool\preview_web_build.py --api-base-url=https://your-api.example.com/api/v1 --port 8084
```

## Runtime Configuration

Use `--dart-define` values when testing against a reachable backend or when preparing Firebase push:

```powershell
$flutter = 'C:\Users\nkazi\.puro\envs\stable\flutter\bin\flutter.bat'
Set-Location $PSScriptRoot
& $flutter run \
	--dart-define=STITCHD_API_BASE_URL=https://your-api.example.com/api/v1 \
	--dart-define=STITCHD_PAYMENT_RETURN_URL=https://your-api.example.com/api/v1/payments/checkout/result \
	--dart-define=FIREBASE_API_KEY=... \
	--dart-define=FIREBASE_PROJECT_ID=... \
	--dart-define=FIREBASE_MESSAGING_SENDER_ID=... \
	--dart-define=FIREBASE_STORAGE_BUCKET=... \
	--dart-define=FIREBASE_ANDROID_APP_ID=... \
	--dart-define=FIREBASE_IOS_APP_ID=... \
	--dart-define=FIREBASE_IOS_BUNDLE_ID=...
```

## Runtime Targets

Responsive behavior inside the app should cover:

- small Android phones
- larger Android phones
- Android tablets
- iPhone sizes
- iPad sizes

## Delivery Notes

- Customer and provider journeys share the same Flutter codebase.
- The admin dashboard remains the dedicated browser-first operations console under `apps/admin`.
- Hosted checkout opens in the external browser, then returns to the backend checkout result page unless you override it with `STITCHD_PAYMENT_RETURN_URL`.
- Firebase push wiring is in place, but real device delivery still depends on valid Firebase project credentials.
