import { Schema, model, Document, Types } from 'mongoose';

interface IReaction {
  emoji: string;
  employeeIds: number[];
}

export interface IChannelMessage extends Document {
  channelId:         number;
  employeeId:        number;
  authorName:        string;
  authorDesignation: string;
  content:           string;
  replyToId:         Types.ObjectId | null;
  replyToContent:    string | null;
  replyToAuthor:     string | null;
  reactions:         IReaction[];
  isPinned:          boolean;
  isEdited:          boolean;
  isDeleted:         boolean;
  deletedAt:         Date | null;
  savedBy:           number[];
  createdAt:         Date;
  updatedAt:         Date;
}

const reactionSchema = new Schema<IReaction>(
  { emoji: { type: String, required: true }, employeeIds: { type: [Number], default: [] } },
  { _id: false },
);

const channelMessageSchema = new Schema<IChannelMessage>(
  {
    channelId:         { type: Number,  required: true, index: true },
    employeeId:        { type: Number,  required: true },
    authorName:        { type: String,  required: true },
    authorDesignation: { type: String,  default: '' },
    content:           { type: String,  required: true },
    replyToId:         { type: Schema.Types.ObjectId, default: null },
    replyToContent:    { type: String,  default: null },
    replyToAuthor:     { type: String,  default: null },
    reactions:         { type: [reactionSchema], default: [] },
    isPinned:          { type: Boolean, default: false },
    isEdited:          { type: Boolean, default: false },
    isDeleted:         { type: Boolean, default: false },
    deletedAt:         { type: Date,    default: null },
    savedBy:           { type: [Number], default: [] },
  },
  { timestamps: true },
);

channelMessageSchema.index({ channelId: 1, createdAt: 1 });
channelMessageSchema.index({ channelId: 1, isPinned: 1 });

export const ChannelMessage = model<IChannelMessage>('ChannelMessage', channelMessageSchema);
