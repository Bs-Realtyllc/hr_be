import { Schema, model, Document } from 'mongoose';

export interface ITrackerScreenshot extends Document {
  clockId:        number;
  employeeId:     number;
  companyId:      number;
  capturedAt:     Date;
  minioObjectKey: string;
  activeSeconds:  number;
  idleSeconds:    number;
  createdAt:      Date;
  updatedAt:      Date;
}

const trackerScreenshotSchema = new Schema<ITrackerScreenshot>(
  {
    clockId:        { type: Number, required: true, index: true },
    employeeId:     { type: Number, required: true, index: true },
    // Single-tenant today (always 1) — kept from day one so tenant scoping
    // doesn't require a backfill once this becomes a multi-tenant product.
    companyId:      { type: Number, required: true, default: 1 },
    capturedAt:     { type: Date, required: true },
    minioObjectKey: { type: String, required: true },
    // Activity for the capture window this screenshot represents, so the
    // diary view can pair each thumbnail with its activity level directly.
    activeSeconds:  { type: Number, default: 0 },
    idleSeconds:    { type: Number, default: 0 },
  },
  { timestamps: true },
);

trackerScreenshotSchema.index({ employeeId: 1, capturedAt: 1 });

export const TrackerScreenshot = model<ITrackerScreenshot>(
  'TrackerScreenshot',
  trackerScreenshotSchema,
);
