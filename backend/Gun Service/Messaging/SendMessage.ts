// messaging/sendMessage.ts

import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../Local database/MessageStructure';
import { insertMessage } from '../../Local database/InsertMessage';
import { gun, setGunInstance } from '../GunState';

interface SendMessageParams {
  text: string;
  receiver: string;
  conversationId: string;
  sender: string;
}

export async function sendMessage({
  text,
  receiver,
  conversationId,
  sender,
}: SendMessageParams): Promise<void> {
  const timestamp = Date.now().toString();

  const message = {
    id: timestamp,
    sender,
    receiver,
    text,
    timestamp,
  };

  try {
    const chatRef = gun.get(`nodelink/${conversationId}`);
    chatRef.set(message);
  } catch (error) {
    console.error("Failed to send GUN message:", error);
    throw error;
  }
}
