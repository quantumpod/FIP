# DockingWare FIP

**DockingWare Fulfillment Intelligence Platform** — connects marketplace orders with warehouse operations.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | Shadcn UI (`@base-ui/react`) |
| Database | PostgreSQL via Prisma v7 + `@prisma/adapter-pg` |
| Auth | NextAuth v5 (JWT, Credentials) |
| Tables | TanStack React Table |
| Validation | Zod |
| Icons | Lucide React |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL

# 3. Push schema + seed demo data
npx prisma db push
DATABASE_URL="..." npx tsx prisma/seed.ts

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `admin@dockingware.local` / `Admin123!`

## Database (Docker)

```bash
docker run -d \
  --name dockingware-postgres \
  -e POSTGRES_USER=dockingware \
  -e POSTGRES_PASSWORD=dockingware123 \
  -e POSTGRES_DB=dockingware_fip \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:16-alpine
```

Then set:
```
DATABASE_URL="postgresql://dockingware:dockingware123@localhost:5432/dockingware_fip"
```

## Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check

npx prisma db push   # Sync schema to DB (no migration files)
npx tsx prisma/seed.ts  # Seed demo data
npx prisma studio    # DB GUI
```

## Demo Flow

```
Tracking: 1Z999999999
  → Order #10001 (READY_TO_PICK)
  → WH-AA × 32 units
  → Location: A01-R02-B03
  → Pick Task: OPEN → IN_PROGRESS → COMPLETED
  → Order → PACKED
  → Box recommendation: BOX-M (qty 11-50)
```

**Scanner Mode:** Go to `/scan` → scan `1Z999999999` → generate pick task → tap items to pick.

## Modules

| Route | Description |
|---|---|
| `/dashboard` | Live stats + recent orders & pick tasks |
| `/products` | Master SKU catalog (CRUD, search) |
| `/listings` | Marketplace SKU → Master SKU mapping |
| `/orders` | Order list with status filter |
| `/tracking` | Tracking number lookup |
| `/inventory` | Stock levels by location |
| `/locations` | Warehouse zones / aisles / racks / bins |
| `/pick-tasks` | Pick task queue + interactive pick UI |
| `/packaging-rules` | Box rules by qty range + recommender |
| `/scan` | **Scanner mode** — full-screen mobile pick flow |

## API Routes

```
GET/POST   /api/products
GET/PATCH/DELETE /api/products/[id]

GET/POST   /api/listings
GET/PATCH/DELETE /api/listings/[id]

GET/POST   /api/orders
GET/PATCH/DELETE /api/orders/[id]
GET        /api/orders/tracking?number=...

GET/POST   /api/inventory
GET/DELETE /api/inventory/[id]

GET/POST   /api/locations
GET/PATCH/DELETE /api/locations/[id]

GET/POST   /api/pick-tasks
GET/PATCH/DELETE /api/pick-tasks/[id]
PATCH      /api/pick-tasks/[id]/items/[itemId]

GET/POST   /api/packaging-rules
GET/PATCH/DELETE /api/packaging-rules/[id]
GET        /api/packaging-rules/recommend?productId=...&quantity=...

GET        /api/warehouses
GET        /api/dashboard
```

## Implementation Progress

| Phase | Status | Description |
|---|---|---|
| Phase 0 | ✅ Done | Setup + UI Shell |
| Phase 1 | ✅ Done | Database + Auth |
| Phase 2 | ✅ Done | Products Module |
| Phase 3 | ✅ Done | Listings + SKU Mapping |
| Phase 4 | ✅ Done | Orders + Tracking Lookup |
| Phase 5 | ✅ Done | Inventory + Locations |
| Phase 6 | ✅ Done | Pick Task Engine |
| Phase 7 | ✅ Done | Packaging Rules |
| Phase 8 | ✅ Done | Scanner Friendly UI |
| Phase 9 | ✅ Done | Demo Data + QA |

## Schema

15 models: `Company`, `User`, `Product`, `Listing`, `Warehouse`, `Location`, `InventoryItem`, `Order`, `OrderItem`, `PackagingRule`, `PickTask`, `PickTaskItem`, `Bundle`, `BundleItem`, `AuditLog`

## Demo Data

After seeding:
- **1 Company:** DockingWare Demo
- **1 User:** admin@dockingware.local (ADMIN)
- **1 Warehouse:** WH-01 (3 locations)
- **3 Products:** WH-AA, WH-AAA, KIT-16
- **3 Listings:** AMZ-AA-16, WMT-AA-24, EBY-AAA-10
- **2 Inventory records:** WH-AA × 500 @ A01-R02-B03, WH-AAA × 300 @ A01-R01-B01
- **5 Orders:** #10001–#10005 (various statuses)
- **3 Packaging rules:** BOX-S (1–10), BOX-M (11–50), BOX-L (51–200)
