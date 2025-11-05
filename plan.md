## Finance App – Step-by-Step Implementation Plan

### Scope and principles
- Build a Next.js 14 (App Router) PWA with TypeScript and MUI.
- OAuth via Google; data stored in user’s Google Drive using CSV files.
- Stateless backend using Next.js API routes; no server DB.
- Small, incremental steps; always keep the app deployable.

### Phase 0 — Preparation
1. (not needed) Create a new GitHub repository (or clean current repo state).
2. Add branch protection rules for `master`/`main`.
3. (not needed) Create project boards: Backlog, In Progress, Done.
4. (not needed) Add issue templates: feature, bug, chore.
5. (not needed) Create `.editorconfig` matching team indentation and line endings.
6. Decide Node.js LTS version (e.g., 20.x) and pin in `.nvmrc`.
7. use npm.
8. Document required secrets (OAuth, NextAuth) in `design/authentication.md` refs.

### Phase 1 — Project scaffolding
9. Bootstrap Next.js App Router project with TypeScript.
10. Initialize package manager lockfile (npm or pnpm).
11. Add and configure ESLint with TypeScript recommended rules.
12. Add Prettier and eslint-config-prettier to avoid style conflicts.
13. Add Husky + lint-staged for pre-commit checks.
14. Configure `tsconfig.json` base paths and strict mode.
15. Create `src/` layout; enable `baseUrl` and path aliases.
16. Create `src/app/(site)/` and `src/app/api/` folders.
17. Add an initial home route with a placeholder page.
18. Add a shared `src/styles/theme.ts` for MUI theme.
19. Wire MUI `ThemeProvider` in `src/app/layout.tsx`.
20. Add a global CSS reset and fonts.

### Phase 2 — Dependencies
21. Install UI libs: `@mui/material @mui/icons-material @emotion/react @emotion/styled`.
22. Install auth: `next-auth` and `@types/node` updates if needed.
23. Install charts: `recharts`.
24. Install validation/utilities: `zod`, `date-fns`, `uuid`.
25. Install CSV/ZIP tooling: `papaparse`, `csv-parse`, `csv-stringify`, `jszip`.
26. Install Google API SDK: `googleapis`.
27. Install rate-limiter: lightweight in-memory or `lru-cache`.
28. Install test tooling: `vitest` + `@vitest/ui`, `@testing-library/react`, `playwright`.

### Phase 3 — Environment configuration
29. Create `.env.local.example` with required variables.
30. Add `.env*` to `.gitignore`.
31. Define `NEXTAUTH_URL`, `NEXTAUTH_SECRET` in env.
32. Define Google OAuth client ID/secret in env.
33. Define OAuth scopes: `userinfo.profile`, `userinfo.email`, `drive.file`, `drive.appdata`.
34. Add runtime validation for env vars using `zod` at server start.

### Phase 4 — Authentication (NextAuth + Google)
35. Create `src/app/api/auth/[...nextauth]/route.ts` with Google provider.
36. Request required Drive scopes in provider config.
37. Implement JWT callback to persist access and refresh tokens.
38. Implement token refresh logic on expiration using Google OAuth client.
39. Expose minimal session fields to client (name, email, image, token expiry).
40. Add `SessionProvider` in root layout and protect private routes.
41. Create `SignIn` page with Google sign-in button.
42. Add sign-out button and session avatar in app shell.

### Phase 5 — App shell and global UX
43. Create responsive layout with top app bar and navigation drawer.
44. Add `GlobalProgressBar` component (linear progress at top).
45. Create `LoadingContext` with ref-count increment/decrement functions.
46. Implement a `fetchWithLoading` wrapper to integrate global progress.
47. Add error snackbar provider and convenience hooks.
48. Add a confirm dialog provider for destructive actions.

### Phase 6 — Google Drive foundations
49. Implement `getGoogleOAuthClient` utility using user tokens (server-side).
50. Implement low-level Drive helpers: list, read, create, update, delete files.
51. Implement folder helpers: ensure folder by name, get or create by path.
52. Define Drive layout constants for root `FinanceApp/`, `Profiles/`, `backup/`.
53. Add a guard to prevent cross-user access (always use the signed-in user’s tokens).
54. Add Drive error normalization (map API errors to friendly codes).

### Phase 7 — Settings and initial onboarding
55. Define `AppSettings` `zod` schema per `design/data-models.md`.
56. Create `src/app/api/settings/route.ts` (GET/POST) to read/write `settings.json`.
57. On first login, check if `settings.json` exists in Drive appdata.
58. If missing, create default settings with placeholders.
59. Build onboarding wizard: pick base currency, date format.
60. Implement `ensureRootStructure`: `FinanceApp/`, `Profiles/`, `backup/` folders.
61. Persist in settings: `profilesContainerFolderId` and `backupFolderId`.

### Phase 8 — Profiles module
62. Define `Profile` schema (`id`, `name`, `folderId`, `photoFileId?`).
63. Create Profiles API routes: list, create, update, delete, activate, photo upload.
64. Implement Drive operations: create profile folder under `Profiles/`.
65. On profile create, seed CSV files if missing: `tags.csv`, `currencies.csv`.
66. Add `ProfileContext`: profiles list, active profile, switch function.
67. Build UI: Profiles page (list, create, rename, delete, set active, photo).
68. Add profile switcher to app bar.

### Phase 9 — CSV utilities and validation
69. Implement CSV parse utilities (server): `csv-parse` with column mapping.
70. Implement CSV stringify utilities (server): `csv-stringify` with headers.
71. Add type guards and `zod` validations for all CSV rows.
72. Implement tolerant parsing (skip/collect invalid rows with warnings).
73. Add unit tests for CSV utils with sample fixtures.

### Phase 10 — Tags module
74. Define `Tag` schema and CSV headers: `type,name,color`.
75. Create `/api/tags` (GET) to read from active profile `tags.csv`.
76. Create `/api/tags` (POST) to overwrite `tags.csv` with validated rows.
77. Build UI: Tags page with add/edit/delete, color picker, type toggle.
78. Use optimistic UI updates and rollback on failure.

### Phase 11 — Currencies module
79. Define `CurrencyRecord` schema with month-level ratios.
80. Create `/api/currencies` (GET/POST) for batch operations.
81. Create `/api/currencies/[year]/[month]` (GET/PUT/DELETE).
82. Build UI: Monthly currency editor with validations.
83. Show help text describing conversion model (base USD ratio semantics).

### Phase 12 — Transactions module
84. Define `TransactionRecord` schema and CSV headers per month file.
85. Implement file naming: `transactions-YYYY-MM.csv` in active profile.
86. Create `/api/transactions/[year]/[month]` (GET) with optional type filter.
87. Create `/api/transactions` (POST) to append a transaction to the right file.
88. Create `/api/transactions/[year]/[month]/[index]` (DELETE) by row index.
89. Implement index safety: re-read file and validate index before delete.
90. Build UI: Monthly ledger with filters, pagination, and inline add form.
91. Add keyboard shortcuts for quick entry (date, amount, tag autocomplete).
92. Add file-creation logic when monthly file is missing.

### Phase 13 — Statistics and visualization
93. Implement conversion helpers: to/from USD using monthly ratios.
94. Implement monthly aggregation: totals, by-tag sums, available currencies.
95. Create `/api/statistics/[year]/[month]` (GET) returning `Statistics`.
96. Allow `/api/statistics/[year]/[month]/[currency]` (GET) to change display currency.
97. Build UI: Charts page with Recharts pie/legend and summary cards.
98. Add currency switcher for statistics view.

### Phase 14 — Drive file operations service layer
99. Centralize file IO with profile scoping and caching.
100. Add ETag-based conditional reads where available to minimize bandwidth.
101. Implement a small in-memory cache (per request) for repeated reads.
102. Standardize error codes for missing files vs invalid CSV vs forbidden.

### Phase 15 — Backup service
103. Create `/api/backups/[profileId]` (POST) to create snapshot.
104. Create `/api/backups/[profileId]` (GET) to list snapshots by timestamp.
105. Create `/api/backups/[profileId]/[timestamp]/download` (GET) streaming ZIP.
106. Create `/api/backups/[profileId]/[timestamp]/restore` (POST) with confirm body.
107. Implement Drive copy operations from live to backup and vice versa.
108. Add progress integration so global bar reflects long operations.
109. UI: Backups page with list, download, restore (destructive confirm).

### Phase 16 — State management structure
110. Implement `AuthContext` (wraps NextAuth session with helpers).
111. Implement `DriveContext` (selected folder IDs and IO helpers if needed).
112. Implement `AppContext` (settings, profiles, currencies, tags, active profile).
113. Implement `LoadingContext` (already added) used by all API calls.
114. Wire contexts in `layout.tsx` in correct provider order.

### Phase 17 — Settings UI and preferences
115. Build Settings page: base currency, date format, theme (light/dark).
116. Persist settings via `/api/settings` POST (merge write).
117. Show app version and build info pulled from env/metadata.

### Phase 18 — Access control and route protection
118. Add middleware to redirect unauthenticated users to SignIn.
119. Protect API routes: verify session and tokens before Drive calls.
120. Add CSRF protection via NextAuth built-ins where applicable.

### Phase 19 — Error handling and UX polish
121. Implement API error mapper → http status + code + message.
122. Add retry for transient 5xx Drive errors with exponential backoff.
123. Show actionable error toasts and inline form errors.
124. Add empty states for all resource pages (no tags, no currencies, no txns).

### Phase 20 — PWA enablement
125. Add manifest.json with icons and name/short_name.
126. Configure service worker using `next-pwa` or custom SW.
127. Cache app shell and static assets with proper versioning.
128. Cache last-viewed month CSVs for offline read-only viewing.
129. Add install prompt and guidance; verify Lighthouse PWA checks.

### Phase 21 — Security hardening
130. Enforce HTTPS and secure cookies in production.
131. Set strict Content Security Policy headers for Next.js pages.
132. Limit allowed image/script origins to Google APIs and app host.
133. Validate and sanitize all user inputs with `zod` schemas.
134. Add simple rate limiting per-IP on API routes (in-memory LRU or token bucket).
135. Rotate NextAuth secret and OAuth credentials in CI secrets regularly.

### Phase 22 — Performance
136. Use React lazy and code splitting for heavy pages (charts).
137. Memoize expensive computations and lists; use virtualization where needed.
138. Avoid redundant Drive calls by consolidating API requests per view.
139. Compress ZIP downloads and stream responses.
140. Add HTTP caching headers where safe (ETag/Last-Modified for backups list).

### Phase 23 — Testing
141. Unit tests: CSV utils, conversions, statistics aggregations.
142. API tests: transactions CRUD, tags, currencies, backups flows (Vitest).
143. Component tests: forms and dialogs (React Testing Library).
144. E2E tests: auth flow, onboarding, monthly ledger, backup/restore (Playwright).
145. Add GitHub Actions workflow to run tests on PRs.

### Phase 24 — Observability
146. Implement server-side structured logs with request IDs.
147. Log Drive API quotas and error rates.
148. Integrate optional client error tracking (e.g., Sentry) behind a flag.
149. Add a hidden diagnostics screen (only in dev) to inspect settings/profile IDs.

### Phase 25 — Deployment
150. Add Dockerfile optimized for Next.js with output tracing.
151. Add Cloud Build or GitHub Actions to build container and push to Artifact Registry.
152. Provision Cloud Run service with min instances = 0–1, CPU on request.
153. Configure env vars and secrets in Cloud Run.
154. Set domain, HTTPS, and redirect HTTP to HTTPS.
155. Add health check route and Cloud Run settings.

### Phase 26 — Android packaging (optional)
156. Use Bubblewrap (TWA) to wrap the PWA.
157. Generate Android project with app identity and icons.
158. Test install and sign-in; verify file operations.
159. Prepare Play Store listing and signing keys.

### Phase 27 — Documentation and support
160. Create `README.md` with quick start, env setup, and deploy steps.
161. Add `docs/` links to design: API routes, data models, authentication.
162. Document Drive layout and backup folder naming.
163. Add troubleshooting guide (OAuth scopes, token refresh, 403s).
164. Add UX guide: profiles, tags, currencies, and statistics usage.

### Phase 28 — Polishing and release
165. QA pass across devices and browsers.
166. Fix UI edge cases (long tags, many currencies, very large CSVs).
167. Run Lighthouse and fix PWA/performance/accessibility issues.
168. Cut `v1.0.0` release notes with known limitations.
169. Tag release and deploy to production.

### File/Folder layout (target)
- `src/app/` – routes (App Router)
- `src/app/api/` – API routes (auth, drive, data, profiles, backups, settings)
- `src/components/` – UI components (forms, tables, charts, dialogs)
- `src/contexts/` – `AuthContext`, `AppContext`, `DriveContext`, `LoadingContext`
- `src/lib/drive/` – Google Drive SDK wrappers and helpers
- `src/lib/csv/` – parse/stringify and validators
- `src/lib/conversion/` – currency conversion helpers
- `src/lib/backup/` – snapshot/restore and ZIP streaming
- `src/styles/` – theme and global styles
- `public/` – icons, manifest.json
- `tests/` – unit/integration/e2e tests

### Acceptance criteria (v1)
- Sign in with Google, grant Drive scopes.
- Onboarding completes and creates Drive structure.
- Profiles can be created/switched; photos optional.
- Tags and currencies editable and persisted.
- Transactions add/list/delete per month; files auto-created.
- Statistics view shows accurate totals and pie chart in chosen currency.
- Backups can be created, listed, downloaded, and restored.
- App is installable as a PWA and works on mobile and desktop.
- Deployed to Cloud Run; CI runs tests on PR.


