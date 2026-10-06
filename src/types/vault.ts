export type VaultItemType = 'login' | 'secure_note' | 'card';

export interface VaultItem {
  id: string;
  type: VaultItemType;
  name: string;
  username?: string;
  password?: string;
  totpSeed?: string;
  uri?: string;
  notes?: string;
  favorite?: boolean;
  folder?: string;
  createdAt: number;
  updatedAt: number;
  passwordHistory?: Array<{ password: string; changedAt: number }>;
  pwnedStatus?: {
    checkedAt: number;
    isPwned: boolean;
    breachCount: number;
  };
}

export interface EncryptedVaultPayload {
  version: number;
  saltHex: string;
  kdfIterations: number;
  testCiphertext: string;
  testIv: string;
  itemsCiphertext: string;
  itemsIv: string;
  updatedAt: number;
}

export interface VaultSettings {
  autoLockMinutes: number; // 0 = never, 1, 5, 15, 30, 60
  clearClipboardSeconds: number; // 0 = never, 15, 30, 60
  kdfIterations: number;
}
