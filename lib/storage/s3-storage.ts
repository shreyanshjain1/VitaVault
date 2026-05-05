import { createHash, createHmac } from "crypto";
import path from "path";
import type {
  DocumentStorageHealth,
  DocumentStorageProvider,
  DocumentStorageProviderId,
  ResolvedDocumentObject,
  SaveDocumentObjectInput,
  SavedDocumentObject,
} from "@/lib/storage/storage-types";

const EMPTY_BODY_HASH = createHash("sha256").update("").digest("hex");

type S3CompatibleConfig = {
  provider: Extract<DocumentStorageProviderId, "s3" | "r2">;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  keyPrefix: string;
  publicBaseUrl: string | null;
};

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeObjectKey(key: string) {
  return key.split("/").map(awsEncode).join("/");
}

function sanitizeOriginalName(value: string) {
  return path.basename(value || "document.bin").replace(/[^a-zA-Z0-9._-]/g, "-") || "document.bin";
}

function cleanPrefix(value: string | undefined) {
  return String(value || "documents")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "-") || "documents";
}

function normalizeObjectKey(value: string | null | undefined) {
  const raw = String(value || "").replace(/\\/g, "/").trim();
  if (!raw) return null;
  if (raw.startsWith("s3://")) {
    const withoutScheme = raw.slice("s3://".length);
    const [, ...keyParts] = withoutScheme.split("/");
    return keyParts.join("/") || null;
  }
  if (raw.startsWith("r2://")) {
    const withoutScheme = raw.slice("r2://".length);
    const [, ...keyParts] = withoutScheme.split("/");
    return keyParts.join("/") || null;
  }
  return raw.replace(/^\/+/, "");
}

function getProviderConfig(provider: Extract<DocumentStorageProviderId, "s3" | "r2">): S3CompatibleConfig | null {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || "";
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || "";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
  const region = process.env.S3_REGION || process.env.R2_REGION || (provider === "r2" ? "auto" : "us-east-1");

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    provider,
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    keyPrefix: cleanPrefix(process.env.DOCUMENT_STORAGE_PREFIX),
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || null,
  };
}

function requiredConfigDetail(provider: Extract<DocumentStorageProviderId, "s3" | "r2">) {
  const missing = [
    ["S3_ENDPOINT/R2_ENDPOINT", process.env.S3_ENDPOINT || process.env.R2_ENDPOINT],
    ["S3_BUCKET/R2_BUCKET", process.env.S3_BUCKET || process.env.R2_BUCKET],
    ["S3_ACCESS_KEY_ID/R2_ACCESS_KEY_ID", process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID],
    ["S3_SECRET_ACCESS_KEY/R2_SECRET_ACCESS_KEY", process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length === 0) {
    return `${provider.toUpperCase()} storage is configured for durable object storage.`;
  }

  return `Missing ${missing.join(", ")} for ${provider.toUpperCase()} document storage.`;
}

function hashHex(input: string | Buffer | Uint8Array) {
  return createHash("sha256").update(input).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function amzDateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function buildObjectUrl(config: S3CompatibleConfig, key: string) {
  const endpoint = new URL(config.endpoint);
  const encodedKey = encodeObjectKey(key);
  const basePath = endpoint.pathname.replace(/\/+$/g, "");

  if (config.forcePathStyle) {
    const canonicalUri = `${basePath}/${awsEncode(config.bucket)}/${encodedKey}`.replace(/\/+/g, "/");
    return {
      url: `${endpoint.protocol}//${endpoint.host}${canonicalUri}`,
      host: endpoint.host,
      canonicalUri,
    };
  }

  const host = `${config.bucket}.${endpoint.host}`;
  const canonicalUri = `${basePath}/${encodedKey}`.replace(/\/+/g, "/");
  return {
    url: `${endpoint.protocol}//${host}${canonicalUri}`,
    host,
    canonicalUri,
  };
}

function toArrayBuffer(input: Buffer | Uint8Array | string) {
  const source = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  const arrayBuffer = new ArrayBuffer(source.byteLength);
  new Uint8Array(arrayBuffer).set(source);
  return arrayBuffer;
}

function signedRequestInit(
  config: S3CompatibleConfig,
  method: "GET" | "PUT" | "DELETE",
  key: string,
  payload: Buffer | Uint8Array | string = "",
  contentType?: string
) {
  const payloadHash = method === "GET" || method === "DELETE" ? EMPTY_BODY_HASH : hashHex(payload);
  const { amzDate, dateStamp } = amzDateParts();
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const objectUrl = buildObjectUrl(config, key);

  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `host:${objectUrl.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");

  const canonicalRequest = [
    method,
    objectUrl.canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    hashHex(canonicalRequest),
  ].join("\n");

  const signature = hmacHex(signingKey(config.secretAccessKey, dateStamp, config.region), stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    Authorization: authorization,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (contentType) headers["Content-Type"] = contentType;

  return {
    url: objectUrl.url,
    init: {
      method,
      headers,
      body: method === "PUT" ? toArrayBuffer(payload) : undefined,
    } satisfies RequestInit,
  };
}

function ensureConfig(provider: Extract<DocumentStorageProviderId, "s3" | "r2">) {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error(requiredConfigDetail(provider));
  }
  return config;
}

function toResolved(provider: Extract<DocumentStorageProviderId, "s3" | "r2">, key: string | null | undefined): ResolvedDocumentObject | null {
  const objectKey = normalizeObjectKey(key);
  if (!objectKey) return null;

  return {
    provider,
    storage: "private",
    key: objectKey,
    filePath: objectKey,
  };
}

export function createS3CompatibleDocumentStorageProvider(
  provider: Extract<DocumentStorageProviderId, "s3" | "r2">
): DocumentStorageProvider {
  return {
    id: provider,
    label: provider === "r2" ? "Cloudflare R2 object storage" : "S3-compatible object storage",

    async save(input: SaveDocumentObjectInput): Promise<SavedDocumentObject> {
      const config = ensureConfig(provider);
      const fileName = `${Date.now()}-${sanitizeOriginalName(input.originalName)}`;
      const key = `${config.keyPrefix}/${fileName}`;
      const request = signedRequestInit(config, "PUT", key, input.bytes, input.mimeType || "application/octet-stream");
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Document upload failed with ${response.status} ${response.statusText}.`);
      }

      return {
        provider,
        storage: "private",
        key,
        filePath: key,
        fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      };
    },

    async delete(filePath: string | null | undefined) {
      const resolved = toResolved(provider, filePath);
      if (!resolved) return;
      const config = ensureConfig(provider);
      const request = signedRequestInit(config, "DELETE", resolved.key);
      const response = await fetch(request.url, request.init);

      if (!response.ok && response.status !== 404) {
        throw new Error(`Document delete failed with ${response.status} ${response.statusText}.`);
      }
    },

    resolve(filePath: string | null | undefined) {
      return toResolved(provider, filePath);
    },

    async read(filePath: string) {
      const resolved = toResolved(provider, filePath);
      if (!resolved) {
        throw new Error("Document storage path is invalid.");
      }

      const config = ensureConfig(provider);
      const request = signedRequestInit(config, "GET", resolved.key);
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Document read failed with ${response.status} ${response.statusText}.`);
      }

      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        resolved,
      };
    },

    health(): DocumentStorageHealth {
      const config = getProviderConfig(provider);
      if (!config) {
        return {
          provider,
          label: provider === "r2" ? "Cloudflare R2 object storage" : "S3-compatible object storage",
          mode: "private",
          ready: false,
          productionReady: false,
          detail: requiredConfigDetail(provider),
        };
      }

      return {
        provider,
        label: provider === "r2" ? "Cloudflare R2 object storage" : "S3-compatible object storage",
        mode: "private",
        ready: true,
        productionReady: true,
        detail: `${provider.toUpperCase()} object storage is configured for bucket ${config.bucket} with prefix ${config.keyPrefix}.`,
      };
    },
  };
}
