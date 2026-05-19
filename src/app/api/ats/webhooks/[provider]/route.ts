import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  isATSProviderKey,
  type ATSProviderKey,
  type ATSSyncEvent,
} from "@/domain/ats-integrations/types";
import { getATSAdapter } from "@/lib/ats-integrations/registry";
import { runATSSync } from "@/lib/ats-integrations/sync";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";

type ATSWebhookRouteContext = {
  params: Promise<{ provider: string }>;
};

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function configuredWebhookSecret() {
  return process.env.ATS_WEBHOOK_SECRET?.trim() || null;
}

function requestWebhookSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const bearerPrefix = "Bearer ";

  if (authorization.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  return request.headers.get("x-ats-webhook-secret")?.trim() || null;
}

function authorizeWebhookRequest(request: Request) {
  const expectedSecret = configuredWebhookSecret();

  if (!expectedSecret) {
    return {
      ok: false,
      status: 503,
      error: "ATS webhook secret is not configured.",
    } as const;
  }

  if (requestWebhookSecret(request) !== expectedSecret) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized ATS webhook request.",
    } as const;
  }

  return { ok: true } as const;
}

function stringField(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function webhookObjectType(
  payload: Record<string, unknown>,
): ATSSyncEvent["externalObjectType"] {
  const value = stringField(payload, "objectType");

  return value === "job" ||
    value === "candidate" ||
    value === "application" ||
    value === "stage"
    ? value
    : "provider_webhook";
}

function webhookBodyHash(body: string) {
  return createHash("sha256").update(body).digest("hex");
}

function webhookEventId(payload: Record<string, unknown>, body: string) {
  return (
    stringField(payload, "id") ??
    stringField(payload, "eventId") ??
    stringField(payload, "webhookEventId") ??
    webhookBodyHash(body)
  );
}

function findWebhookConnection(input: {
  state: RuntimeStoreState;
  provider: ATSProviderKey;
  payload: Record<string, unknown>;
}) {
  const payloadConnectionId = stringField(input.payload, "connectionId");
  const activeConnections = input.state.atsConnections.filter(
    (connection) =>
      connection.provider === input.provider && connection.status === "active",
  );

  if (payloadConnectionId) {
    return activeConnections.find(
      (connection) => connection.id === payloadConnectionId,
    );
  }

  return activeConnections.length === 1 ? activeConnections[0] : null;
}

async function persistWebhookEvent(input: {
  provider: ATSProviderKey;
  payload: Record<string, unknown>;
  body: string;
}) {
  const state = await loadRuntimeStoreState();
  const connection = findWebhookConnection({
    state,
    provider: input.provider,
    payload: input.payload,
  });

  if (!connection) {
    return {
      persisted: false,
      duplicate: false,
      companyId: null,
      connectionId: null,
    };
  }

  const eventId = webhookEventId(input.payload, input.body);
  const objectType = webhookObjectType(input.payload);
  const externalObjectId =
    stringField(input.payload, "objectId") ??
    stringField(input.payload, "externalObjectId") ??
    eventId;
  const idempotencyKey = [
    connection.id,
    "provider_webhook_received",
    input.provider,
    eventId,
  ].join(":");
  const duplicate = state.atsSyncEvents.some(
    (event) => event.idempotencyKey === idempotencyKey,
  );

  if (duplicate) {
    return {
      persisted: true,
      duplicate: true,
      companyId: connection.companyId,
      connectionId: connection.id,
    };
  }

  state.atsSyncEvents.push({
    id: `ats_evt_webhook_${sanitizeIdPart(idempotencyKey)}`,
    companyId: connection.companyId,
    connectionId: connection.id,
    provider: input.provider,
    eventType: "provider_webhook_received",
    externalObjectType: objectType,
    externalObjectId,
    externalJobId: stringField(input.payload, "externalJobId"),
    externalCandidateId: stringField(input.payload, "externalCandidateId"),
    externalStageId: stringField(input.payload, "externalStageId"),
    occurredAt: new Date().toISOString(),
    processedAt: null,
    idempotencyKey,
    payload: input.payload,
  });

  await saveRuntimeStoreState(state);

  return {
    persisted: true,
    duplicate: false,
    companyId: connection.companyId,
    connectionId: connection.id,
  };
}

export async function POST(request: Request, context: ATSWebhookRouteContext) {
  const { provider } = await context.params;

  if (!isATSProviderKey(provider)) {
    return NextResponse.json(
      { error: "Unsupported ATS provider." },
      { status: 400 },
    );
  }

  const authorization = authorizeWebhookRequest(request);

  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const body = await request.text();
  const payload = (() => {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  })();

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "ATS webhook payload must be valid JSON." },
      { status: 400 },
    );
  }
  const webhookPayload = payload as Record<string, unknown>;

  let adapter;
  try {
    adapter = getATSAdapter(provider);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ATS provider is not implemented yet.",
      },
      { status: 501 },
    );
  }

  if (!adapter.capabilities.supportsWebhooks) {
    return NextResponse.json(
      { error: "ATS provider does not support webhooks." },
      { status: 501 },
    );
  }

  const persistence = await persistWebhookEvent({
    provider,
    payload: webhookPayload,
    body,
  });
  const sync =
    persistence.persisted &&
    !persistence.duplicate &&
    persistence.companyId &&
    persistence.connectionId
      ? await runATSSync({
          companyId: persistence.companyId,
          connectionId: persistence.connectionId,
          now: new Date().toISOString(),
        })
          .then((result) => ({
            status: "succeeded" as const,
            result,
            errorMessage: null,
          }))
          .catch((error) => ({
            status: "failed" as const,
            result: null,
            errorMessage:
              error instanceof Error ? error.message : "ATS webhook sync failed.",
          }))
      : {
          status: "skipped" as const,
          result: null,
          errorMessage: persistence.duplicate
            ? "Duplicate webhook event."
            : "No active ATS connection matched the webhook.",
        };

  return NextResponse.json(
    {
      status: "accepted",
      provider,
      persisted: persistence.persisted,
      duplicate: persistence.duplicate,
      sync,
    },
    { status: 202 },
  );
}
