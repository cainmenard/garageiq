# GarageIQ

DIY vehicle maintenance tracker for enthusiasts who wrench on their own cars.

## Features

- **Dashboard** — Health score, DIY vs dealer savings chart, upcoming services, active diagnostic codes
- **Timeline** — Visual maintenance history with future projections based on driving patterns
- **Service Planner** — Prioritized batches: what to do this weekend vs. by 80k vs. long-term
- **Interval Tracker** — 20 service intervals with progress bars, mileage projections, and direct service logging
- **Diagnostic Codes** — Full code database with repair guides, severity ratings, root cause analysis
- **Step-by-Step Guides** — Checkable walkthrough steps with inline torque specs and parts lists
- **MechanicAI** — Context-aware chatbot with vehicle-specific knowledge
- **Torque Spec Reference** — Searchable table of every fastener spec

## Current Vehicle

2017 Audi Q5 2.0T quattro Premium "Midnight" — 64,716 miles

## Tech Stack

- React 18 + Vite
- Tailwind-style CSS (inline custom properties)
- Single-file architecture (no backend yet)

## Development

```bash
npm install
npm run dev
```

## Deploy

Connected to Vercel — pushes to `main` auto-deploy.

## Roadmap

- [ ] Persistence (Vercel KV or Supabase)
- [ ] Multi-user auth
- [ ] Multi-vehicle garage
- [ ] Community deployment (Tacoma World)
