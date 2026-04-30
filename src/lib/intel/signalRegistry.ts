// Re-export from shared-intelligence signal registry
// Migration note: Local signal registry replaced by shared-intelligence
export { sharedSignals as reviewSignals, createSignalRegistry, SignalRegistry } from '@reviewraven/shared-intelligence';
export type { SignalDefinition as ReviewSignal } from '@reviewraven/shared-intelligence';
