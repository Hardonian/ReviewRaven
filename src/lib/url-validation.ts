// Re-export from shared-core validation
// Migration note: Local URL validation replaced by shared-core validation helpers
export { validateUrl, ALLOWED_HOSTS, BLOCKED_IP_PATTERNS } from '@reviewraven/shared-core';
export type { ValidationResult } from '@reviewraven/shared-core';
