import { prisma } from "@/lib/prisma";
import { runConnectorSync } from "@/lib/connectors";

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

  // Run real connector sync in background
  runSync(companyId, job.id, conn.marketplace, type, conn.credentials as Record<string, string> ?? {}, conn.settings as Record<string, string> ?? {}).catch(() => {});

  return job;
}

async function runSync(
  companyId: string,
  jobId: string,
  marketplace: string,
  type: string,
  credentials: Record<string, string>,
  settings: Record<string, string>
) {
  let result = { imported: 0, skipped: 0, errors: [] as string[] };
  try {
    result = await runConnectorSync(companyId, marketplace, type, credentials, settings);
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: result.errors.length > 0 && result.imported === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        itemsProcessed: result.imported,
        itemsTotal: result.imported + result.skipped,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (err) {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errors: [(err as Error).message],
      },
    });
  }

  const job = await prisma.syncJob.findUnique({ where: { id: jobId }, select: { connectionId: true } });
  if (job) {
    await prisma.marketplaceConnection.update({
      where: { id: job.connectionId },
      data: { lastSyncAt: new Date() },
    });
  }
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
