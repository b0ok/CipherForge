import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  X,
  Trash2
} from 'lucide-react';
import {
  deriveMasterKey,
  decryptData
} from '../utils/bitwardenCrypto';
import { EncryptedVaultPayload, VaultItem } from '../types/vault';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (masterKey: CryptoKey, items: VaultItem[]) => void;
  onResetVault: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  onResetVault,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const savedRaw = localStorage.getItem('cipherforge_vault_data');
    if (!savedRaw) {
      setErrorMsg('No encrypted vault payload found.');
      return;
    }

    setIsDecrypting(true);

    try {
      const payload: EncryptedVaultPayload = JSON.parse(savedRaw);

      // 1. Derive candidate AES-256-GCM Master Key
      const candidateKey = await deriveMasterKey(
        password,
        payload.saltHex,
        payload.kdfIterations || 600000
      );

      // 2. Validate against canary token
      const decryptedCanary = await decryptData(
        payload.testCiphertext,
        payload.testIv,
        candidateKey
      );

      if (decryptedCanary !== 'CIPHERFORGE_VAULT_CANARY_V1') {
        throw new Error('Invalid master password.');
      }

      // 3. Decrypt full vault items
      const itemsJson = await decryptData(
        payload.itemsCiphertext,
        payload.itemsIv,
        candidateKey
      );

      const items: VaultItem[] = JSON.parse(itemsJson);

      onUnlockSuccess(candidateKey, items);
      setPassword('');
    } catch (err: any) {
      setErrorMsg('Incorrect Master Password. Decryption failed.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Vault Is Locked
            </h3>
            <p className="text-xs text-slate-400">
              Enter your master password to decrypt credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter master password..."
                autoFocus
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setConfirmReset(!confirmReset)}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={isDecrypting || !password}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
            >
              {isDecrypting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Decrypting...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Unlock Vault</span>
                </>
              )}
            </button>
          </div>

          {confirmReset && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-slate-300 space-y-2">
              <p className="text-[11px] text-rose-300 font-medium">
                Resetting will delete the encrypted vault data from this browser since zero-knowledge encryption prevents recovery without the password.
              </p>
              <button
                type="button"
                onClick={onResetVault}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Reset & Clear Vault</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
