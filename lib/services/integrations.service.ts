import { prisma } from "@/lib/prisma";

const connectionInclude = {
  syncJobs: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

export async function getConnections(companyId: string) {
  return prisma.marketplaceConnection.findMany({
    where: { companyId },
    include: connectionInclude,
    orderBy: { marketplace: "asc" },
  });
}

export async function getConnectionById(companyId: string, id: string) {
  return prisma.marketplaceConnection.findFirst({
    where: { id, companyId },
    include: connectionInclude,
  });
}

export async function createConnection(
  companyId: string,
  input: {
    marketplace: string;
    name: string;
    credentials?: Record<string, string>;
    settings?: Record<string, string>;
  }
) {
  return prisma.marketplaceConnection.create({
    data: {
      companyId,
      marketplace: input.marketplace as never,
      name: input.name,
      credentials: input.credentials ?? {},
      settings: input.settings ?? {},
      status: "INACTIVE",
    },
    include: connectionInclude,
  });
}

export async function updateConnection(
  companyId: string,
  id: string,
  input: {
    name?: string;
    status?: string;
    credentials?: Record<string, string>;
    settings?: Record<string, string>;
    lastSyncAt?: Date;
  }
) {
  const conn = await prisma.marketplaceConnection.findFirst({ where: { id, companyId } });
  if (!conn) throw new Error("Not found");
  return prisma.marketplaceConnection.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.status && { status: input.status as never }),
      ...(input.credentials && { credentials: input.credentials }),
      ...(input.settings && { settings: input.settings }),
      ...(input.lastSyncAt && { lastSyncAt: input.lastSyncAt }),
    },
    include: connectionInclude,
  });
}

export async function deleteConnection(companyId: string, id: string) {
  const conn = await prisma.marketplaceConnection.findFirst({ where: { id, companyId } });
  if (!conn) throw new Error("Not found");
  await prisma.syncJob.deleteMany({ where: { connectionId: id } });
  await prisma.webhookLog.deleteMany({ where: { connectionId: id } });
  await prisma.marketplaceConnection.delete({ where: { id } });
}

// Sync Jobs
const syncJobInclude = {
  connection: { select: { id: true, name: true, marketplace: true } },
};

export async function getSyncJobs(
  companyId: string,
  params: { connectionId?: string; page: number; limit: number }
) {
  const where = {
    companyId,
    ...(params.connectionId && { connectionId: params.connectionId }),
  };
  const [data, total] = await Promise.all([
    prisma.syncJob.findMany({
      where,
      include: syncJobInclude,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.syncJob.count({ where }),
  ]);
  return { data, total };
}

export async function triggerSync(
  companyId: string,
  connectionId: string,
  type: string
) {
  const conn = await prisma.marketplaceConnection.findFirst({
    where: { id: connectionId, companyId },
  });
  if (!conn) throw new Error("Connection not found");
  if (conn.status !== "ACTIVE") throw new Error("Connection is not active");

  // Create sync job and simulate run
  const job = await prisma.syncJob.create({
    data: {
      companyId,
      connectionId,
      type: type as never,
      status: "RUNNING",
      startedAt: new Date(),
    },
    include: syncJobInclude,
  });

  // Simulate async work — in production this would be a background job/queue
  simulateSync(companyId, job.id, conn.marketplace, type).catch(() => {});

  return job;
}

async function simulateSync(
  companyId: string,
  jobId: string,
  marketplace: string,
  type: string
) {
  await new Promise((r) => setTimeout(r, 2000));

  if (type === "ORDERS") {
    // Simulate importing 3 orders
    const products = await prisma.product.findMany({
      where: { companyId },
      take: 2,
      select: { id: true },
    });

    let imported = 0;
    if (products.length > 0) {
      for (let i = 0; i < 3; i++) {
        const orderNum = `#SYN-${Date.now()}-${i}`;
        const existing = await prisma.order.findFirst({
          where: { companyId, orderNumber: orderNum },
        });
        if (!existing) {
          const order = await prisma.order.create({
            data: {
              companyId,
              marketplace: marketplace as never,
              orderNumber: orderNum,
              externalOrderId: `EXT-${Date.now()}-${i}`,
              status: "NEW",
            },
          });
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: products[i % products.length].id,
              quantity: Math.ceil(Math.random() * 5) + 1,
            },
          });
          imported++;
        }
      }
    }

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        itemsTotal: 3,
        itemsProcessed: imported,
      },
    });
  } else {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        itemsTotal: 0,
        itemsProcessed: 0,
      },
    });
  }

  await prisma.marketplaceConnection.update({
    where: { id: (await prisma.syncJob.findUnique({ where: { id: jobId }, select: { connectionId: true } }))!.connectionId },
    data: { lastSyncAt: new Date() },
  });
}

// Webhook Logs
export async function getWebhookLogs(
  companyId: string,
  params: { connectionId?: string; page: number; limit: number }
) {
  const where = {
    companyId,
    ...(params.connectionId && { connectionId: params.connectionId }),
  };
  const [data, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where,
      include: { connection: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.webhookLog.count({ where }),
  ]);
  return { data, total };
}

export async function ingestWebhook(
  companyId: string,
  marketplace: string,
  event: string,
  payload: unknown,
  connectionId?: string
) {
  return prisma.webhookLog.create({
    data: {
      companyId,
      marketplace: marketplace as never,
      event,
      payload: payload as never,
      status: "RECEIVED",
      connectionId,
    },
  });
}
