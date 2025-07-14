export let gun: any = null;
export let isConnected: boolean = false;
export const statusListeners: Set<(isConnected: boolean) => void> = new Set();

// We need functions to modify the state since it's encapsulated here
export const setGunInstance = (instance: any) => {
  gun = instance;
};

export const setConnectedStatus = (status: boolean) => {
  isConnected = status;
};