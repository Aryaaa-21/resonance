export type JobName = "ai.analysis" | "evidence.processing" | "event.timeout" | "notification.dispatch" | "network.sync" | "solana.confirmation";

export interface Job<TPayload = unknown> {
  readonly id: string;
  readonly name: JobName;
  readonly payload: TPayload;
  readonly queuedAt: string;
}

/** Phase 2 job boundary. A future worker/queue can implement this contract. */
export interface JobDispatcher {
  enqueue<TPayload>(name: JobName, payload: TPayload): Promise<Job<TPayload>>;
}

export class InMemoryJobDispatcher implements JobDispatcher {
  async enqueue<TPayload>(name: JobName, payload: TPayload): Promise<Job<TPayload>> {
    return { id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, payload, queuedAt: new Date().toISOString() };
  }
}
