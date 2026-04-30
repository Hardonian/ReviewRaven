// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Error envelope factory for consistent API error responses

import { ErrorEnvelope } from './types';

const SCHEMA_VERSION = '1.0.0';

export function createErrorEnvelope(
  code: string,
  message: string,
  retryable: boolean,
  degraded = false,
  diagnosticsId?: string
): ErrorEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    code,
    message,
    retryable,
    degraded,
    diagnosticsId,
  };
}

export function errorResponse(
  code: string,
  message: string,
  retryable: boolean,
  status: number,
  degraded = false,
  diagnosticsId?: string
): Response {
  return Response.json(
    createErrorEnvelope(code, message, retryable, degraded, diagnosticsId),
    { status }
  );
}
