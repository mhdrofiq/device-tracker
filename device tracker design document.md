# DESIGN.md — PC Device QR Management System

## Table of Contents

1. Project Overview
2. Tech Stack
3. Architecture Overview
4. Project Structure
5. TypeScript Types
6. Configuration
7. Authentication Flow
8. Frontend — Pages
9. Frontend — Components
10. Frontend — Hooks
11. Frontend — Services
12. Backend — Google Apps Script
13. Google Sheets Data Structure
14. API Contract
15. Page Flow and Navigation
16. Key Implementation Notes
17. Use Case Flows
18. Build Plan

---

## 1. Project Overview

A mobile-focused QR code based web application for managing company-owned PC devices. Staff can scan a QR code on a PC to view and update its status. The system integrates with Google Sheets as the data source via Google Apps Script, and uses Google OAuth for authentication.

**Phase 1 scope:**

- QR code generation and scanning
- Google OAuth authentication
- PC detail view and status update
- Cascading dropdown form for updating PC info
- Loan slip PDF generation (frontend-side)
- PC list and history logging
- Google Sheets as the database via Google Apps Script

**Phase 2 (future, out of current scope):**

- Migration from Google Sheets to a proper database
- True microservice backend deployment
- Floor map image with PC location icons

---

## 2. Tech Stack

|Layer|Technology|
|---|---|
|Frontend framework|React 18 + TypeScript|
|Routing|React Router v6|
|Auth|@react-oauth/google|
|QR scanning|html5-qrcode|
|QR generation|qrcode.react|
|PDF / print|Browser native print (window.print)|
|Styling|Tailwind CSS|
|Build tool|Vite|
|Backend|Google Apps Script (GAS)|
|Database|Google Sheets|

---

## 3. Architecture Overview

```
┌─────────────────────────────────────┐
│         React TypeScript App        │
│                                     │
│  pages → hooks → services → GAS URL │
│                                     │
│  AuthContext (Google OAuth token)   │
└──────────────────┬──────────────────┘
                   │ HTTP (fetch)
                   ▼
┌─────────────────────────────────────┐
│       Google Apps Script (GAS)      │
│                                     │
│  router.gs → devices.gs             │
│           → history.gs              │
│           → documents.gs            │
│           → auth.gs                 │
└──────────────────┬──────────────────┘
                   │ Sheets API
                   ▼
┌─────────────────────────────────────┐
│           Google Sheets             │
│                                     │
│  Sheet: Devices                     │
│  Sheet: History                     │
│  Sheet: Employees                   │
│  Sheet: LoanSlips                   │
└─────────────────────────────────────┘
```

**Key architectural decisions:**

- Google OAuth is handled entirely on the frontend. GAS does not manage authentication.
- GAS acts as a single API endpoint, internally modular by responsibility.
- PDF/loan slip generation is handled on the frontend using the browser's print function to avoid GAS limitations.
- The frontend service layer is structured so that swapping GAS for a real backend in Phase 2 only requires changes to `services/`.

---

## 4. Project Structure

```
root/
├── DESIGN.md                          # This document
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── main.tsx                   # App entry point
│   │   ├── App.tsx                    # Root component, routing, AuthContext provider
│   │   │
│   │   ├── types/
│   │   │   ├── pc.types.ts            # PC and related data types
│   │   │   └── user.types.ts          # User and employee data types
│   │   │
│   │   ├── config/
│   │   │   └── dropdownConfig.ts      # Cascading dropdown dependency definitions
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # Global auth state provider
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # Access and actions for auth state
│   │   │   └── useDevice.ts           # Fetch and update PC data
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts                 # Base fetch config and GAS URL
│   │   │   ├── deviceService.ts       # PC CRUD requests
│   │   │   ├── historyService.ts      # History log requests
│   │   │   └── documentService.ts     # Loan slip data requests
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── QRScanner.tsx
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   ├── PCInfoCard.tsx
│   │   │   ├── CascadingDropdown.tsx
│   │   │   ├── EmployeeSearchInput.tsx
│   │   │   ├── LoanSlipDocument.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── ScanPage.tsx
│   │       ├── PCDetailPage.tsx
│   │       ├── UpdateFormPage.tsx
│   │       ├── LoanSlipPage.tsx
│   │       ├── PCListPage.tsx
│   │       └── QRGeneratorPage.tsx
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── backend/
    ├── appsscript.json                # GAS project config and OAuth scopes
    ├── router.gs                      # Entry point, routes all requests
    ├── auth.gs                        # Optional token verification
    ├── devices.gs                     # PC CRUD with Google Sheets
    ├── history.gs                     # History logging to Google Sheets
    └── documents.gs                   # Loan slip data handling
```

---

## 5. TypeScript Types

### `types/pc.types.ts`

```typescript
export type PCStatus = 'available' | 'loaned' | 'maintenance' | 'retired';

export type PCClassification = 'in-house' | 'loaned';

export type PCCategory = 'laptop' | 'desktop' | 'tablet';

export interface PC {
  id: string;               // Unique PC identifier
  name: string;             // PC display name
  status: PCStatus;
  classification: PCClassification;
  purpose: string;          // Usage purpose (free text or predefined)
  category: PCCategory;
  location: string;         // Physical location
  currentUser: string;      // Employee ID of current user (empty if available)
  qrCode: string;           // QR code value (typically the PC id or a URL)
}

export interface PCUpdatePayload {
  id: string;
  status: PCStatus;
  classification: PCClassification;
  purpose: string;
  category: PCCategory;
  location: string;
  currentUser: string;
}

export interface PCHistory {
  pcId: string;
  updatedAt: string;        // ISO date string
  updatedBy: string;        // Employee ID
  changes: Partial<PC>;     // Only the fields that changed
}
```

### `types/user.types.ts`

```typescript
export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  imageUrl: string;
  accessToken: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}
```

---

## 6. Configuration

### `config/dropdownConfig.ts`

The cascading dropdown follows this selection order: **currentUser → status → classification → location → purpose → category**

Each level's available options depend on the selection made in the level above it.

```typescript
// Structure definition — actual option values to be confirmed with stakeholders
export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownLevel {
  key: keyof PCUpdatePayload;
  label: string;
  // If dependsOn is null, this level always shows all its options
  dependsOn: keyof PCUpdatePayload | null;
  // options is a map from the parent value to available child options
  // If dependsOn is null, options is a flat array
  options: Record<string, DropdownOption[]> | DropdownOption[];
}

export const dropdownConfig: DropdownLevel[] = [
  {
    key: 'currentUser',
    label: '使用者',
    dependsOn: null,
    options: [], // Populated dynamically from employee search
  },
  {
    key: 'status',
    label: '状況',
    dependsOn: 'currentUser',
    options: {
      // When a user is selected, these statuses are available
      'hasUser': [
        { value: 'loaned', label: '貸出中' },
        { value: 'maintenance', label: 'メンテナンス中' },
      ],
      // When no user is selected
      'noUser': [
        { value: 'available', label: '使用可能' },
        { value: 'retired', label: '廃棄' },
      ],
    },
  },
  {
    key: 'classification',
    label: '分類',
    dependsOn: 'status',
    options: {
      'loaned': [{ value: 'loaned', label: '貸出' }],
      'available': [{ value: 'in-house', label: '社内' }],
      'maintenance': [{ value: 'in-house', label: '社内' }],
      'retired': [{ value: 'in-house', label: '社内' }],
    },
  },
  {
    key: 'location',
    label: '場所',
    dependsOn: 'classification',
    options: {
      // Actual location values to be confirmed with stakeholders
      'loaned': [{ value: 'off-site', label: '社外' }],
      'in-house': [
        { value: 'office-a', label: 'オフィスA' },
        { value: 'office-b', label: 'オフィスB' },
        { value: 'storage', label: '倉庫' },
      ],
    },
  },
  {
    key: 'purpose',
    label: '用途',
    dependsOn: 'location',
    options: {
      // Actual purpose values to be confirmed with stakeholders
      'off-site': [
        { value: 'client-work', label: '顧客業務' },
        { value: 'remote-work', label: 'リモートワーク' },
      ],
      'office-a': [
        { value: 'general', label: '一般業務' },
        { value: 'development', label: '開発' },
      ],
      'office-b': [
        { value: 'general', label: '一般業務' },
      ],
      'storage': [
        { value: 'spare', label: '予備' },
      ],
    },
  },
  {
    key: 'category',
    label: '区分',
    dependsOn: 'purpose',
    options: {
      // Actual category values to be confirmed with stakeholders
      'client-work': [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'tablet', label: 'タブレット' },
      ],
      'remote-work': [
        { value: 'laptop', label: 'ノートPC' },
      ],
      'general': [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
      ],
      'development': [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
      ],
      'spare': [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
        { value: 'tablet', label: 'タブレット' },
      ],
    },
  },
];
```

> ⚠️ **Note:** The actual option values and dependency mappings above are placeholders. These must be confirmed with stakeholders and updated before the coding phase begins.

---

## 7. Authentication Flow

Google OAuth is handled entirely on the frontend using `@react-oauth/google`. GAS is not involved in authentication.

### First visit / after logout

```
1. User opens app
       ↓
2. ProtectedRoute checks AuthContext for existing token
       ↓ (no token)
3. Redirect to LoginPage
       ↓
4. Google One Tap overlay appears — user selects their work account
       ↓
5. Google returns credential token to frontend
       ↓
6. Token decoded and user stored in AuthContext
       ↓
7. User redirected to ScanPage (default post-login route)
```

### Page refresh (returning user)

```
1. User refreshes the page
       ↓
2. useGoogleOneTapLogin fires with auto_select: true
       ↓
3. Google detects active session and silently re-authenticates
       ↓
4. Token decoded and user restored in AuthContext
       ↓
5. User continues without seeing a login screen
```

### Logout

```
1. User clicks logout in Navbar
       ↓
2. googleLogout() is called — revokes One Tap session hint
       ↓
3. AuthContext is cleared
       ↓
4. User redirected to LoginPage
       ↓
5. On next visit, One Tap overlay is shown again (no silent re-auth)
```

**AuthContext stores:**

- `user: GoogleUser | null`
- `login(token: string): void`
- `logout(): void`
- `isAuthenticated: boolean`

**Key implementation notes:**

- Token is stored in memory only (React state), not localStorage
- `googleLogout()` from `@react-oauth/google` is called on logout to prevent One Tap from silently re-authenticating the user after an explicit logout
- Calling `googleLogout()` only clears the One Tap session hint — it does not sign the user out of Google in the browser

---

## 8. Frontend — Pages

### `LoginPage.tsx`

- Displays app name and Google Sign-In button
- On successful login, stores token in AuthContext and redirects to `/scan`
- If user is already authenticated, redirects immediately to `/scan`

### `ScanPage.tsx`

- Default page after login
- Renders `QRScanner` component
- On successful scan, extracts PC ID from QR value and navigates to `/pc/:id`

### `PCDetailPage.tsx`

- Route: `/pc/:id`
- Fetches PC data for the given ID using `useDevice` hook
- Renders `PCInfoCard` with full PC details
- Contains a button to navigate to `UpdateFormPage`

### `UpdateFormPage.tsx`

- Route: `/pc/:id/update`
- Renders `CascadingDropdown` and `EmployeeSearchInput`
- On save:
    - If classification is `loaned` → navigate to `/pc/:id/loan-slip`
    - Otherwise → submit update directly and navigate back to `/pc/:id`

### `LoanSlipPage.tsx`

- Route: `/pc/:id/loan-slip`
- Renders `LoanSlipDocument` with the pending update data
- Contains print button (triggers `window.print()`)
- On print confirmation → submits the update to GAS and navigates to `/pc/:id`

### `PCListPage.tsx`

- Route: `/admin/devices`
- Fetches all PCs using `useDevice` hook
- Renders a scrollable list of `PCInfoCard` components
- Each card links to its `PCDetailPage`

### `QRGeneratorPage.tsx`

- Route: `/admin/qr`
- Fetches all PCs
- Renders a `QRCodeDisplay` for each PC
- Each QR code encodes the URL: `{APP_BASE_URL}/pc/{pcId}`

---

## 9. Frontend — Components

### `Navbar.tsx`

- Props: none (reads from AuthContext)
- Displays app name, current user name, and logout button
- Logout clears AuthContext and redirects to `/login`

### `ProtectedRoute.tsx`

- Props: `{ children: ReactNode }`
- Reads `isAuthenticated` from AuthContext
- Renders children if authenticated, redirects to `/login` if not

### `QRScanner.tsx`

- Props: `{ onScan: (result: string) => void, onError?: (error: string) => void }`
- Uses `html5-qrcode` to access device camera and decode QR codes
- Calls `onScan` with the decoded string on success
- Shows error message on failure

### `QRCodeDisplay.tsx`

- Props: `{ value: string, pcName: string, size?: number }`
- Uses `qrcode.react` to render a QR code image
- Displays the PC name below the QR code

### `PCInfoCard.tsx`

- Props: `{ pc: PC }`
- Displays all PC fields in a readable card layout
- Used in both `PCDetailPage` and `PCListPage`

### `CascadingDropdown.tsx`

- Props: `{ config: DropdownLevel[], value: Partial<PCUpdatePayload>, onChange: (value: Partial<PCUpdatePayload>) => void }`
- Reads `dropdownConfig` to determine which options to show at each level
- When a higher level selection changes, clears all lower level selections
- Renders each level as a `<select>` element, disabled until the level above is selected

### `EmployeeSearchInput.tsx`

- Props: `{ value: string, onChange: (employeeId: string) => void }`
- Renders a text input that filters the employee list from Google Sheets
- Displays matching results as a dropdown list
- On selection, calls `onChange` with the selected employee ID

### `LoanSlipDocument.tsx`

- Props: `{ pc: PC, employee: Employee, date: string }`
- Renders a formatted, print-ready loan slip layout
- Uses `@media print` CSS to hide all other UI elements during printing

### `LoadingSpinner.tsx`

- Props: `{ message?: string }`
- Displays a centered loading indicator with an optional message

---

## 10. Frontend — Hooks

### `useAuth.ts`

- Reads from `AuthContext`
- Returns: `{ user, isAuthenticated, login, logout }`

### `useDevice.ts`

- Returns: `{ pc, allDevices, loading, error, fetchDevice, fetchAllDevices, updateDevice }`
- `fetchDevice(id: string)` — calls `deviceService.getDevice`
- `fetchAllDevices()` — calls `deviceService.getAllDevices`
- `updateDevice(payload: PCUpdatePayload)` — calls `deviceService.updateDevice` and `historyService.logUpdate`

---

## 11. Frontend — Services

### `api.ts`

```typescript
const GAS_URL = import.meta.env.VITE_GAS_URL;

export async function gasRequest<T>(action: string, payload?: object): Promise<T> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!response.ok) throw new Error(`GAS request failed: ${response.status}`);
  return response.json();
}
```

### `deviceService.ts`

```typescript
getDevice(id: string): Promise<PC>
getAllDevices(): Promise<PC[]>
updateDevice(payload: PCUpdatePayload): Promise<void>
```

### `historyService.ts`

```typescript
logUpdate(pcId: string, updatedBy: string, changes: Partial<PC>): Promise<void>
```

### `documentService.ts`

```typescript
getLoanSlipData(pcId: string): Promise<{ pc: PC, employee: Employee }>
```

---

## 12. Backend — Google Apps Script

All requests from the frontend enter through `doPost(e)` in `router.gs`. The `action` field in the request body determines which handler is called.

### `router.gs`

```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  switch (action) {
    case 'getDevice':     return devices.getDevice(body);
    case 'getAllDevices': return devices.getAllDevices();
    case 'updateDevice':  return devices.updateDevice(body);
    case 'logUpdate':     return history.logUpdate(body);
    case 'getLoanSlip':   return documents.getLoanSlipData(body);
    default:
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Unknown action' })
      ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### `devices.gs`

- `getDevice(body)` — reads a single row from the Devices sheet by PC ID
- `getAllDevices()` — reads all rows from the Devices sheet
- `updateDevice(body)` — finds the row by PC ID and updates the relevant columns

### `history.gs`

- `logUpdate(body)` — appends a new row to the History sheet with the update details

### `documents.gs`

- `getLoanSlipData(body)` — retrieves PC and employee data needed to render the loan slip

### `auth.gs`

- `verifyToken(token)` — optional, verifies the Google OAuth token if access control is needed in a later phase

### `appsscript.json`

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

---

## 13. Google Sheets Data Structure

### Sheet: `Devices`

|Column|Field|Type|Notes|
|---|---|---|---|
|A|id|string|Unique PC identifier|
|B|name|string|PC display name|
|C|status|string|See PCStatus type|
|D|classification|string|See PCClassification type|
|E|purpose|string||
|F|category|string|See PCCategory type|
|G|location|string||
|H|currentUser|string|Employee ID or empty|
|I|qrCode|string|Encoded URL|

### Sheet: `History`

|Column|Field|Type|Notes|
|---|---|---|---|
|A|pcId|string||
|B|updatedAt|string|ISO date string|
|C|updatedBy|string|Employee email|
|D|changes|string|JSON stringified Partial<PC>|

### Sheet: `Employees`

|Column|Field|Type|Notes|
|---|---|---|---|
|A|id|string||
|B|name|string||
|C|email|string||
|D|department|string||

### Sheet: `LoanSlips`

|Column|Field|Type|Notes|
|---|---|---|---|
|A|slipId|string|Unique ID|
|B|pcId|string||
|C|employeeId|string||
|D|loanDate|string|ISO date string|
|E|printedAt|string|ISO date string|

---

## 14. API Contract

All requests are POST to the single GAS deployment URL. Request and response bodies are JSON.

### Get single device

```json
Request:  { "action": "getDevice", "id": "PC-001" }
Response: { "data": { ...PC object } }
```

### Get all devices

```json
Request:  { "action": "getAllDevices" }
Response: { "data": [ ...PC objects ] }
```

### Update device

```json
Request:  { "action": "updateDevice", "payload": { ...PCUpdatePayload } }
Response: { "success": true }
```

### Log update history

```json
Request:  { "action": "logUpdate", "pcId": "PC-001", "updatedBy": "user@example.com", "changes": { ...Partial<PC> } }
Response: { "success": true }
```

### Get loan slip data

```json
Request:  { "action": "getLoanSlip", "pcId": "PC-001" }
Response: { "data": { "pc": { ...PC }, "employee": { ...Employee } } }
```

### Error response (all actions)

```json
{ "error": "Error message string" }
```

---

## 15. Page Flow and Navigation

```
/login
  └── (on login success) → /scan

/scan
  └── (on QR scan success) → /pc/:id

/pc/:id
  └── (on "Update" button) → /pc/:id/update

/pc/:id/update
  ├── (on save, classification ≠ loaned) → /pc/:id
  └── (on save, classification = loaned) → /pc/:id/loan-slip

/pc/:id/loan-slip
  └── (on print + confirm) → /pc/:id

/admin/devices
  └── (on card click) → /pc/:id

/admin/qr
  (no outgoing navigation, print only)
```

**Route protection:** All routes except `/login` are wrapped in `ProtectedRoute`. Unauthenticated users are redirected to `/login`.

---

## 16. Key Implementation Notes

### QR Code Value Format

QR codes should encode the full URL to the PC detail page:

```
{APP_BASE_URL}/pc/{pcId}
```

This allows the camera to scan and navigate directly without any intermediate lookup.

### Loan Slip Print Flow

The loan slip is printed using `window.print()` on the `LoanSlipPage`. The `LoanSlipDocument` component uses `@media print` CSS to isolate only the slip content during printing. The GAS update is only submitted **after** the user confirms the print was completed, using a confirmation button on the page.

### Cascading Dropdown Reset Behavior

When any dropdown level changes, all levels below it must be reset to empty. `CascadingDropdown` handles this internally — the parent component (`UpdateFormPage`) only receives the final complete value via `onChange`.

### Environment Variables

The following environment variables must be defined in a `.env` file at the frontend root:

```
VITE_GAS_URL=          # Deployed GAS web app URL
VITE_GOOGLE_CLIENT_ID= # Google OAuth client ID
```

### GAS Deployment Settings

- Execute as: **Me**
- Who has access: **Anyone** (access control is handled by Google OAuth on the frontend)

### Data Confirmation Required

The dropdown option values and their dependency mappings in `dropdownConfig.ts` are placeholders and **must be confirmed with stakeholders** before the coding phase begins. The structure of the config is fixed but the values are not.

---

## 17. Use Case Flows

### UC-1: Staff — Scan & View a Device

A staff member scans a QR code on a PC with their phone, gets redirected to the PC detail page, and views its current status and info.

```
Login → /scan → (scan QR) → /pc/:id (view details)
```

### UC-2: Staff — Update a Device (non-loan)

Staff scans a PC, opens the update form, fills in the cascading dropdowns, and saves. The update is submitted directly to Google Sheets.

```
/pc/:id → /pc/:id/update → (save, classification ≠ loaned) → /pc/:id
```

### UC-3: Staff — Loan Out a Device

Staff updates a PC with `classification = loaned`. This triggers the loan slip flow — a printable document is generated, the staff prints it, confirms, and only then is the update submitted to Sheets.

```
/pc/:id → /pc/:id/update → (save, classification = loaned) → /pc/:id/loan-slip → (print + confirm) → /pc/:id
```

### UC-4: Admin — Browse All Devices

An admin views the full list of all PCs and can click into any device's detail page.

```
/admin/devices → (click a card) → /pc/:id
```

### UC-5: Admin — Generate QR Codes

An admin visits the QR generator page, which renders a QR code for every PC (encoding its detail URL). These can be printed and physically attached to the machines.

```
/admin/qr → (print page)
```

### UC-6: Unauthenticated User

Any user hitting a protected route without a token is redirected to login, then sent to the scan page on success.

```
(any protected route) → /login → (Google OAuth) → /scan
```

---

## 18. Build Plan

The application is built in 10 sequential phases. Each phase is reviewed and approved before the next begins.

| Phase | Name | Deliverable |
|---|---|---|
| 1 | Project Scaffolding | Vite + React + TS project with all dependencies installed and a blank running app |
| 2 | Types & Config | `types/pc.types.ts`, `types/user.types.ts`, `config/dropdownConfig.ts` |
| 3 | Auth Layer | `AuthContext.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`, `LoginPage.tsx`, basic `App.tsx` routing — working login → redirect flow |
| 4 | Service Layer | `services/api.ts`, `deviceService.ts`, `historyService.ts`, `documentService.ts`, `.env` template |
| 5 | Core Hook & Shared Components | `useDevice.ts`, `LoadingSpinner.tsx`, `Navbar.tsx`, `PCInfoCard.tsx` |
| 6 | Scan & Detail Flow | `QRScanner.tsx`, `QRCodeDisplay.tsx`, `ScanPage.tsx`, `PCDetailPage.tsx` — core user journey functional |
| 7 | Update Form | `CascadingDropdown.tsx`, `EmployeeSearchInput.tsx`, `UpdateFormPage.tsx` |
| 8 | Loan Slip | `LoanSlipDocument.tsx`, `LoanSlipPage.tsx` with print CSS — full loan flow including print confirmation |
| 9 | Admin Pages | `PCListPage.tsx`, `QRGeneratorPage.tsx` |
| 10 | Google Apps Script Backend | `backend/router.gs`, `devices.gs`, `history.gs`, `documents.gs`, `auth.gs`, `appsscript.json` |