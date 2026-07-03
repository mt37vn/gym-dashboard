# Gym Dashboard

Personal gym-tracking analytics dashboard. Parses CSV exports from the StrengthLog app and visualises training volume, frequency, estimated 1RM progression, and strength level comparisons.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts
- PapaParse

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. Export your data from StrengthLog app as CSV
2. Drag & drop (or click to select) the CSV file on the upload area
3. The dashboard renders all sections automatically

## Build for Production

```bash
npm run build
```

The output goes to `dist/` — deployable to any static host (Vercel, Netlify, etc.).

## Data

The app expects a CSV with columns exported by StrengthLog. All processing happens client-side — no data is sent to any server.
