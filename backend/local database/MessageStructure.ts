// types.ts

export type Message = {
  createdAt: number;
  id: string;
  conversationId: string;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  audioUrl?: string;
  replyTo?: Message | null;
};