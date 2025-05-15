// ConversationTones.ts
import { AudioPlayer, createAudioPlayer } from 'expo-audio';

// Tone asset paths
const SEND_TONE = require('../../assets/sounds/sent.mp3');
const RECEIVE_TONE = require('../../assets/sounds/recieve.mp3');

// Will hold our global players
let sendPlayer: AudioPlayer | null = null;
let receivePlayer: AudioPlayer | null = null;

/**
 * Load each tone exactly once.
 */
export async function initConversationTones() {
  // already done?
  if (sendPlayer && receivePlayer) {
    // console.log('[ConversationTones] already initialized');
    return;
  }

  try {
    // createAudioPlayer returns an AudioPlayer you must release yourself
    sendPlayer = createAudioPlayer(SEND_TONE);
    // console.log('[ConversationTones] created sendPlayer');

    receivePlayer = createAudioPlayer(RECEIVE_TONE);
    // console.log('[ConversationTones] created receivePlayer');
  } catch (err) {
    console.error('[ConversationTones] init error:', err);
  }
}

/**
 * Play the send tone (rewind + play).
 */
export async function playSendTone() {
  // console.log('[ConversationTones] playSendTone()');
  try {
    if (!sendPlayer) {
      await initConversationTones();
    }
    // rewind to start
    await sendPlayer!.seekTo(0);
    sendPlayer!.play();
  } catch (err) {
    console.error('[ConversationTones] playSendTone error:', err);
  }
}

/**
 * Play the receive tone (rewind + play).
 */
export async function playReceiveTone() {
  // console.log('[ConversationTones] playReceiveTone()');
  try {
    if (!receivePlayer) {
      await initConversationTones();
    }
    await receivePlayer!.seekTo(0);
    receivePlayer!.play();
  } catch (err) {
    console.error('[ConversationTones] playReceiveTone error:', err);
  }
}

/**
 * (Optional) Call this on app shutdown or when you no longer need tones
 * to free native resources and avoid leaks.
 */
export function releaseConversationTones() {
  sendPlayer?.remove();
  receivePlayer?.remove();
  sendPlayer = null;
  receivePlayer = null;
  // console.log('[ConversationTones] released players');
}
