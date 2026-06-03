# Blood Haven (Donor Land)

Tamil Nadu blood bank coordination app: donors, hospitals, and admins manage requests, per-hospital inventory, and network transfers.

## Architecture

| Layer | Stack |
|--------|--------|
| Frontend | React 19, Vite, TanStack Router, TanStack Query, Tailwind |
| API | Express on port 3001, JWT in httpOnly cookie |
| Database | MongoDB (`blood_haven`) |

**Persistence:** All app data lives in MongoDB. The API is the only write path. `scripts/seed-mongo.ts` and other seed scripts are **ops tooling** for local/staging data — they do not affect the UI until Mongo is seeded and the API is running.

There is **no localStorage data store** anymore; the browser only caches the signed-in user profile for display (`blood-haven-user`).

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start MongoDB locally (or set `MONGODB_URI` in `.env`).

3. Seed the database:

   ```bash
   npm run seed:mongo
   ```

4. Run API + frontend:

   ```bash
   npm run dev
   ```

   - Web: http://localhost:5173 (proxies `/api` → API)
   - API: http://localhost:3001

## Demo credentials

| Role | Login | Password |
|------|--------|----------|
| Admin | `admin@gmail.com` | `admin123` |
| Hospital | `cgh@donorland.io` | `hospital123` |
| Donor | `+919500320001` | `donor123` |

Additional Tiruppur hospitals: `npm run seed` scripts in `scripts/` (see `seed-tiruppur-hospitals.ts`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + API (concurrently) |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | API only |
| `npm run seed:mongo` | Reset & seed MongoDB |
| `npm run build` | Production frontend build |

## Per-hospital inventory

Inventory is stored in the `hospitalInventory` collection keyed by `hospitalEmail`. Transfers debit the sender and credit the recipient. Admin dashboard shows aggregated totals across hospitals.

## Security notes

- Passwords are bcrypt-hashed in MongoDB.
- Sessions use httpOnly cookies (`blood_haven_session`).
- Delete/fulfill request endpoints enforce ownership via `requesterUserId`, email, or phone.

Set a strong `JWT_SECRET` in production.
