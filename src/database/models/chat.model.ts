import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  chatId: number;
  title?: string;
  type: string;
  isMember: boolean;
}

const ChatSchema: Schema = new Schema(
  {
    chatId: { type: Number, required: true, unique: true },
    title: { type: String },
    type: { type: String, required: true },
    isMember: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);
