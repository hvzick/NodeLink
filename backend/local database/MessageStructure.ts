export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  localSender: string,
  receiver: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  audioUrl?: string;
  replyTo?: Message | null;
  status?: string;
  encrypted?: boolean;
  decrypted?: boolean;
  encryptedContent?: string;
  iv?: string;
  createdAt?: number;
}
