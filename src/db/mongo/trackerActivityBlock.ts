import { Schema, model, Document } from 'mongoose';

export interface ITrackerActivityBlock extends Document {
  clockId:        number;
  employeeId:     number;
  companyId:       number;
  windowStart:    Date;
  windowEnd:      Date;
  activeSeconds:  number;
  idleSeconds:    number;
  // One entry per minute of the 10-minute window — true if that minute had
  // any keyboard/mouse input. This is what the diary's activity bar renders
  // (same "active minutes out of 10" model Upwork's Work Diary uses), not
  // a continuous percentage.
  activeMinutes:  boolean[];
  keyPresses:     number;
  mouseClicks:    number;
  mouseMoves:     number;
  activeAppName:  string | null;
  // A block's time only stops counting toward the verified total once every
  // screenshot backing it has been deleted — zero evidence left for that
  // 10 minutes. Deleting one of several screenshots on a block just removes
  // that image; the block stays verified as long as any evidence remains.
  excluded:       boolean;
  excludedAt:     Date | null;
  excludedBy:     number | null;
  createdAt:      Date;
  updatedAt:      Date;
}

const trackerActivityBlockSchema = new Schema<ITrackerActivityBlock>(
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
    excluded:      { type: Boolean, default: false },
    excludedAt:    { type: Date, default: null },
    excludedBy:    { type: Number, default: null },
  },
  { timestamps: true },
);

trackerActivityBlockSchema.index({ employeeId: 1, windowStart: 1 });

export const TrackerActivityBlock = model<ITrackerActivityBlock>(
  'TrackerActivityBlock',
  trackerActivityBlockSchema,
);
