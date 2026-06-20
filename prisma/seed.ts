import "dotenv/config";
import { PrismaClient, Marketplace, OrderStatus, ProductStatus } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding DockingWare demo data...");

  // Company
  const company = await prisma.company.upsert({
    where: { slug: "dockingware-demo" },
    update: {},
    create: {
      name: "DockingWare Demo",
      slug: "dockingware-demo",
    },
  });
  console.log(`✓ Company: ${company.name}`);

  // Admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@dockingware.local" },
    update: {},
    create: {
      companyId: company.id,
      email: "admin@dockingware.local",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`✓ User: ${user.email}`);

  // Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_code: { companyId: company.id, code: "WH-01" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Main Warehouse",
      code: "WH-01",
      address: "123 Fulfillment Ave, Suite 100",
    },
  });
  console.log(`✓ Warehouse: ${warehouse.code}`);

  // Locations
  const locationCodes = [
    { code: "A01-R01-B01", zone: "A", aisle: "01", rack: "R01", bin: "B01" },
    { code: "A01-R01-B02", zone: "A", aisle: "01", rack: "R01", bin: "B02" },
    { code: "A01-R02-B03", zone: "A", aisle: "01", rack: "R02", bin: "B03" },
  ];

  const locations: Record<string, { id: string }> = {};
  for (const loc of locationCodes) {
    const l = await prisma.location.upsert({
      where: { warehouseId_code: { warehouseId: warehouse.id, code: loc.code } },
      update: {},
      create: {
        warehouseId: warehouse.id,
        code: loc.code,
        zone: loc.zone,
        aisle: loc.aisle,
        rack: loc.rack,
        bin: loc.bin,
      },
    });
    locations[loc.code] = l;
  }
  console.log(`✓ Locations: ${locationCodes.map((l) => l.code).join(", ")}`);

  // Products
  const productsData = [
    { masterSku: "WH-AA", name: "Widget Alpha", description: "Standard widget alpha unit", barcode: "WH-AA-001", brand: "WarehouseBrand" },
    { masterSku: "WH-AAA", name: "Widget Alpha Pro", description: "Pro widget alpha unit", barcode: "WH-AAA-001", brand: "WarehouseBrand" },
    { masterSku: "KIT-16", name: "Kit 16-Pack", description: "Bundle kit of 16 units", barcode: "KIT-16-001", brand: "WarehouseBrand" },
  ];

  const products: Record<string, { id: string }> = {};
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { companyId_masterSku: { companyId: company.id, masterSku: p.masterSku } },
      update: {},
      create: {
        companyId: company.id,
        masterSku: p.masterSku,
        name: p.name,
        description: p.description,
        barcode: p.barcode,
        brand: p.brand,
        status: ProductStatus.ACTIVE,
      },
    });
    products[p.masterSku] = product;
  }
  console.log(`✓ Products: ${productsData.map((p) => p.masterSku).join(", ")}`);

  // Listings
  const listingsData = [
    { marketplace: Marketplace.AMAZON, sellerSku: "AMZ-AA-16", masterSku: "WH-AA", bundleQty: 16 },
    { marketplace: Marketplace.WALMART, sellerSku: "WMT-AA-24", masterSku: "WH-AA", bundleQty: 24 },
    { marketplace: Marketplace.EBAY, sellerSku: "EBY-AAA-10", masterSku: "WH-AAA", bundleQty: 10 },
  ];

  for (const l of listingsData) {
    await prisma.listing.upsert({
      where: {
        companyId_marketplace_sellerSku: {
          companyId: company.id,
          marketplace: l.marketplace,
          sellerSku: l.sellerSku,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        productId: products[l.masterSku].id,
        marketplace: l.marketplace,
        sellerSku: l.sellerSku,
        bundleQty: l.bundleQty,
      },
    });
  }
  console.log(`✓ Listings: ${listingsData.map((l) => l.sellerSku).join(", ")}`);

  // Inventory
  const inv1 = await prisma.inventoryItem.findFirst({
    where: { productId: products["WH-AA"].id, locationId: locations["A01-R02-B03"].id, lotNumber: null },
  });
  if (inv1) {
    await prisma.inventoryItem.update({ where: { id: inv1.id }, data: { onHand: 500, available: 500 } });
  } else {
    await prisma.inventoryItem.create({
      data: { productId: products["WH-AA"].id, locationId: locations["A01-R02-B03"].id, onHand: 500, allocated: 0, available: 500 },
    });
  }

  const inv2 = await prisma.inventoryItem.findFirst({
    where: { productId: products["WH-AAA"].id, locationId: locations["A01-R01-B01"].id, lotNumber: null },
  });
  if (inv2) {
    await prisma.inventoryItem.update({ where: { id: inv2.id }, data: { onHand: 300, available: 300 } });
  } else {
    await prisma.inventoryItem.create({
      data: { productId: products["WH-AAA"].id, locationId: locations["A01-R01-B01"].id, onHand: 300, allocated: 0, available: 300 },
    });
  }
  console.log(`✓ Inventory seeded`);

  // Orders
  const order1 = await prisma.order.upsert({
    where: { companyId_orderNumber: { companyId: company.id, orderNumber: "#10001" } },
    update: {},
    create: {
      companyId: company.id,
      marketplace: Marketplace.AMAZON,
      orderNumber: "#10001",
      externalOrderId: "AMZ-ORDER-10001",
      trackingNumber: "1Z999999999",
      carrier: "UPS",
      status: OrderStatus.READY_TO_PICK,
    },
  });

  await prisma.orderItem.deleteMany({ where: { orderId: order1.id } });
  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: products["WH-AA"].id,
      quantity: 32,
    },
  });

  const order2 = await prisma.order.upsert({
    where: { companyId_orderNumber: { companyId: company.id, orderNumber: "#10002" } },
    update: {},
    create: {
      companyId: company.id,
      marketplace: Marketplace.WALMART,
      orderNumber: "#10002",
      externalOrderId: "WMT-ORDER-10002",
      trackingNumber: "940011189922385",
      carrier: "USPS",
      status: OrderStatus.NEW,
    },
  });

  await prisma.orderItem.deleteMany({ where: { orderId: order2.id } });
  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: products["WH-AAA"].id,
      quantity: 10,
    },
  });
  // Additional demo orders
  const extraOrders = [
    {
      orderNumber: "#10003",
      externalOrderId: "EBY-ORDER-10003",
      trackingNumber: "1Z888888888",
      carrier: "UPS",
      marketplace: Marketplace.EBAY,
      status: OrderStatus.PICKING,
      masterSku: "WH-AAA",
      quantity: 20,
    },
    {
      orderNumber: "#10004",
      externalOrderId: "AMZ-ORDER-10004",
      trackingNumber: "9400111899223850001",
      carrier: "USPS",
      marketplace: Marketplace.AMAZON,
      status: OrderStatus.PACKED,
      masterSku: "WH-AA",
      quantity: 5,
    },
    {
      orderNumber: "#10005",
      externalOrderId: "WMT-ORDER-10005",
      trackingNumber: "773849201",
      carrier: "FedEx",
      marketplace: Marketplace.WALMART,
      status: OrderStatus.SHIPPED,
      masterSku: "WH-AAA",
      quantity: 10,
    },
  ];

  for (const o of extraOrders) {
    const order = await prisma.order.upsert({
      where: { companyId_orderNumber: { companyId: company.id, orderNumber: o.orderNumber } },
      update: {},
      create: {
        companyId: company.id,
        marketplace: o.marketplace,
        orderNumber: o.orderNumber,
        externalOrderId: o.externalOrderId,
        trackingNumber: o.trackingNumber,
        carrier: o.carrier,
        status: o.status,
      },
    });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.create({
      data: { orderId: order.id, productId: products[o.masterSku].id, quantity: o.quantity },
    });
  }
  console.log(`✓ Orders: #10001–#10005`);

  // Packaging Rules
  const packagingRules = [
    { name: "Small Box", boxCode: "BOX-S", minQty: 1, maxQty: 10, length: 10, width: 8, height: 6, weightLimit: 5 },
    { name: "Medium Box", boxCode: "BOX-M", minQty: 11, maxQty: 50, length: 14, width: 12, height: 10, weightLimit: 20 },
    { name: "Large Box", boxCode: "BOX-L", minQty: 51, maxQty: 200, length: 20, width: 16, height: 14, weightLimit: 50 },
  ];

  for (const rule of packagingRules) {
    const existing = await prisma.packagingRule.findFirst({
      where: { companyId: company.id, boxCode: rule.boxCode },
    });
    if (!existing) {
      await prisma.packagingRule.create({
        data: { companyId: company.id, ...rule },
      });
    }
  }
  console.log(`✓ Packaging Rules: BOX-S, BOX-M, BOX-L`);

  console.log("\n✅ Seed complete!");
  console.log("   Login: admin@dockingware.local / Admin123!");
  console.log("   Tracking demo: 1Z999999999 → Order #10001 → WH-AA x32 → A01-R02-B03 → BOX-M");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
