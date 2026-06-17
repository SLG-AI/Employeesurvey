/**
 * Invoked immediately after a single recipient has been successfully reached,
 * so the caller can persist delivery state incrementally (crash-safe). Awaited
 * by the send loops so a marking failure is observable.
 */
export type OnSentCallback = (email: string) => void | Promise<void>;
