# DockingWare Fulfillment Intelligence Platform

## Master Prompt para AI

Actúa como arquitecto senior de software, arquitecto de frontend, arquitecto de backend y product engineer. Vamos a crear una plataforma llamada **DockingWare Fulfillment Intelligence Platform**, enfocada en fulfillment, warehouse operations, SKU mapping, bundles, pick/pack, inventory y conexión futura con marketplaces como Amazon, Walmart, eBay, Shopify y Veeqo.

El objetivo es construir primero una versión **MVP hosteable en Vercel**, usando **React / Next.js** como frontend y backend inicial. El sistema debe ser modular, escalable y preparado para evolucionar después a microservicios o backend separado si el proyecto crece.

---

# 1. Decisión Técnica Inicial

## Stack Principal Fase 1

Usar:

```txt
Next.js 15+
React
TypeScript
Tailwind CSS
Shadcn UI
Prisma ORM
PostgreSQL
NextAuth/Auth.js o JWT propio
Zod
React Hook Form
TanStack Table
Vercel
```

## Backend Primera Fase

Para la primera fase, usar backend integrado en Next.js:

```txt
Next.js API Routes / Route Handlers
Server Actions cuando aplique
Prisma para base de datos
PostgreSQL externo
```

Motivo:

* Hosteable fácilmente en Vercel.
* Menos infraestructura inicial.
* Más rápido para validar MVP.
* Permite construir frontend y backend en el mismo repositorio.
* Después se puede extraer el backend a NestJS si el sistema crece.

---

# 2. Visión del Producto

DockingWare será una plataforma que conecta órdenes de marketplaces con operaciones reales de warehouse.

El sistema debe resolver esta diferencia:

## Marketplace Layer

```txt
Amazon ASIN
Seller SKU
Listing SKU
Order ID
Tracking Number
Marketplace Order
```

## Warehouse Layer

```txt
Master SKU
Barcode
Location
Bin
Pack Rule
Pick Task
Inventory
```

La plataforma debe funcionar como traductor operacional entre ventas online y warehouse.

---

# 3. Objetivo del MVP

El MVP debe permitir:

```txt
Escanear o buscar un tracking number
↓
Encontrar la orden
↓
Ver los productos de la orden
↓
Mapear Listing SKU a Master SKU
↓
Calcular bundles o kits
↓
Mostrar ubicación
↓
Generar pick task
↓
Mostrar regla de empaque
```

Ejemplo del resultado esperado:

```txt
Tracking:
1Z999999999

Order:
#10024

Items:
WH-AA x32

Location:
A01-R02-B03

Packaging:
BOX-M

Status:
Ready To Pick
```

---

# 4. Arquitectura General

```txt
apps/web
├── Next.js Frontend
├── API Routes
├── Server Actions
├── Prisma Client
└── Auth

Database
└── PostgreSQL

Deployment
└── Vercel
```

## Arquitectura Lógica

```txt
Marketplace / Veeqo / Shopify / Manual Orders
              ↓
        Integration Layer
              ↓
        Order Service
              ↓
        SKU Mapping Engine
              ↓
        Bundle Engine
              ↓
        Inventory Engine
              ↓
        Task Engine
              ↓
        Scanner UI / Pick Pack UI
```

---

# 5. Módulos del Sistema

## Fase 1 — MVP Core

Crear estos módulos primero:

```txt
Auth
Dashboard
Products
Listings
SKU Mapping
Orders
Tracking Lookup
Locations
Inventory
Pick Tasks
Packaging Rules
```

## Fase 2 — Warehouse Operations

```txt
Receiving
Putaway
Cycle Count
Pallets
Bins
Warehouse Zones
Scanner Validation
```

## Fase 3 — Marketplace Integrations

```txt
Veeqo Connector
Shopify Connector
Amazon Connector
Walmart Connector
eBay Connector
Webhook Logs
Sync Jobs
```

## Fase 4 — Enterprise / SaaS

```txt
Companies
Users
Roles
Permissions
Subscriptions
Plans
Billing
Audit Logs
Activity Logs
```

## Fase 5 — Intelligence Layer

```txt
AI SKU Matching
Packaging Optimization
Pick Route Optimization
Inventory Forecasting
Exception Detection
```

---

# 6. Estructura de Carpetas

Crear el proyecto con esta estructura:

```txt
dockingware-fulfillment/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── listings/
│   │   ├── orders/
│   │   ├── tracking/
│   │   ├── inventory/
│   │   ├── locations/
│   │   ├── pick-tasks/
│   │   └── packaging-rules/
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── listings/
│   │   └── page.tsx
│   │
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── tracking/
│   │   └── page.tsx
│   │
│   ├── inventory/
│   │   └── page.tsx
│   │
│   ├── locations/
│   │   └── page.tsx
│   │
│   ├── pick-tasks/
│   │   └── page.tsx
│   │
│   ├── packaging-rules/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── nav-item.tsx
│   │
│   ├── products/
│   ├── listings/
│   ├── orders/
│   ├── inventory/
│   ├── tracking/
│   ├── pick-tasks/
│   └── ui/
│
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── validations/
│   ├── services/
│   │   ├── product.service.ts
│   │   ├── listing.service.ts
│   │   ├── order.service.ts
│   │   ├── tracking.service.ts
│   │   ├── inventory.service.ts
│   │   ├── location.service.ts
│   │   ├── pick-task.service.ts
│   │   ├── sku-mapping.service.ts
│   │   ├── bundle.service.ts
│   │   └── packaging.service.ts
│   │
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── types/
│   ├── product.ts
│   ├── listing.ts
│   ├── order.ts
│   ├── inventory.ts
│   └── warehouse.ts
│
├── docs/
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── AI_WORKFLOW.md
│
├── .env.example
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

# 7. Reglas de Diseño UI

El frontend debe ser:

```txt
Moderno
Oscuro por defecto
Responsive
Limpio
Enterprise
Rápido
Compatible con desktop, tablet y scanner mobile
```

## Estilo Visual

Usar:

```txt
Dark mode
Gray / zinc palette
Minimal blue only for actions
Cards
Tables
Status badges
Sidebar
Topbar
Forms clean
```

## Layout Principal

Crear un `AppShell` con:

```txt
Sidebar izquierda
Topbar superior
Main content
Responsive drawer en mobile
```

## Menú Principal

```txt
Dashboard
Products
Listings
Orders
Tracking Lookup
Inventory
Locations
Pick Tasks
Packaging Rules
Settings
```

---

# 8. Reglas de UX

## Search Global

Toda búsqueda debe tener mínimo 3 caracteres antes de consultar.

Aplicar en:

```txt
Products
Orders
Tracking
Listings
Locations
Inventory
```

## Estados visuales

Usar badges para estados:

```txt
Active
Inactive
Draft
Ready To Pick
Picking
Packed
Shipped
Cancelled
Low Stock
Out Of Stock
```

## Formularios

Usar:

```txt
React Hook Form
Zod validation
Mensajes claros
Botones Save / Cancel
Loading state
Toast notifications
```

---

# 9. Modelos de Base de Datos MVP

Crear Prisma schema con estos modelos iniciales:

```txt
User
Company
Product
Listing
Order
OrderItem
Warehouse
Location
InventoryItem
PackagingRule
PickTask
PickTaskItem
Bundle
BundleItem
AuditLog
```

---

# 10. Prisma Schema Inicial

Crear un archivo `prisma/schema.prisma` con una versión inicial basada en este modelo:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  OWNER
  ADMIN
  MANAGER
  WAREHOUSE
  VIEWER
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  DRAFT
}

enum Marketplace {
  AMAZON
  WALMART
  EBAY
  SHOPIFY
  VEEQO
  MANUAL
}

enum OrderStatus {
  NEW
  READY_TO_PICK
  PICKING
  PACKED
  SHIPPED
  CANCELLED
}

enum PickTaskStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Company {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users      User[]
  products   Product[]
  listings   Listing[]
  orders     Order[]
  warehouses Warehouse[]
}

model User {
  id        String   @id @default(cuid())
  companyId String
  email     String   @unique
  name      String?
  password  String
  role      UserRole @default(WAREHOUSE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])
}

model Product {
  id          String        @id @default(cuid())
  companyId   String
  masterSku   String
  name        String
  description String?
  barcode     String?
  upc         String?
  brand       String?
  status      ProductStatus @default(ACTIVE)

  length      Decimal?
  width       Decimal?
  height      Decimal?
  weight      Decimal?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company        Company         @relation(fields: [companyId], references: [id])
  listings       Listing[]
  inventoryItems InventoryItem[]
  bundleItems    BundleItem[]

  @@unique([companyId, masterSku])
}

model Listing {
  id          String      @id @default(cuid())
  companyId   String
  productId   String
  marketplace Marketplace
  sellerSku   String
  asin        String?
  fnsku       String?
  externalId  String?
  bundleQty   Int         @default(1)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  company Company @relation(fields: [companyId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([companyId, marketplace, sellerSku])
}

model Warehouse {
  id        String   @id @default(cuid())
  companyId String
  name      String
  code      String
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company   Company   @relation(fields: [companyId], references: [id])
  locations Location[]

  @@unique([companyId, code])
}

model Location {
  id          String   @id @default(cuid())
  warehouseId String
  code        String
  zone        String?
  aisle       String?
  rack        String?
  bin         String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  warehouse      Warehouse       @relation(fields: [warehouseId], references: [id])
  inventoryItems InventoryItem[]

  @@unique([warehouseId, code])
}

model InventoryItem {
  id         String   @id @default(cuid())
  productId  String
  locationId String
  onHand     Int      @default(0)
  allocated  Int      @default(0)
  available  Int      @default(0)
  lotNumber  String?
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  product  Product  @relation(fields: [productId], references: [id])
  location Location @relation(fields: [locationId], references: [id])

  @@unique([productId, locationId, lotNumber])
}

model Order {
  id             String      @id @default(cuid())
  companyId      String
  marketplace    Marketplace
  externalOrderId String?
  orderNumber    String
  trackingNumber String?
  carrier        String?
  status         OrderStatus @default(NEW)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  company   Company    @relation(fields: [companyId], references: [id])
  items     OrderItem[]
  pickTasks PickTask[]

  @@unique([companyId, orderNumber])
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  listingId String?
  quantity  Int

  order   Order    @relation(fields: [orderId], references: [id])
  product Product  @relation(fields: [productId], references: [id])
}

model PackagingRule {
  id          String   @id @default(cuid())
  companyId   String
  productId   String?
  name        String
  boxCode     String
  minQty      Int?
  maxQty      Int?
  length      Decimal?
  width       Decimal?
  height      Decimal?
  weightLimit Decimal?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model PickTask {
  id        String         @id @default(cuid())
  orderId   String
  status    PickTaskStatus @default(OPEN)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  order Order          @relation(fields: [orderId], references: [id])
  items PickTaskItem[]
}

model PickTaskItem {
  id         String @id @default(cuid())
  pickTaskId String
  productId  String
  locationId String
  quantity   Int
  pickedQty  Int    @default(0)

  pickTask PickTask @relation(fields: [pickTaskId], references: [id])
}

model Bundle {
  id        String   @id @default(cuid())
  companyId String
  parentSku String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items BundleItem[]
}

model BundleItem {
  id        String @id @default(cuid())
  bundleId  String
  productId String
  quantity  Int

  bundle  Bundle  @relation(fields: [bundleId], references: [id])
  product Product @relation(fields: [productId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  companyId String?
  userId    String?
  action    String
  entity    String
  entityId  String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

---

# 11. API Routes MVP

Crear endpoints REST iniciales:

```txt
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id

GET    /api/listings
POST   /api/listings
PATCH  /api/listings/:id
DELETE /api/listings/:id

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id

GET    /api/tracking/:trackingNumber

GET    /api/inventory
POST   /api/inventory/adjust

GET    /api/locations
POST   /api/locations

GET    /api/pick-tasks
POST   /api/pick-tasks/generate
PATCH  /api/pick-tasks/:id

GET    /api/packaging-rules
POST   /api/packaging-rules
```

---

# 12. Servicios Backend

Crear servicios en `lib/services`.

## Product Service

Debe manejar:

```txt
createProduct
getProducts
getProductById
updateProduct
deleteProduct
```

## Listing Service

Debe manejar:

```txt
createListing
getListings
mapListingToProduct
findProductBySellerSku
```

## Order Service

Debe manejar:

```txt
createOrder
getOrders
getOrderById
findOrderByTracking
```

## SKU Mapping Service

Debe manejar:

```txt
sellerSku → product.masterSku
listing SKU → warehouse SKU
bundle SKU → component SKUs
```

## Bundle Service

Debe manejar:

```txt
detectBundle
expandBundleItems
calculateRequiredInventory
```

## Packaging Service

Debe manejar:

```txt
findPackagingRule
recommendBox
calculatePackage
```

## Pick Task Service

Debe manejar:

```txt
generatePickTaskFromOrder
assignLocations
validatePickScan
completePickTask
```

---

# 13. Páginas Frontend MVP

## Dashboard

Debe mostrar:

```txt
Total Orders
Ready To Pick
Open Pick Tasks
Low Stock Items
Recent Orders
Recent Activity
```

## Products

Debe tener:

```txt
Product table
Search mínimo 3 caracteres
Create product
Edit product
View product detail
Delete product
```

Campos principales:

```txt
Master SKU
Name
Barcode
UPC
Brand
Status
Dimensions
Weight
```

## Listings

Debe tener:

```txt
Marketplace
Seller SKU
ASIN/FNSKU
Master SKU
Bundle Qty
Mapping status
```

## Orders

Debe tener:

```txt
Order Number
Marketplace
Tracking Number
Carrier
Status
Items
Action: Generate Pick Task
```

## Tracking Lookup

Esta es una pantalla crítica del MVP.

Debe tener:

```txt
Input para tracking number
Botón Search
Resultado de orden
Items
Master SKU
Quantity
Location
Packaging Rule
Botón Generate Pick Task
```

## Inventory

Debe mostrar:

```txt
Master SKU
Product Name
Location
On Hand
Allocated
Available
Lot
Expiration
```

## Locations

Debe mostrar:

```txt
Warehouse
Location Code
Zone
Aisle
Rack
Bin
Status
```

## Pick Tasks

Debe mostrar:

```txt
Task ID
Order
Status
Items
Location
Quantity
Picked Qty
Action: Start / Complete
```

---

# 14. Fases de Implementación

# Fase 0 — Setup del Proyecto

## Objetivo

Crear la base técnica del proyecto.

## Tareas

```txt
Crear proyecto Next.js con TypeScript
Instalar Tailwind CSS
Instalar Shadcn UI
Instalar Prisma
Configurar PostgreSQL
Crear .env.example
Crear layout base
Crear AppShell
Crear Sidebar
Crear Topbar
Crear README inicial
```

## Comandos sugeridos

```bash
npx create-next-app@latest dockingware-fulfillment --typescript --tailwind --eslint --app
cd dockingware-fulfillment
npm install prisma @prisma/client zod react-hook-form @hookform/resolvers
npm install @tanstack/react-table lucide-react
npx prisma init
```

---

# Fase 1 — Database + Auth + Layout

## Objetivo

Tener sistema base con login, compañía y estructura SaaS inicial.

## Tareas

```txt
Crear Prisma schema inicial
Crear seed
Crear Company default
Crear User admin default
Crear login page
Crear auth helper
Proteger rutas privadas
Crear dashboard layout
Crear sidebar responsive
```

## Resultado esperado

```txt
Usuario puede entrar al sistema
Dashboard protegido funciona
Base de datos conectada
Layout principal listo
```

---

# Fase 2 — Products Module

## Objetivo

Crear el CRUD de productos.

## Tareas

```txt
Crear modelo Product
Crear API routes products
Crear product service
Crear product validations con Zod
Crear products table
Crear product form
Crear product detail page
Crear edit product
Crear delete product
Implementar search min 3 chars
```

## Resultado esperado

```txt
Usuario puede crear, buscar, ver, editar y eliminar productos.
```

---

# Fase 3 — Listings + SKU Mapping

## Objetivo

Mapear SKUs de marketplace a Master SKU.

## Tareas

```txt
Crear modelo Listing
Crear API routes listings
Crear listing service
Crear mapping UI
Crear tabla Listings
Permitir seleccionar Product para cada Listing
Mostrar mapping status
```

## Resultado esperado

```txt
Amazon/Walmart/eBay/Shopify SKU puede conectarse con un Master SKU interno.
```

---

# Fase 4 — Orders + Tracking Lookup

## Objetivo

Crear órdenes y buscarlas por tracking number.

## Tareas

```txt
Crear modelos Order y OrderItem
Crear API orders
Crear order service
Crear pantalla Orders
Crear pantalla Tracking Lookup
Crear búsqueda por tracking number
Mostrar items de la orden
Mostrar master SKU mapeado
```

## Resultado esperado

```txt
Al buscar tracking number, el sistema muestra la orden y sus productos.
```

---

# Fase 5 — Inventory + Locations

## Objetivo

Crear inventario básico por ubicación.

## Tareas

```txt
Crear Warehouse
Crear Location
Crear InventoryItem
Crear API locations
Crear API inventory
Crear inventory table
Crear location table
Crear inventory adjustment
Calcular available = onHand - allocated
```

## Resultado esperado

```txt
Cada producto puede tener inventario en ubicaciones específicas.
```

---

# Fase 6 — Pick Task Engine

## Objetivo

Generar tareas de picking desde una orden.

## Tareas

```txt
Crear PickTask
Crear PickTaskItem
Crear pick task service
Crear endpoint generate pick task
Asignar location con inventario disponible
Actualizar allocated inventory
Crear UI de Pick Tasks
Crear flujo Start / Complete
```

## Resultado esperado

```txt
Desde una orden o tracking se puede generar una tarea de picking.
```

---

# Fase 7 — Packaging Rules

## Objetivo

Recomendar caja o empaque para una orden.

## Tareas

```txt
Crear PackagingRule
Crear API packaging rules
Crear packaging service
Crear UI packaging rules
Asignar boxCode según producto y cantidad
Mostrar packaging recomendado en Tracking Lookup
```

## Resultado esperado

```txt
La orden muestra empaque recomendado.
```

---

# Fase 8 — Scanner Friendly UI

## Objetivo

Crear pantallas optimizadas para scanner/mobile.

## Tareas

```txt
Crear vista mobile para Tracking Lookup
Crear vista mobile para Pick Tasks
Botones grandes
Input autofocus
Validación por barcode
Mensajes claros de success/error
```

## Resultado esperado

```txt
Un operador puede usar tablet o scanner Android para buscar tracking y hacer picking.
```

---

# Fase 9 — Seed Demo Data

## Objetivo

Cargar datos demo para probar el sistema.

## Crear datos:

```txt
Company demo
User admin
Warehouse WH-01
Locations A01-R01-B01, A01-R01-B02, A01-R02-B03
Products WH-AA, WH-AAA, KIT-16
Listings Amazon, Walmart, eBay
Orders con tracking demo
Inventory disponible
Packaging Rules BOX-S, BOX-M, BOX-L
```

## Resultado esperado

Con un tracking demo, el sistema debe mostrar:

```txt
Order #10001
WH-AA x32
Location A01-R02-B03
Packaging BOX-M
Ready To Pick
```

---

# 15. Prompt Inicial para AI

Usa este prompt primero:

```txt
Create a production-ready Next.js 15 application called dockingware-fulfillment.

Use TypeScript, Tailwind CSS, Shadcn UI, Prisma, PostgreSQL, Zod, React Hook Form, TanStack Table and Lucide icons.

The application is a fulfillment intelligence platform for warehouse and marketplace operations.

Build the project with a modular architecture. It must be deployable to Vercel.

Start by creating:
1. AppShell layout with sidebar and topbar.
2. Dark mode enterprise UI.
3. Dashboard page.
4. Prisma schema with Company, User, Product, Listing, Order, OrderItem, Warehouse, Location, InventoryItem, PackagingRule, PickTask, PickTaskItem, Bundle, BundleItem and AuditLog.
5. Prisma client setup.
6. .env.example.
7. Seed file with demo company, admin user, warehouse, locations, products, listings, inventory, orders and packaging rules.
8. API route handlers for products, listings, orders, tracking lookup, inventory, locations, pick tasks and packaging rules.
9. Products CRUD UI.
10. Tracking Lookup page that searches by tracking number and displays order, items, mapped master SKU, location, packaging rule and generate pick task button.

Follow clean architecture principles inside the Next.js app:
- Keep database access inside services.
- Keep validations in lib/validations.
- Keep reusable UI in components.
- Use server components where possible.
- Use client components only when needed.
- Validate all input using Zod.
- Do not hardcode company data except in seed/demo.
- Use responsive design.
- Every search must require at least 3 characters before querying.

Do not create unnecessary features yet. Focus on MVP quality.
```

---

# 16. Prompt para Fase 0

```txt
Implement Phase 0 for DockingWare Fulfillment.

Create the base Next.js project structure using App Router, TypeScript and Tailwind.

Add:
- AppShell
- Sidebar
- Topbar
- Dashboard placeholder
- Dark mode enterprise theme
- Navigation menu
- Responsive layout
- Empty pages for Products, Listings, Orders, Tracking, Inventory, Locations, Pick Tasks, Packaging Rules and Settings.

Use Shadcn UI and Lucide icons.

Do not implement database logic yet.
```

---

# 17. Prompt para Fase 1

```txt
Implement Phase 1 for DockingWare Fulfillment.

Add Prisma and PostgreSQL support.

Create Prisma schema with:
Company, User, Product, Listing, Order, OrderItem, Warehouse, Location, InventoryItem, PackagingRule, PickTask, PickTaskItem, Bundle, BundleItem and AuditLog.

Create:
- lib/prisma.ts
- prisma/seed.ts
- .env.example
- basic auth utilities
- login page
- protected dashboard routes

Seed demo data:
- Demo company
- Admin user
- Warehouse
- Locations
- Products
- Inventory
- Listings
- Orders
- Packaging rules

Make sure `npx prisma migrate dev` and `npx prisma db seed` work.
```

---

# 18. Prompt para Fase 2

```txt
Implement Phase 2 Products Module.

Create complete Product CRUD.

Add:
- Product API route handlers
- Product service
- Product Zod validations
- Products table using TanStack Table
- Product create page
- Product edit page
- Product detail page
- Delete action with confirmation
- Search with minimum 3 characters
- Toast notifications
- Loading states
- Empty states

Fields:
masterSku, name, description, barcode, upc, brand, status, length, width, height, weight.

Keep code modular and production ready.
```

---

# 19. Prompt para Fase 3

```txt
Implement Phase 3 Listings and SKU Mapping.

Create Listings module.

Add:
- Listing API route handlers
- Listing service
- Listing validations with Zod
- Listings table
- Create listing form
- Edit listing form
- Product selector for mapping sellerSku to masterSku
- Marketplace enum selector
- Mapping status badge

Fields:
marketplace, sellerSku, asin, fnsku, externalId, productId, bundleQty.

The goal is to map marketplace SKUs to internal warehouse Master SKUs.
```

---

# 20. Prompt para Fase 4

```txt
Implement Phase 4 Orders and Tracking Lookup.

Create Orders module and Tracking Lookup module.

Add:
- Order API route handlers
- Order service
- Tracking lookup API route
- Orders table
- Order detail page
- Create demo order form if needed
- Tracking Lookup page

Tracking Lookup flow:
User enters tracking number.
System searches order by tracking number.
System displays:
- Order number
- Marketplace
- Carrier
- Status
- Items
- Seller SKU if available
- Master SKU
- Quantity
- Available inventory
- Suggested location
- Suggested packaging rule
- Button to generate pick task

Every tracking search must require at least 3 characters.
```

---

# 21. Prompt para Fase 5

```txt
Implement Phase 5 Inventory and Locations.

Create Inventory and Locations modules.

Add:
- Warehouse support
- Locations table
- Inventory table
- Inventory adjustment endpoint
- Location create/edit forms
- Inventory adjustment form
- Available quantity calculation

Inventory fields:
productId, locationId, onHand, allocated, available, lotNumber, expiresAt.

Location fields:
warehouseId, code, zone, aisle, rack, bin, isActive.

Inventory available must be calculated as:
available = onHand - allocated.
```

---

# 22. Prompt para Fase 6

```txt
Implement Phase 6 Pick Task Engine.

Create pick task generation from orders.

Add:
- Pick task service
- Generate pick task endpoint
- Pick task table
- Pick task detail page
- Pick task status workflow
- Assign product locations based on available inventory
- Allocate inventory when pick task is generated
- Prevent generating duplicate open pick tasks for same order
- Start pick task action
- Complete pick task action

Pick task statuses:
OPEN, IN_PROGRESS, COMPLETED, CANCELLED.
```

---

# 23. Prompt para Fase 7

```txt
Implement Phase 7 Packaging Rules.

Create Packaging Rules module.

Add:
- Packaging rules API
- Packaging rules service
- Packaging rules table
- Create/edit/delete packaging rule
- Packaging recommendation logic
- Display recommended packaging on Tracking Lookup and Order Detail

Rule selection:
- Match product if productId exists
- Match quantity between minQty and maxQty
- Return best fitting boxCode
```

---

# 24. Prompt para Fase 8

```txt
Implement Phase 8 Scanner Friendly UI.

Optimize Tracking Lookup and Pick Tasks for warehouse scanner usage.

Add:
- Large input fields
- Autofocus tracking input
- Barcode-friendly scan handling
- Large action buttons
- Mobile-first layout
- Clear success/error messages
- Pick validation by SKU/barcode/location
- Fast keyboard-free workflow

Do not remove desktop UI. Add responsive scanner mode.
```

---

# 25. Definition of Done

Cada fase debe cumplir:

```txt
Code compiles
No TypeScript errors
No ESLint critical errors
Prisma migration works
Seed works
UI is responsive
API validates input
Errors are handled
Loading states exist
Empty states exist
Search min 3 chars respected
No unrelated code changed
README updated
```

---

# 26. Comandos de Desarrollo

```bash
npm install
npm run dev
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run build
```

---

# 27. Variables de Entorno

Crear `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_SECRET="replace-with-secure-secret"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

Para Vercel, configurar:

```txt
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
APP_URL
```

---

# 28. Hosting en Vercel

El proyecto debe ser compatible con Vercel.

## Producción

Usar uno de estos proveedores PostgreSQL:

```txt
Neon
Supabase
Railway
Vercel Postgres
Aiven
```

## Deploy

```bash
npm run build
vercel deploy
```

---

# 29. Reglas para AI

AI debe seguir estas reglas:

```txt
No reescribir todo el proyecto si solo se pide una fase.
No cambiar diseño base sin autorización.
No crear features fuera de la fase actual.
No mezclar lógica de base de datos dentro de componentes visuales.
No duplicar servicios.
No ignorar validaciones.
No usar any salvo que sea estrictamente necesario.
No hardcodear datos de producción.
No romper deploy en Vercel.
Actualizar README al final de cada fase.
```

---

# 30. Orden Correcto de Implementación

Implementar así:

```txt
1. Fase 0 — Setup + UI Shell
2. Fase 1 — Prisma + DB + Auth
3. Fase 2 — Products
4. Fase 3 — Listings + SKU Mapping
5. Fase 4 — Orders + Tracking Lookup
6. Fase 5 — Inventory + Locations
7. Fase 6 — Pick Task Engine
8. Fase 7 — Packaging Rules
9. Fase 8 — Scanner Friendly UI
10. Fase 9 — Seed Demo + QA
```

---

# 31. Resultado Final del MVP

Al terminar el MVP, el usuario debe poder:

```txt
Login
Ver Dashboard
Crear productos
Crear listings
Mapear seller SKU a master SKU
Crear órdenes
Buscar orden por tracking
Ver ubicación del producto
Ver inventario disponible
Generar pick task
Ver packaging recomendado
Usar pantalla mobile/scanner
Deployar en Vercel
```

---

# 32. Primer Comando para AI

Usar este mensaje para comenzar:

```txt
Read DOCKINGWARE_FULFILLMENT_MASTER_PROMPT.md completely.

Implement only Phase 0 first.

Do not implement database or auth yet.

Create the Next.js application structure, AppShell, sidebar, topbar, dashboard placeholder, dark enterprise UI theme, and empty module pages.

Make the app clean, responsive, production-ready, and deployable to Vercel.

After finishing, update README with what was implemented and what the next phase is.
```

