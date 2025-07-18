// backend/Local database/AsyncStorage/Types/UserData.ts

export interface UserData {
  id?: string;
  walletAddress: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  publicKey?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterUserParams {
  walletAddress: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  publicKey?: string;
}

export interface UpdateUserParams {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  publicKey?: string;
}
