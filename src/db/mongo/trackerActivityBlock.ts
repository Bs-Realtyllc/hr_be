import { Schema, model, Document } from 'mongoose';

export interface ITrackerActivityBlock extends Document {
  clockId:        number;
  employeeId:     number;
  companyId:       number;
  windowStart:    Date;
  windowEnd:      Date;
  activeSeconds:  number;
  idleSeconds:    number;
  keyPresses:     number;
  mouseClicks:    number;
  mouseMoves:     number;
  activeAppName:  string | null;
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
    keyPresses:    { type: Number, default: 0 },
    mouseClicks:   { type: Number, default: 0 },
    mouseMoves:    { type: Number, default: 0 },
    activeAppName: { type: String, default: null },
  },
  { timestamps: true },
);

trackerActivityBlockSchema.index({ employeeId: 1, windowStart: 1 });

export const TrackerActivityBlock = model<ITrackerActivityBlock>(
  'TrackerActivityBlock',
  trackerActivityBlockSchema,
);
