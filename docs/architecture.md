# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implement in dependency order: data contracts first, API behavior next, and presentation wiring last. Keep each tier responsible for its own concerns and preserve the existing ports, relative `/api` calls, and unauthenticated exercise setup.

- Presentation tier decision: Keep React components focused on rendering and user interaction; use the shared API client for relative `/api` requests. Each capability should expose accessible loading, empty, and error states, and should not duplicate API business logic.
- Logic tier decision: Implement the contracts in the existing Express routes/services. Validate request data and references at the API boundary, return deliberate 4xx responses for invalid or unknown resources, and leave persistence to the data tier.
- Data tier decision: Add the required fields, validation, and defaults to the existing Mongoose models. Preserve seed idempotency and unrelated records; do not add a second persistence mechanism.
- Activity tracking approach: List activities and create them only after validating the submitted user and team IDs and confirming both references exist. Persist the corresponding user, team, type, and minutes, along with computed points and an occurrence date; malformed or missing references must not become cast-error 500s.
- Team management approach: List and create teams through the API, preserving the submitted name and mascot and exposing members. Reject a missing name with `400`; keep member relationships consistent with the existing Mongoose models.
- Leaderboard approach: Calculate each team's total from its activity points, sort highest total first, and return `teamName`, `totalPoints`, and a 1-based rank for every entry.
- Workout suggestions approach: Find the requested user by email, use the user's goal and recent activities to choose the first suitable workout, and include a reason tied to that context. Return a deliberate 4xx when no user matches.

## Test plan

Run tests in tier order. The contract tests currently expose the starter's incomplete implementation; the results below record the baseline run and what each failure indicates. Build commands are included as follow-up checks and have not yet been run.

- Data tier — `npm run test:data --prefix octofit-tracker/backend`: **4 failed, 1 passed.** The failures indicate required user, team, activity, and workout model validation is incomplete. The seed/idempotency contract passes and should remain passing.
- API — `npm run test:api --prefix octofit-tracker/backend`: **4 failed.** Invalid activity and nameless team requests return `501` instead of `400`; the leaderboard is empty instead of totaling and ranking activity points; the first workout suggestion does not match the user's goal/activity.
- Presentation — `npm test --prefix octofit-tracker/frontend`: **15 failed.** Capability data is not rendered as expected, the user-specific workout request is missing or incorrect, and loading, empty, and API-error accessible states fail across the four routes.
- Backend build — `npm run build --prefix octofit-tracker/backend`: **Not run.** Run after implementation to catch TypeScript errors.
- Frontend build — `npm run build --prefix octofit-tracker/frontend`: **Not run.** Run after implementation to catch TypeScript and Vite build errors.
