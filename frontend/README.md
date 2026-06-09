# Cheonan Insight Frontend

React + Vite dashboard frontend for the Cheonan community sentiment and lifestyle information service.

## Production

- Dashboard: https://ch.xmin.io/
- API: https://cheonan-api.xmincloud.com
- Hosting: Cloudflare Pages (`software-engineering`)

## Current UI

- Figma-inspired dashboard layout with a dark gradient sidebar and Cheonan Insight brand panel.
- Main tabs: dashboard, `맛집 · 카페`, tourism, youth, college, jobs, family.
- Expanded lifestyle tabs: accessibility, high-school, medical/pharmacy, foreign-life, single-household.
- Top-right controls: favorites, notifications, language, font size, widgets.
- Favorites dropdown actions open modals before navigating to the target section.

## Local Development

```bash
npm install
npm run dev
```

Local `.env` may point to `http://127.0.0.1:8000` for backend development.

## Production Build

Always pass the production API URL when building a deployable bundle:

```bash
VITE_API_URL=https://cheonan-api.xmincloud.com npm run build
```

## Verification

```bash
npm run lint
npm run build
```
