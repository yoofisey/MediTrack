# Mobile CI/CD setup guide

Codemagic builds the Adhera mobile app. The web app itself is remote-hosted
(`https://www.useadhera.com`), so CI only packages a native shell that loads
that URL. Nothing about the release pipeline depends on your local machine —
everything runs on Codemagic's macOS VMs.

## Codemagic secret groups

Create these groups in Codemagic (App settings → Environment variables →
Global or Application variables). A *group* is just a name shared by several
variables; Codemagic has a "New group" picker when adding variables.

### `android_keystore` — signs the Play Store build

One-time, on a local machine (must not be committed to git):

```powershell
keytool -genkey -v -keystore adhera-release.jks -alias adhera \
  -keyalg RSA -keysize 2048 -validity 10000 -storetype JKS
```

Then encode for Codemagic:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\adhera-release.jks")) | Set-Content keystore.b64
```

| Variable | Value |
| --- | --- |
| `KEYSTORE_BASE64` | contents of `keystore.b64` |
| `KEYSTORE_PASSWORD` | the `-storepass` you set |
| `KEY_ALIAS` | `adhera` (or whatever alias you chose) |
| `KEY_PASSWORD` | the key password you set |

Back up the `.jks` file somewhere safe (password manager / USB). If lost, you
cannot update the app on the Play Store.

### `google_services` — enables FCM push (Android + iOS)

- Android: the file `android/app/google-services.json` from this repo. In
  Codemagic set `GOOGLE_SERVICES_JSON` to its **full contents** (paste the
  JSON text, not a path).
- iOS push (through FCM) additionally needs an **APNs Auth Key**:
  Firebase console → Project settings → Cloud Messaging → Apple app
  configuration → *APNs Authentication Key*. Upload the `.p8` file there. This
  is done in Firebase, not Codemagic.

### `appstore_connect` — iOS signing + TestFlight upload

1. In Apple Developer portal → Users & Access → Integrations, generate an
   **App Store Connect API key** (App Manager role).
2. Download the `.p8` private key (shown once) and note the **Key ID**.
3. Your **Issuer ID** is on the same page.

| Variable | Value |
| --- | --- |
| `APP_STORE_CONNECT_PRIVATE_KEY` | contents of the `.p8` file |
| `APP_STORE_CONNECT_KEY_ID` | the key's ID |
| `APP_STORE_CONNECT_ISSUER_ID` | your team's issuer ID |

Prerequisites in the Apple Developer portal (one-time, $99/yr membership):
- Bundle ID `com.useadhera.app` registered.
- The app record created in App Store Connect.

## First run

1. Commit and push `codemagic.yaml`, then push a tag or merge to `main` and
   open the repo in Codemagic (Settings → Integrations → GitHub).
2. Add the three secret groups above to the app.
3. Replace `CI_EMAIL_RECIPIENT` in `codemagic.yaml` with your email.
4. Trigger the `android-release` workflow. Download the AAB from the artifacts
   tab. Verify the APK installs on a device.

## Uploading to the stores

### Google Play (manual first time)
1. Create a Play Console app with package name `com.useadhera.app`.
2. Upload the `.aab` from the `android-release` build in **Testing →
   Internal testing**, add testers, review release notes.
3. Once an internal build is approved, promote through Closed → Open → Production.

For fully automated uploads, create a Google Play service account in Play
Console → Users & permissions → API access, download its JSON, and add it as
`GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`, then uncomment the `google_play` block
in `codemagic.yaml` (`track: internal`, `submit_as: draft`).

### App Store / TestFlight
Uncomment the `app_store_connect` publishing block in `codemagic.yaml`
(`submit_to_testflight: true`) to auto-upload each iOS build. First archive
can also be uploaded manually from the `ios-release` artifacts via
Transporter.

## Versioning

`android/app/build.gradle` → `versionCode` / `versionName` (Android) and
`ios/App/App.xcodeproj` → `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
(iOS) bump manually before each release. Every upload must use a higher
version than the last.

## Signing facts
- Android: `android/app/build.gradle` reads `android/keystore.properties` if
  present (CI writes it from secrets; local builds without the file simply
  produce an unsigned release, which is fine for debug/dev).
- iOS: automatic signing via the App Store Connect API key; `autoVerify`
  app links for `useadhera.com` require a production build uploaded from a
  real Apple account to validate.
