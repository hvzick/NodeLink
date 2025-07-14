import { gun, setGunInstance, setConnectedStatus, statusListeners } from './GunState';

const _notifyStatusListeners = (): void => {
  statusListeners.forEach(listener => listener(false));
};

export function destroy(): void {
  if (gun) {
    gun.off();
    setGunInstance(null);
    setConnectedStatus(false);
    _notifyStatusListeners();
    console.log("Gun.js instance has been destroyed.");
  }
}