// backend/Local database/SQLite/MessageStructure.ts

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  receiver: string;
  timestamp: string;
  createdAt: number;
  text: string;
  encryptedContent: string;
  iv: string;
  encrypted: boolean;
  decrypted: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed" | "received";
  imageUrl: string;
  videoUrl: string;
  fileName: string;
  fileSize: string;
  audioUrl: string;
  replyTo: string | null;
  receivedAt: number | null;
  encryptionVersion: string;
  readAt: number | null;
  signature?: string;
  signatureNonce?: string;
  signatureTimestamp?: number;
  messageHash?: string;
  signatureVerified?: boolean;
}
