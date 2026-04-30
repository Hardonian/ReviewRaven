// Re-export from shared-intelligence failure registry
// Migration note: Local failure registry replaced by shared-intelligence
export { sharedFailureScenarios as failureScenarios, findFailureScenario, getFailureUserMessage } from '@reviewraven/shared-intelligence';
export type { FailureScenario } from '@reviewraven/shared-intelligence';
