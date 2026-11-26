import { Schema, model, Document } from 'mongoose';

// A segment is one capture window with exactly one screenshot attempt,
// so the screenshot fields live directly on this document.
export interface ITrackerSegment extends Document {
  clockId:        number;
  employeeId:     number;
  companyId:      number;
  windowStart:    Date;
  windowEnd:      Date;
  activeSeconds:  number;
  idleSeconds:    number;
  // One entry per minute of this segment's length — true if that minute
  // had any input. Array length matches the segment's own duration.
  activeMinutes:  boolean[];
  keyPresses:     number;
  mouseClicks:    number;
  mouseMoves:     number;
  // The app that was active at the moment of the screenshot capture, not a
  // summary of every app used during the segment — several can be used
  // within one segment. Null when no screenshot was captured.
  activeAppName:  string | null;
  // Null when the capture failed client-side (permissions, timing) or was
  // never attempted — the segment still counts toward raw clocked time, just
  // not toward verified time.
  capturedAt:     Date | null;
  minioObjectKey: string | null;
  // True when this segment ended because the idle-prompt timed out with no
  // response, rather than running its normal full length — the screenshot
  // on it was captured right at that moment specifically to document it.
  idleTriggered:  boolean;
  // Set once the screenshot backing this segment is deleted — with one
  // screenshot per segment, losing it means losing all evidence for it.
  excluded:       boolean;
  excludedAt:     Date | null;
  excludedBy:     number | null;
  createdAt:      Date;
  updatedAt:      Date;
}

const trackerSegmentSchema = new Schema<ITrackerSegment>(
  {
    clockId:       { type: Number, required: true, index: true },
    employeeId:    { type: Number, required: true, index: true },
    // Single-tenant today (always 1) — kept from day one so tenant scoping
    // doesn't require a backfill once this becomes a multi-tenant product.
    companyId:     { type: Number, required: true, default: 1 },
    windowStart:   { type: Date, required: true },
    windowEnd:     { type: Date, required: true },
    activeSeconds: { type: Number, required: true },
    idleSeconds:   { type: Number, required: true },
    activeMinutes: { type: [Boolean], default: () => [] },
    keyPresses:    { type: Number, default: 0 },
    mouseClicks:   { type: Number, default: 0 },
    mouseMoves:    { type: Number, default: 0 },
    activeAppName: { type: String, default: null },
    capturedAt:        { type: Date, default: null },
    minioObjectKey:    { type: String, default: null },
    idleTriggered: { type: Boolean, default: false },
    excluded:      { type: Boolean, default: false },
    excludedAt:    { type: Date, default: null },
    excludedBy:    { type: Number, default: null },
  },
  { timestamps: true },
);

trackerSegmentSchema.index({ employeeId: 1, windowStart: 1 });

export const TrackerSegment = model<ITrackerSegment>(
  'TrackerSegment',
  trackerSegmentSchema,
);
