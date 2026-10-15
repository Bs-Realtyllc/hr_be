import { db } from "../config/database";
import { accessLog, NewAccessLog } from "../models/AccessLog";
import { NewOperationLog, operationLog } from "../models/OperationLog";
import { getContext } from "./requestContext";

interface EnqueueOperationType {
  status: "success" | "failure";
  operation: string;
  metadata: Record<string, unknown>;
}

const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 1_000;

let accessQueue: NewAccessLog[] = [];
let operationQueue: NewOperationLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function scheduleFlush() {
  if (accessQueue.length >= MAX_QUEUE_SIZE || operationQueue.length >= MAX_QUEUE_SIZE) {
    void flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
}

export function enqueueAccessLog(entry: NewAccessLog) {
  accessQueue.push(entry);
  scheduleFlush();
}

export function enqueueOperationLog(entry: EnqueueOperationType) {
  const ctx = getContext(); // no req needed

  operationQueue.push({
    traceId: ctx?.traceId ?? '-',
    employeeId: ctx?.employeeId ?? null,
    operation: entry.operation,
    status: entry.status,
    metadata: entry.metadata,
  });
  scheduleFlush();
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (accessQueue.length === 0 && operationQueue.length === 0) return;

  const accessBatch = accessQueue;
  const operationBatch = operationQueue;
  accessQueue = [];
  operationQueue = [];

  if (accessBatch.length) {
    try {
      await db.insert(accessLog).values(accessBatch);
    } catch (err) {
      console.error("Failed to flush access log batch:", err);
    }
  }
  if (operationBatch.length) {
    try {
      await db.insert(operationLog).values(operationBatch);
    } catch (err) {
      console.error("Failed to flush operation log batch:", err);
    }
  }
}

async function shutdown() {
  await flush();
  process.exit(0);
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);