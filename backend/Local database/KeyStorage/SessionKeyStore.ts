// utils\ProfileUtils\GetSharedKeyForUser.ts

const sessionKeys = new Map<string, string>();

export const SessionKeyStore = {
  set: (recipient: string, key: string) => sessionKeys.set(recipient, key),
  get: (recipient: string) => sessionKeys.get(recipient),
  has: (recipient: string) => sessionKeys.has(recipient),
  clear: () => sessionKeys.clear(),
};
