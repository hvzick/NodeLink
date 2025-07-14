import { isConnected, statusListeners } from './GunState';

export function onStatusChange(callback: (isConnected: boolean) => void): () => void {
  statusListeners.add(callback);
  callback(isConnected); // Immediately notify with the current status

  return () => statusListeners.delete(callback);
}