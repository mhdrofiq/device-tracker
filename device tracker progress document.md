this document is to record all changes that are made to the system during development in chronological order so that it may be read by claude code as context.

---

## Phase 1 — Project Scaffolding
**Date:** 2026-05-09

- Initialized Vite + React 19 + TypeScript project (already present in `frontend/`)
- Installed runtime dependencies: `react-router-dom`, `@react-oauth/google`, `html5-qrcode`, `qrcode.react`
- Installed dev dependencies: `tailwindcss`, `@tailwindcss/vite`
- Configured Tailwind CSS v4 via the `@tailwindcss/vite` plugin in `vite.config.ts`
- Replaced boilerplate `index.css` with Tailwind import and a minimal reset
- Cleared `App.css` and replaced `App.tsx` with a blank placeholder
- Created `src/` subdirectory structure: `types/`, `config/`, `context/`, `hooks/`, `services/`, `components/`, `pages/`
- Created `.env.example` with `VITE_GAS_URL` and `VITE_GOOGLE_CLIENT_ID` placeholders

---

## Phase 2 — Types & Config
**Date:** 2026-05-09

- Created `src/types/pc.types.ts`: defines `PC`, `PCUpdatePayload`, `PCHistory`, and the `PCStatus`, `PCClassification`, `PCCategory` union types
- Created `src/types/user.types.ts`: defines `GoogleUser` (populated from Google OAuth token) and `Employee` (fetched from Employees sheet)
- Created `src/config/dropdownConfig.ts`: defines `DropdownLevel` and `DropdownOption` interfaces and the full 6-level cascading dropdown configuration (currentUser → status → classification → location → purpose → category). Option values are placeholders pending stakeholder confirmation.
- Added header comments to all three files describing their purpose and role in the system