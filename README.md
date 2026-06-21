# Uttar Pradesh — Media Monitoring Dashboard

A production-ready **Media Monitoring & Intelligence Dashboard** for the Government of Uttar Pradesh, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Apache ECharts**, **TanStack Query** and **Zustand**.

It analyses media mentions collected from **YouTube**, **Twitter / X** and **Online news** sources, imported directly from an Excel workbook.

---

## ✨ Features

- **Government-grade UI** — clean white theme, UP maroon/saffron palette, responsive & mobile friendly.
- **Interactive UP District Map** (ECharts geo) — colour intensity by news volume, rich hover tooltips, click-to-drill-down.
- **Home / Overview** — 7 summary cards, district map, media-source pie, daily trend line, top districts & top profiles.
- **District Analytics** — searchable district picker, media-wise bar chart, media + sentiment analysis, summary cards and three feature-rich data tables (YouTube / Online / Twitter-X).
- **Data tables** — global & column search, sorting, pagination, **row virtualization**, column visibility toggle, row expansion, per-table sentiment/language filters, and **CSV + Excel export**.
- **MLA Directory** — searchable MLA dropdown, profile card, contact details, social links and performance analytics (radar + sentiment donut + KPI tiles).
- **Global filters** (all pages) — date range, district, media type, sentiment, language and keyword search, managed via Zustand and applied server-side.
- **Performance** — lazy-loaded charts, memoised aggregations, mtime-based Excel parse caching, virtualized tables, API caching headers and `TanStack Query` client cache.

---

## 🗂 Project Structure

```
data/
  media-data.xlsx              # ← place your Excel file here
public/geo/
  up-districts.geojson         # UP district boundaries (75 districts)
src/
  app/
    page.tsx                   # Home / Overview
    district/page.tsx          # District analytics
    mla/page.tsx               # MLA directory
    api/
      dashboard/route.ts       # GET /api/dashboard
      district/route.ts        # GET /api/district?district=
      media/route.ts           # GET /api/media?district=&mediaType=
      mla/route.ts             # GET /api/mla
      filters/route.ts         # GET /api/filters (dropdown options)
    layout.tsx, providers.tsx, globals.css
  components/
    charts/   tables/   filters/   layout/   cards/   common/   home/   ui/
  services/analytics.ts        # aggregation & analytics
  lib/excel-parser.ts          # Excel read / normalize / filter (cached)
  lib/types.ts, lib/utils.ts, lib/api-client.ts, lib/api-helpers.ts
  store/filters.ts             # Zustand global filter store
  data/mlas.ts                 # 15 dummy MLA records
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Ensure the Excel file is present at:
#    data/media-data.xlsx
#    (the app reads the sheet named "mentions", or the first sheet)

# 3. Run the development server
npm run dev
# → http://localhost:3000

# Production
npm run build && npm start
```

> The application runs **immediately** after placing `data/media-data.xlsx` — no code changes required.

---

## 📊 Excel → Data Mapping

| Excel column | Used as | Notes |
|---|---|---|
| `Channel` | **Media Type** | `Youtube → YouTube`, `Twitter → X`, `Web`/`Reddit`/other → `Online` |
| `Keyword` | **District** | Leading token before `+` (e.g. `Lucknow +BJP,…` → `Lucknow`) |
| `Title` | **Headline** | Falls back to a trimmed `Content` snippet when empty |
| `Sentiment` | **Sentiment** | Normalised to `Positive` / `Negative` / `Neutral` |
| `Date` | **Date** | Excel serial / date cell → ISO date |
| `Content`, `Link`, `Language`, `Profile`, … | as-is | |

`Kanpur` is mapped to the GeoJSON name `Kanpur Nagar` for the map.

---

## 🔌 API Reference

| Endpoint | Query params | Returns |
|---|---|---|
| `GET /api/dashboard` | global filters | totals, district summary, media distribution, daily trend, top districts/profiles/channels, language distribution |
| `GET /api/district` | `district` (+ filters) | sentiment, media, media×sentiment, daily trend, top profiles |
| `GET /api/media` | `district`, `mediaType` (+ filters) | filtered media records |
| `GET /api/mla` | optional `id` | MLA list or single MLA |
| `GET /api/filters` | — | distinct districts & languages |

All accept the shared global filters: `dateFrom`, `dateTo`, `district`, `mediaType`, `sentiment`, `language`, `search`.

---

## 🛠 Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Apache ECharts + echarts-for-react · shadcn-style Radix UI components · TanStack Query · TanStack Virtual · Zustand · xlsx / exceljs · date-fns · lucide-react · react-icons.
# up-Gov
