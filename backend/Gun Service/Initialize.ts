import Gun from 'gun';
import 'react-native-get-random-values';
import { peers } from './GunPeers';
// The state import is correct, no changes needed there
import { gun, setGunInstance, setConnectedStatus, isConnected, statusListeners } from './GunState';

// This internal helper function needs to use the correct `isConnected` state
const _notifyStatusListeners = (): void => {
  statusListeners.forEach(listener => listener(isConnected));
};

export function initialize(): void {
  if (gun) {
    return;
  }

  console.log("Initializing Gun.js connection...");

  const newGunInstance = Gun({
    peers: peers,
    localStorage: false,
  });

  setGunInstance(newGunInstance);

  const testKey = `connection-test-${Date.now()}`;

  // --- THIS IS THE FIX ---
  // The 'ack' parameter is now typed as 'any' to match Gun's dynamic object.
  newGunInstance.get(testKey).put({ status: 'online' }, (ack: any) => {
    // The logic inside remains the same and is correct.
    // We check for the existence of the 'err' property.
    if (ack.err) {
      console.error("Gun.js connection failed:", ack.err);
      setConnectedStatus(false);
    } else {
      console.log("Gun.js connection successful!");
      setConnectedStatus(true);
    }
    _notifyStatusListeners();
  });
}