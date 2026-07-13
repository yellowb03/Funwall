import type {
  SessionEventEmitter,
  SessionEventEnvelope,
} from "@/domain/session-events";

export interface SessionEventBufferOptions {
  sessionId: string;
  /** Max events per flush batch. Default 20. */
  batchSize?: number;
  /** Auto-flush interval ms. Default 1500. Set 0 to disable timer flush. */
  flushIntervalMs?: number;
  /** Elapsed-ms provider (timer active elapsed). */
  getElapsedMs: () => number;
  /** Persist batch. May reject for retry. */
  flush: (events: SessionEventEnvelope[]) => Promise<void>;
  /** Optional clock for tests. */
  now?: () => number;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
}

/**
 * Buffers session events with monotonic sequence and batched mock flush.
 * @see agent-work/shared/CONTRACTS.md §8
 */
export class SessionEventBuffer implements SessionEventEmitter {
  private sequence = 0;
  private readonly pending: SessionEventEnvelope[] = [];
  private readonly sessionId: string;
  private readonly batchSize: number;
  private readonly getElapsedMs: () => number;
  private readonly flushFn: (events: SessionEventEnvelope[]) => Promise<void>;
  private flushing = false;
  private disposed = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private retryQueue: SessionEventEnvelope[] = [];

  constructor(options: SessionEventBufferOptions) {
    this.sessionId = options.sessionId;
    this.batchSize = options.batchSize ?? 20;
    this.getElapsedMs = options.getElapsedMs;
    this.flushFn = options.flush;

    const flushInterval = options.flushIntervalMs ?? 1500;
    if (flushInterval > 0) {
      const setInt = options.setIntervalFn ?? setInterval;
      this.intervalId = setInt(() => {
        void this.flush();
      }, flushInterval);
    }
  }

  emit(event: Omit<SessionEventEnvelope, "sessionId" | "sequence">): void {
    if (this.disposed) return;

    this.sequence += 1;
    const envelope: SessionEventEnvelope = {
      sessionId: this.sessionId,
      sequence: this.sequence,
      type: event.type,
      elapsedMs: event.elapsedMs ?? this.getElapsedMs(),
      itemId: event.itemId,
      metadata: event.metadata,
    };
    this.pending.push(envelope);

    if (this.pending.length >= this.batchSize) {
      void this.flush();
    }
  }

  /** Current sequence (last assigned). */
  getSequence(): number {
    return this.sequence;
  }

  /** Pending unflushed count (including retry queue). */
  pendingCount(): number {
    return this.pending.length + this.retryQueue.length;
  }

  async flush(): Promise<void> {
    if (this.disposed || this.flushing) return;

    const batch = [...this.retryQueue, ...this.pending.splice(0)];
    this.retryQueue = [];
    if (batch.length === 0) return;

    this.flushing = true;
    try {
      // Chunk by batchSize for large backlogs.
      for (let i = 0; i < batch.length; i += this.batchSize) {
        const chunk = batch.slice(i, i + this.batchSize);
        await this.flushFn(chunk);
      }
    } catch {
      // Offline / network: re-queue for retry.
      this.retryQueue = [...batch, ...this.retryQueue];
    } finally {
      this.flushing = false;
    }
  }

  dispose(): void {
    this.disposed = true;
    if (this.intervalId !== null) {
      const clearInt = clearInterval;
      clearInt(this.intervalId);
      this.intervalId = null;
    }
  }
}

export function createSessionEventBuffer(
  options: SessionEventBufferOptions,
): SessionEventBuffer {
  return new SessionEventBuffer(options);
}
