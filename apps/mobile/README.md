# KAZI Mobile

Flutter mobile application for the KAZI MVP.

## Scope

This app is intentionally scoped to mobile delivery:

- Android phones and tablets
- iPhone and iPad

The admin dashboard remains a separate web application in the monorepo.

## Local Validation

Use the selected Puro-managed Flutter SDK for local checks:

```powershell
$flutter = 'C:\Users\nkazi\.puro\envs\stable\flutter\bin\flutter.bat'
Set-Location 'c:\Users\nkazi\OneDrive\Desktop\kazi\apps\mobile'
& $flutter pub get
& $flutter analyze
& $flutter test
```

## Runtime Targets

For this repository, mobile runtime validation should be done against Android and iOS device classes. Responsive behavior inside the app should cover:

- small Android phones
- larger Android phones
- Android tablets
- iPhone sizes
- iPad sizes
