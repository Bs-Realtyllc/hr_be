import { Schema, model, Document } from 'mongoose';

export interface IDmMessage extends Document {
  fromEmployeeId: number;
  toEmployeeId:   number;
  content:        string;
  authorName:     string;
  isEdited:       boolean;
  isDeleted:      boolean;
  deletedAt:      Date | null;
  isRead:         boolean;
  readAt:         Date | null;
  createdAt:      Date;
  updatedAt:      Date;
}

const dmMessageSchema = new Schema<IDmMessage>(
  {
    fromEmployeeId: { type: Number, required: true, index: true },
    toEmployeeId:   { type: Number, required: true, index: true },
    content:        { type: String, required: true },
    authorName:     { type: String, required: true },
    isEdited:       { type: Boolean, default: false },
    isDeleted:      { type: Boolean, default: false },
    deletedAt:      { type: Date,    default: null },
    isRead:         { type: Boolean, default: false },
    readAt:         { type: Date,    default: null },
  },
  { timestamps: true },
);

dmMessageSchema.index({ fromEmployeeId: 1, toEmployeeId: 1, createdAt: 1 });

export const DmMessage = model<IDmMessage>('DmMessage', dmMessageSchema);
