import React, { useState, useEffect } from 'react';
import {
  VaultItem,
  VaultItemType
} from '../types/vault';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Star,
  Copy,
  Check,
  Clock,
  History,
  QrCode
} from 'lucide-react';
import { analyzePasswordStrength } from '../utils/strengthAnalyzer';
import { checkPwnedPassword, generateTotp } from '../utils/bitwardenCrypto';
import { secureCopy } from '../utils/clipboardSecurity';

interface VaultItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItem | null;
  onSave: (item: VaultItem) => void;
  onOpenGenerator: () => void;
  generatedPassword?: string;
}

export const VaultItemModal: React.FC<VaultItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  onOpenGenerator,
  generatedPassword,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<VaultItemType>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpSeed, setTotpSeed] = useState('');
  const [uri, setUri] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [folder, setFolder] = useState('Default');

  const [showPassword, setShowPassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Live TOTP
  const [totpCode, setTotpCode] = useState('------');
  const [totpRemaining, setTotpRemaining] = useState(30);

  // Pwned status
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [pwnedResult, setPwnedResult] = useState<{ isPwned: boolean; breachCount: number } | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setType(item.type || 'login');
      setUsername(item.username || '');
      setPassword(item.password || '');
      setTotpSeed(item.totpSeed || '');
      setUri(item.uri || '');
      setNotes(item.notes || '');
      setFavorite(item.favorite || false);
      setFolder(item.folder || 'Default');
      setPwnedResult(item.pwnedStatus ? { isPwned: item.pwnedStatus.isPwned, breachCount: item.pwnedStatus.breachCount } : null);
    } else {
      setName('');
      setType('login');
      setUsername('');
      setPassword(generatedPassword || '');
      setTotpSeed('');
      setUri('');
      setNotes('');
      setFavorite(false);
      setFolder('Default');
      setPwnedResult(null);
    }
  }, [item, isOpen, generatedPassword]);

  // Update password if generated externally
  useEffect(() => {
    if (generatedPassword && isOpen) {
      setPassword(generatedPassword);
    }
  }, [generatedPassword, isOpen]);

  // Live TOTP ticker
  useEffect(() => {
    if (!totpSeed) {
      setTotpCode('------');
      return;
    }

    let intervalId: any;
    const updateOtp = async () => {
      const res = await generateTotp(totpSeed);
      setTotpCode(res.code);
      setTotpRemaining(res.secondsRemaining);
    };

    updateOtp();
    intervalId = setInterval(updateOtp, 1000);

    return () => clearInterval(intervalId);
  }, [totpSeed]);

  if (!isOpen) return null;

  const analysis = analyzePasswordStrength(password);

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await secureCopy(text, 30);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const handleCheckPwned = async () => {
    if (!password) return;
    setIsCheckingPwned(true);
    const res = await checkPwnedPassword(password);
    setPwnedResult(res);
    setIsCheckingPwned(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Check if password changed to maintain passwordHistory
    let historyList = item?.passwordHistory ? [...item.passwordHistory] : [];
    if (item && item.password && item.password !== password) {
      historyList.unshift({
        password: item.password,
        changedAt: Date.now(),
      });
    }

    const updatedItem: VaultItem = {
      id: item?.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      type,
      username: username.trim(),
      password,
      totpSeed: totpSeed.trim(),
      uri: uri.trim(),
      notes: notes.trim(),
      favorite,
      folder: folder.trim(),
      createdAt: item?.createdAt || Date.now(),
      updatedAt: Date.now(),
      passwordHistory: historyList.slice(0, 10),
      pwnedStatus: pwnedResult ? {
        checkedAt: Date.now(),
        isPwned: pwnedResult.isPwned,
        breachCount: pwnedResult.breachCount,
      } : undefined,
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl scrollbar-thin scrollbar-thumb-slate-700">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {item ? 'Edit Vault Item' : 'New Encrypted Item'}
              </h3>
              <p className="text-xs text-slate-400">
                Stored in encrypted AES-256-GCM vault.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFavorite(!favorite)}
            className={`p-2 rounded-lg border transition-colors ${
              favorite
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-400'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Mark as Favorite"
          >
            <Star className={`h-4 w-4 ${favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. GitHub, Google, Work VPN"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as VaultItemType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="login">Login</option>
                <option value="secure_note">Secure Note</option>
                <option value="card">Card / ID</option>
              </select>
            </div>
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none pr-10"
              />
              {username && (
                <button
                  type="button"
                  onClick={() => handleCopy(username, 'username')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  title="Copy username"
                >
                  {copiedField === 'username' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Password with actions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenGenerator}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Generate Strong</span>
                </button>
                {item?.passwordHistory && item.passwordHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    <History className="h-3 w-3" />
                    <span>History ({item.passwordHistory.length})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none pr-20"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 text-slate-400">
                {password && (
                  <button
                    type="button"
                    onClick={() => handleCopy(password, 'password')}
                    className="p-0.5 hover:text-slate-200"
                    title="Copy password (auto-clears in 30s)"
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-0.5 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Audit Sub-strip */}
            {password && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    analysis.score >= 75 ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'
                  }`}>
                    {analysis.score}/100 ({analysis.ratingLabel})
                  </span>
                  <span className="text-slate-400">{analysis.entropyBits} bits</span>
                </div>

                {/* HIBP Breach check button */}
                <button
                  type="button"
                  onClick={handleCheckPwned}
                  disabled={isCheckingPwned}
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  {isCheckingPwned ? (
                    <span className="text-slate-400">Checking HIBP...</span>
                  ) : pwnedResult ? (
                    pwnedResult.isPwned ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Compromised in {pwnedResult.breachCount.toLocaleString()} breaches!</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Not found in known breaches</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 hover:text-emerald-400">
                      Check HIBP Breach
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Password History Expandable */}
            {showHistory && item?.passwordHistory && item.passwordHistory.length > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5">
                <div className="text-slate-400 font-semibold mb-1">Previous Passwords:</div>
                {item.passwordHistory.map((hist, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span className="truncate max-w-[200px]">{hist.password}</span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(hist.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Authenticator Key (TOTP 2FA) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Authenticator Key (TOTP Seed)
              </label>
              <span className="text-[11px] text-slate-500">RFC 6238 Base32</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={totpSeed}
                onChange={e => setTotpSeed(e.target.value)}
                placeholder="e.g. JBSWY3DPEHPK3PXP"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Live 6-digit TOTP code display */}
            {totpSeed && (
              <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-lg font-bold tracking-widest text-emerald-400">
                    {totpCode}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span>{totpRemaining}s</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(totpCode, 'totp')}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  {copiedField === 'totp' ? 'Copied' : 'Copy TOTP'}
                </button>
              </div>
            )}
          </div>

          {/* URI / Website */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              URI / Website Address
            </label>
            <input
              type="text"
              value={uri}
              onChange={e => setUri(e.target.value)}
              placeholder="https://github.com/login"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Encrypted Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Recovery codes, PINs, security questions..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
            >
              Save to Encrypted Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
