import type { Marketplace } from "./listing";

export type ConnectorStatus = "ACTIVE" | "INACTIVE" | "ERROR";
export type SyncJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type SyncJobType = "ORDERS" | "INVENTORY" | "LISTINGS" | "PRODUCTS";

export interface MarketplaceConnection {
  id: string;
  companyId: string;
  marketplace: Marketplace;
  name: string;
  status: ConnectorStatus;
  credentials: Record<string, string> | null;
  settings: Record<string, string> | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  companyId: string;
  connectionId: string;
  type: SyncJobType;
  status: SyncJobStatus;
  startedAt: string | null;
  completedAt: string | null;
  itemsTotal: number | null;
  itemsProcessed: number | null;
  errors: unknown[] | null;
  createdAt: string;
  updatedAt: string;
  connection: { id: string; name: string; marketplace: Marketplace } | null;
}

export interface WebhookLog {
  id: string;
  companyId: string;
  connectionId: string | null;
  marketplace: Marketplace;
  event: string;
  payload: unknown;
  status: "RECEIVED" | "PROCESSED" | "FAILED";
  error: string | null;
  processedAt: string | null;
  createdAt: string;
  connection: { id: string; name: string } | null;
}

// Connector field definitions per marketplace (for setup forms)
export interface ConnectorField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "password" | "url";
  required: boolean;
  isCredential: boolean; // goes to credentials vs settings
}

export const CONNECTOR_FIELDS: Record<Marketplace, ConnectorField[]> = {
  AMAZON: [
    { key: "sellerId", label: "Seller ID", placeholder: "AXXXXXXXXXX", type: "text", required: true, isCredential: false },
    { key: "accessKeyId", label: "LWA Client ID", placeholder: "amzn1.application-oa2-client…", type: "text", required: true, isCredential: true },
    { key: "secretKey", label: "LWA Client Secret", placeholder: "••••••••••••", type: "password", required: true, isCredential: true },
    { key: "refreshToken", label: "Refresh Token", placeholder: "Atzr|…", type: "password", required: true, isCredential: true },
    { key: "region", label: "Region", placeholder: "us-east-1", type: "text", required: true, isCredential: false },
  ],
  WALMART: [
    { key: "clientId", label: "Client ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text", required: true, isCredential: true },
    { key: "clientSecret", label: "Client Secret", placeholder: "••••••••••••", type: "password", required: true, isCredential: true },
  ],
  EBAY: [
    { key: "appId", label: "App ID", placeholder: "YourApp-…", type: "text", required: true, isCredential: true },
    { key: "certId", label: "Cert ID", placeholder: "••••••••••••", type: "password", required: true, isCredential: true },
    { key: "devId", label: "Dev ID", placeholder: "xxxxxxxx-xxxx-…", type: "text", required: true, isCredential: true },
    { key: "userToken", label: "User Token", placeholder: "AgAAAAA**…", type: "password", required: true, isCredential: true },
  ],
  SHOPIFY: [
    { key: "shopUrl", label: "Shop URL", placeholder: "mystore.myshopify.com", type: "url", required: true, isCredential: false },
    { key: "accessToken", label: "Admin API Access Token", placeholder: "shpat_…", type: "password", required: true, isCredential: true },
  ],
  VEEQO: [
    { key: "apiKey", label: "API Key", placeholder: "••••••••••••", type: "password", required: true, isCredential: true },
  ],
  MANUAL: [],
};
