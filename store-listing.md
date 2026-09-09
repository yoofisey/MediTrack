# Store Listing Metadata — Adhera (MediTrack)

> Use this document when filling in Play Console and App Store Connect.

---

## Google Play Store

### Short Description (80 chars max)
Track medications, log doses, and build healthy adherence habits.

### Full Description (4000 chars max)
Adhera helps you stay on top of your medication schedule with smart reminders, dose tracking, and health insights.

**Key Features:**
- Smart medication reminders that adapt to your schedule
- One-tap dose logging with journal notes
- Detailed adherence reports and streak tracking
- Health vitals tracking (blood pressure, weight, glucose, heart rate, temperature, SpO2)
- Family sharing to help loved ones stay on track
- Medical ID card for emergency information
- Offline support — works without internet
- End-to-end encrypted health data
- Dark mode and customizable themes

Perfect for managing long-term medications, complex dosing schedules, or helping family members remember their doses.

**Privacy First:** Your health data is encrypted in transit and at rest. We never share or sell your information.

### Promo Text (for store updates)
Never miss a dose again.

### Category
Medical

### Tags
medication tracker, pill reminder, health, adherence, medicine

### App Icon
- 512x512 PNG (upload to Play Console listing)
- Generated: `store/icon-512.png` (full-bleed, no alpha)

### Feature Graphic
- 1024x500 PNG (no alpha channel)
- Generated: `store/feature-graphic.png` (regenerate with `npm run gen:store-assets`)

### Screenshots
- 2-8 phone screenshots (min 320px, max 3840px wide)
- 2-8 tablet screenshots (optional but recommended)
- Show: today's dose list, dose logging, medication list, reports

---

## Apple App Store

### App Name
Adhera

### Subtitle (30 chars max)
Smart medication tracker

### Privacy Policy URL
https://www.useadhera.com/privacy

### Support URL
https://www.useadhera.com/

### Marketing URL (Optional)
https://useadhera.com

### Keywords
medication,pill,reminder,health,tracker,medicine,dose,adherence

### Description
Same as Play Store full description.

### Screenshots
- 6.5" iPhone: 1-10 screenshots (1242×2688 or 1290×2796)
- 5.5" iPhone: 1-10 screenshots (1242×2208)
- iPad (optional): 1-10 screenshots (2048×2732, 2048×1536, or 2224×1668)

### App Icon
- 1024x1024 PNG (no transparency)
- Generated: `store/icon-1024.png`
- Upload in App Store Connect

### Age Rating
- 17+ (unrestricted web access, medical information)
- Or 4+ with "No" to all restricted categories

---

## Preparation Checklist

### Before Play Store Submission
- [ ] Feature graphic (1024x500) uploaded
- [ ] Phone screenshots (2-8) uploaded
- [ ] App icon (512x512) uploaded
- [ ] Short and full description filled in
- [ ] Categorization: Medical
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL set to https://useadhera.com/privacy
- [ ] App releases: signed AAB uploaded (via Codemagic)

### Before App Store Submission
- [ ] App icon (1024x1024) uploaded in App Store Connect
- [ ] Screenshots (6.5" and 5.5") uploaded
- [ ] App name, subtitle, keywords filled in
- [ ] Description filled in
- [ ] Support URL and privacy policy URL set
- [ ] App Store Connect > Pricing: set availability
- [ ] Export Compliance: NO (uses encryption, but falls under exemptions)
- [ ] Content Rights: confirm you own all screenshot content
- [ ] Build uploaded via Codemagic (iOS workflow)

---

## Assets Needed (External/Creative)

| Asset | Size | Format | Where to Upload | Source |
|-------|------|--------|-----------------|--------|
| Feature Graphic | 1024×500 | PNG (no alpha) | Play Console | `store/feature-graphic.png` |
| Phone Screenshots | 1242×2688+ | PNG/JPG | Play Console + App Store Connect | You (on-device) |
| iPad Screenshots | 2048×2732+ | PNG/JPG | App Store Connect (optional) | You (on-device) |
| Promo Video | Any | M4V/MP4 | Both stores (optional) | You |
| App Icon (Play) | 512×512 | PNG | Play Console | `store/icon-512.png` |
| App Icon (iOS) | 1024×1024 | PNG (no alpha) | App Store Connect | `store/icon-1024.png` |

> Note: The app binary icon is embedded in the APK/IPA (already configured).
> The store listing icons are uploaded separately to each console.
