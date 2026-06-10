# CarbonWise 🌿
### Personal Carbon Footprint Tracker — Google Prompt Wars 2026 Submission

> **Problem Statement:** Help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

---

## 14 Feature Slots Implemented

| # | Slot | Implementation |
|---|---|---|
| 1 | Personal Calculator | Transport + electricity + diet + flights + shopping → tCO₂e/yr |
| 2 | Daily Tracker | Firebase Realtime DB — log eco-actions with real kg CO₂ savings |
| 3 | AI Advisor | Gemini #1 — personalized reduction plan from your calculator inputs |
| 4 | AI Chat | Gemini #2 — WhatsApp-style climate Q&A with voice input |
| 5 | Dashboard | PieChart + ColumnChart + BarChart (Google Charts) |
| 6 | GeoChart | India per-capita CO₂ by state (`region:'IN'`, `resolution:'provinces'`) |
| 7 | Quiz | 3 levels × 5 questions with explanations (Easy / Medium / Hard) |
| 8 | Leaderboard | Firebase `onValue` live community CO₂ savers board |
| 9 | Education Hub | 6 action cards with verified impact numbers + official resource links |
| 10 | Glossary | 8 carbon terms with bilingual EN/HI headings |
| 11 | Timeline | India net-zero journey 2015–2070, scroll-animated |
| 12 | Countdown | Live countdown to next real climate event (World Env Day / COP31) |
| 13 | Comparison | Your footprint vs India avg (1.9t) vs World avg (4.7t) vs 1.5°C target (2.3t) |
| 14 | GA4 Events | `gaEvent()` on calculate, log_action, quiz_complete, chat_send, plan_generated |

---

## 7 Google Services

| # | Service | Integration |
|---|---|---|
| 1 | **Gemini 2.5 Flash** | AI Advisor (slot 3) + AI Chat (slot 4) — dual Gemini features |
| 2 | **Google Fonts** | Playfair Display + Inter + Noto Sans Devanagari (bilingual) |
| 3 | **Material Symbols** | Icons throughout UI (nav, buttons, actions) |
| 4 | **Google Charts** | PieChart + ColumnChart + Bar chart in Dashboard |
| 5 | **GeoChart** | India provinces map with per-state CO₂ data |
| 6 | **Firebase Realtime DB** | Live leaderboard + daily action tracker (SDK 10.8.0) |
| 7 | **Google Analytics 4** | Async gtag.js + `gaEvent()` on all major interactions |

---

## Setup

### 1. Gemini API Key (required for AI features)
- Get a free key from [Google AI Studio](https://aistudio.google.com)
- Enter it at runtime in the **AI Advisor** or **Chat** key field — never hardcoded

### 2. Firebase (optional — enables live leaderboard)
Replace the placeholder `CONFIG.firebase` block in `index.html`:
```js
var CONFIG = {
  firebase: {
    apiKey:            'YOUR_REAL_KEY',
    authDomain:        'your-project.firebaseapp.com',
    databaseURL:       'https://your-project-default-rtdb.firebaseio.com',
    projectId:         'your-project',
    storageBucket:     'your-project.appspot.com',
    messagingSenderId: '123456789000',
    appId:             '1:123456789000:web:abcdef'
  }
}
```
Firebase Database Rules:
```json
{ "rules": { "leaderboard": { ".read": true, ".write": true } } }
```
Without Firebase, the leaderboard shows an offline message — all other features work fully.

### 3. Google Analytics (optional)
Replace `G-XXXXXXXXXX` with your real GA4 Measurement ID in two places in `index.html`.

---

## Running Tests
```bash
node test.js
# ✅ ALL 232 TESTS PASSED — Ready for submission!
```
Zero npm dependencies. Tests cover all 12 groups: Gemini API, Security/XSS, Fonts, Charts, GeoChart, Firebase, GA4, Multilingual, Quiz Engine, Domain Logic (pure functions), API Payload, Named Constants.

---

## Data Sources
| Metric | Value | Source |
|---|---|---|
| Car emission factor | 0.171 kg CO₂e/km | DEFRA 2023 |
| Motorbike factor | 0.083 kg CO₂e/km | DEFRA 2023 |
| India grid intensity | 0.82 kg CO₂e/kWh | CEA India 2023 |
| Domestic flight | 0.255 t CO₂e/flight | ICAO 2023 |
| E-commerce order | 0.005 t CO₂e/order | WRAP 2023 |
| Vegan diet | 0.5 t CO₂e/yr | Oxford 2023 |
| Vegetarian diet | 0.9 t CO₂e/yr | Oxford 2023 |
| India per-capita | 1.9 t CO₂e/yr | IEA 2023 |
| World per-capita | 4.7 t CO₂e/yr | IEA 2023 |
| 1.5°C target | 2.3 t CO₂e/yr | IPCC AR6 2023 |

---

## Accessibility Statement
- Skip-to-main link as first body element
- Full keyboard navigation (tabindex, Enter/Space handlers)
- ARIA roles: `navigation`, `main`, `alert`, `radiogroup`, `listitem`, `banner`
- `aria-pressed`, `aria-selected`, `aria-label`, `aria-live` throughout
- High-contrast mode toggle (CSS `body.hc`)
- Font size controls (12px–22px range)
- `prefers-reduced-motion` media query disables animations
- `<noscript>` fallback message
- Color never the only signal (icons + text accompany all states)
- All form inputs have associated `<label for>`

## Security Notes
- API key stored in `S.key` (memory only) — never `localStorage` or `sessionStorage`
- `sanitize()` applied to ALL user input and ALL Gemini API responses before `innerHTML`
- `encodeURIComponent()` applied to API key in fetch URL
- Gemini safety settings: `BLOCK_MEDIUM_AND_ABOVE` for harassment, hate speech, dangerous content
- Firebase placeholder detection prevents accidental misconfigured calls
- All external links use `rel="noopener noreferrer"`
- All external URLs use `https://`

## Architecture
```
index.html (single file, ~2200 lines)
├── CSS — design tokens in :root, 16 named sections
├── HTML — semantic header/nav/main/section/article/footer
└── JS (1560 lines, 33 numbered sections)
    ├── Constants & CONFIG (all magic numbers named)
    ├── State: S = {} (zero loose globals)
    ├── Helpers: el(), setHTML(), on()
    ├── Pure functions: calcFootprint(), getDietTonnes(), getFpRating()
    ├── UI: Calculator → Tracker → Advisor → Chat → Charts → Quiz → Leaderboard
    └── Bootstrap: init() on DOMContentLoaded
```
