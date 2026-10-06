import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { analyzePasswordStrength } from '../utils/strengthAnalyzer';
import {
  generateSalt,
  deriveMasterKey,
  encryptData,
  DEFAULT_KDF_CONFIG
} from '../utils/bitwardenCrypto';
import { EncryptedVaultPayload, VaultItem } from '../types/vault';

interface MasterPasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (masterKey: CryptoKey, initialPayload: EncryptedVaultPayload) => void;
}

export const MasterPasswordSetupModal: React.FC<MasterPasswordSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeriving, setIsDeriving] = useState(false);
  const [understoodWarning, setUnderstoodWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const analysis = analyzePasswordStrength(password);
  const isMatch = password.length > 0 && password === confirmPassword;
  const isStrongEnough = analysis.score >= 50 && password.length >= 10;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isStrongEnough) {
      setErrorMsg('Master password must be at least 10 characters with moderate-to-strong entropy.');
      return;
    }

    if (!isMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!understoodWarning) {
      setErrorMsg('You must acknowledge that CipherForge cannot recover your vault if you lose this password.');
      return;
    }

    setIsDeriving(true);

    try {
      // 1. Generate fresh cryptographic salt
      const saltHex = generateSalt(32);
      const iterations = DEFAULT_KDF_CONFIG.iterations; // 600,000

      // 2. Derive AES-256-GCM Master Key
      const masterKey = await deriveMasterKey(password, saltHex, iterations);

      // 3. Encrypt verification canary token to test decryption later
      const canaryString = 'CIPHERFORGE_VAULT_CANARY_V1';
      const testEncrypted = await encryptData(canaryString, masterKey);

      // 4. Initial empty items payload encrypted
      const emptyItems: VaultItem[] = [];
      const itemsEncrypted = await encryptData(JSON.stringify(emptyItems), masterKey);

      const payload: EncryptedVaultPayload = {
        version: 1,
        saltHex,
        kdfIterations: iterations,
        testCiphertext: testEncrypted.ciphertext,
        testIv: testEncrypted.iv,
        itemsCiphertext: itemsEncrypted.ciphertext,
        itemsIv: itemsEncrypted.iv,
        updatedAt: Date.now(),
      };

      // Persist encrypted payload
      localStorage.setItem('cipherforge_vault_data', JSON.stringify(payload));
      localStorage.setItem('cipherforge_vault_has_master', 'true');

      onSuccess(masterKey, payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'Key derivation failed.');
    } finally {
      setIsDeriving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Initialize Bitwarden-Grade Vault
            </h3>
            <p className="text-xs text-slate-400">
              Zero-Knowledge AES-256-GCM with 600,000 PBKDF2 Iterations
            </p>
          </div>
        </div>

        <form onSubmit={handleSetup} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Master Password input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Choose Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter strong master password..."
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

            {/* Live Strength Feedback */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Strength: {analysis.ratingLabel}</span>
                  <span className="text-emerald-400">{analysis.entropyBits} bits entropy</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      analysis.score >= 75 ? 'bg-emerald-500' : analysis.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm Master Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type master password..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
            {confirmPassword.length > 0 && !isMatch && (
              <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Zero-knowledge disclaimer check */}
          <div className="rounded-lg bg-amber-950/20 border border-amber-900/40 p-3 text-slate-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-amber-300 block mb-0.5">Zero-Knowledge Guarantee:</strong>
                Your master password never leaves your browser. Because we have no backdoors, <strong>it cannot be reset or recovered</strong>. If you forget it, your encrypted items will be lost.
              </div>
            </div>
            <label className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-900/30 cursor-pointer text-[11px] text-slate-200">
              <input
                type="checkbox"
                checked={understoodWarning}
                onChange={e => setUnderstoodWarning(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
              <span>I understand that CipherForge cannot recover my master password.</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeriving || !isMatch || !isStrongEnough || !understoodWarning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
            >
              {isDeriving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deriving Key (600k rounds)...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Create Encrypted Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
