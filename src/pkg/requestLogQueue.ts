// lib/accessLogQueue.ts
import { db } from "../config/database";
import { accessLog, NewAccessLog } from "../models/AccessLog";
import { NewOperationLog, operationLog } from "../models/OperationLog";

interface enqueueOperationType {
  req: any;
  status: string;
  operation: string;
  metadata: Record<string, any>;
}
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 10_000;

let accessQueue: NewAccessLog[] = [];
let operationQueue: NewOperationLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;

export function enqueueAccessLog(entry: NewAccessLog) {
  // console.log(entry)
  accessQueue.push(entry);

  if (accessQueue.length >= MAX_QUEUE_SIZE) {
    flush(); // size trigger — flush immediately, don't wait for the timer
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

export function enqueueOperationLog(entry: enqueueOperationType) {

  const employeeId = entry.req?.user.id ?? '-';
  const traceId = entry.req.trace_id ?? 'ca';

  operationQueue.push({
    traceId,
    operation: entry.operation,
    status: entry.status,
    employeeId,
    metadata: entry.metadata,
  });
  
  //   if (operationQueue.length >= MAX_QUEUE_SIZE) {
  //     flush(); // size trigger — flush immediately, don't wait for the timer
  //     return;
  //   }
  //   if (!flushTimer) {
  //     flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  //   }
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (accessQueue.length === 0) return;

  // Swap the accessQueue out immediately so new entries arriving during the
  // DB write don't get lost or double-flushed.
  const accessBatch = accessQueue;
  const operationBatch = operationQueue;
  accessQueue = [];
  operationQueue = [];

  try {
    await db.insert(accessLog).values(accessBatch);
    if (operationBatch.length === 0) {
      return;
    }
    await db.insert(operationLog).values(operationBatch);
  } catch (err) {
    console.error("Failed to flush request log batch:", err);
    // Optional: re-queue on failure, at the cost of possible duplicates on retry.
    // queue = [...batch, ...queue];
  }
}

// Ensure logs aren't lost if the process shuts down cleanly
process.on("SIGTERM", flush);
process.on("SIGINT", flush);
