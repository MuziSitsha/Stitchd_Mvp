# KAZI App

Flutter application for the KAZI MVP across phone, tablet, browser, and desktop form factors.

## Scope

This app is now structured for cross-platform delivery:

- Android phones and tablets
- iPhone and iPad
- Web browsers on laptops and tablets
- Desktop runners for Windows, macOS, and Linux

The admin dashboard remains a separate web application in the monorepo.

## Local Validation

Use the selected Puro-managed Flutter SDK for local checks:

```powershell
$flutter = 'C:\Users\nkazi\.puro\envs\stable\flutter\bin\flutter.bat'
Set-Location 'c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile'
& $flutter pub get
& $flutter analyze
& $flutter test
& $flutter build web
```

## Runtime Targets

Responsive behavior inside the app should cover:

- small Android phones
- larger Android phones
- Android tablets
- iPhone sizes
- iPad sizes
- browser windows on laptops
- larger desktop viewports

## Delivery Notes

- Customer and provider journeys share the same Flutter codebase.
- The admin dashboard remains the dedicated browser-first operations console under `apps/admin`.
- For local web and desktop testing, pass a reachable API base URL with `--dart-define=KAZI_API_BASE_URL=...` when the backend is not on the same host as the client.
