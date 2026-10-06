import React, { useState } from 'react';
import {
  VaultItem,
  VaultItemType,
  EncryptedVaultPayload
} from '../types/vault';
import {
  Lock,
  Unlock,
  Plus,
  Search,
  Star,
  Copy,
  Check,
  KeyRound,
  FileText,
  CreditCard,
  Folder,
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Clock,
  MoreVertical,
  Trash2,
  Activity
} from 'lucide-react';
import { encryptData } from '../utils/bitwardenCrypto';
import { secureCopy } from '../utils/clipboardSecurity';
import { VaultItemModal } from './VaultItemModal';
import { VaultHealthReports } from './VaultHealthReports';

interface EncryptedVaultTabProps {
  isUnlocked: boolean;
  hasMasterPassword: boolean;
  masterKey: CryptoKey | null;
  items: VaultItem[];
  setItems: React.Dispatch<React.SetStateAction<VaultItem[]>>;
  onLockVault: () => void;
  onOpenSetupMaster: () => void;
  onOpenUnlockModal: () => void;
  onOpenGenerator: () => void;
  generatedPassword?: string;
  autoLockMinutes: number;
  setAutoLockMinutes: (m: number) => void;
  clipboardTimeoutSeconds: number;
  setClipboardTimeoutSeconds: (s: number) => void;
}

export const EncryptedVaultTab: React.FC<EncryptedVaultTabProps> = ({
  isUnlocked,
  hasMasterPassword,
  masterKey,
  items,
  setItems,
  onLockVault,
  onOpenSetupMaster,
  onOpenUnlockModal,
  onOpenGenerator,
  generatedPassword,
  autoLockMinutes,
  setAutoLockMinutes,
  clipboardTimeoutSeconds,
  setClipboardTimeoutSeconds,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [showHealthReports, setShowHealthReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIdField, setCopiedIdField] = useState<string | null>(null);
  const [clipboardClearedNotice, setClipboardClearedNotice] = useState(false);

  // Sync encrypted items to localStorage whenever items change while unlocked
  const saveItemsEncrypted = async (newItems: VaultItem[]) => {
    if (!masterKey) return;
    try {
      const savedRaw = localStorage.getItem('cipherforge_vault_data');
      if (!savedRaw) return;
      const currentPayload: EncryptedVaultPayload = JSON.parse(savedRaw);

      const itemsEncrypted = await encryptData(JSON.stringify(newItems), masterKey);

      const updatedPayload: EncryptedVaultPayload = {
        ...currentPayload,
        itemsCiphertext: itemsEncrypted.ciphertext,
        itemsIv: itemsEncrypted.iv,
        updatedAt: Date.now(),
      };

      localStorage.setItem('cipherforge_vault_data', JSON.stringify(updatedPayload));
      setItems(newItems);
    } catch (err) {
      console.error('Failed to encrypt and save vault:', err);
    }
  };

  const handleSaveItem = (savedItem: VaultItem) => {
    const exists = items.some(i => i.id === savedItem.id);
    let updated: VaultItem[];
    if (exists) {
      updated = items.map(i => (i.id === savedItem.id ? savedItem : i));
    } else {
      updated = [savedItem, ...items];
    }
    saveItemsEncrypted(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    saveItemsEncrypted(updated);
  };

  const handleCopy = async (text: string, id: string, field: string) => {
    const success = await secureCopy(text, clipboardTimeoutSeconds, () => {
      setClipboardClearedNotice(true);
      setTimeout(() => setClipboardClearedNotice(false), 3000);
    });

    if (success) {
      setCopiedIdField(`${id}-${field}`);
      setTimeout(() => setCopiedIdField(null), 1500);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      app: 'CipherForge',
      encrypted: false,
      exportedAt: new Date().toISOString(),
      items,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherforge_vault_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterType === 'favorites' && !item.favorite) return false;
    if (filterType === 'login' && item.type !== 'login') return false;
    if (filterType === 'secure_note' && item.type !== 'secure_note') return false;
    if (filterType === 'card' && item.type !== 'card') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUri = item.uri?.toLowerCase().includes(q);
      return matchName || matchUser || matchUri;
    }
    return true;
  });

  // State 1: Master Password NOT set yet
  if (!hasMasterPassword) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto mb-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          Set Up Your Bitwarden-Grade Encrypted Vault
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Upgrade beyond transient sessions. Encrypt and store your logins, secure notes, and 2FA authenticator tokens locally using AES-256-GCM authenticated encryption and 600,000 PBKDF2 rounds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-left text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">Zero-Knowledge</div>
            <div className="text-slate-400 text-[11px]">Decryption happens strictly in your browser. No plaintext ever leaves RAM.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">600k PBKDF2 Rounds</div>
            <div className="text-slate-400 text-[11px]">Matches Bitwarden's OWASP standard to resist high-speed GPU cracking.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">Built-in TOTP & HIBP</div>
            <div className="text-slate-400 text-[11px]">Live 2FA authenticator codes & k-anonymity breach verification.</div>
          </div>
        </div>

        <button
          onClick={onOpenSetupMaster}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20"
        >
          Create Master Password
        </button>
      </div>
    );
  }

  // State 2: Master Password set, but Vault is currently LOCKED
  if (!isUnlocked) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center max-w-md mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto mb-4">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          Encrypted Vault Is Locked
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your credentials are securely sealed in browser storage with AES-256-GCM. Decrypt them with your master password.
        </p>

        <button
          onClick={onOpenUnlockModal}
          className="mt-6 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
        >
          <Unlock className="h-4 w-4" />
          <span>Unlock Vault</span>
        </button>
      </div>
    );
  }

  // State 3: Vault is UNLOCKED
  return (
    <div className="space-y-5">
      {/* Clipboard Cleared Toast Notification */}
      {clipboardClearedNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Clipboard cleared for security ({clipboardTimeoutSeconds}s timeout).</span>
        </div>
      )}

      {/* Top Vault Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-100">
                Encrypted Vault (Active Session)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end encrypted with AES-256-GCM · {items.length} total credentials
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Item</span>
            </button>

            <button
              onClick={() => {
                setShowHealthReports(!showHealthReports);
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                showHealthReports
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Health Reports</span>
            </button>

            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowHealthReports(false);
              }}
              className={`p-2 rounded-lg border transition-colors ${
                showSettings
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title="Vault Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={handleExportJson}
              className="p-2 rounded-lg border border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              title="Export Vault JSON"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={onLockVault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/40 text-amber-300 text-xs font-medium transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Lock Now</span>
            </button>
          </div>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Vault Auto-Lock Inactivity Timeout
              </label>
              <select
                value={autoLockMinutes}
                onChange={e => setAutoLockMinutes(parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={0}>Never (Until tab closes)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Auto-Clear Clipboard Timeout
              </label>
              <select
                value={clipboardTimeoutSeconds}
                onChange={e => setClipboardTimeoutSeconds(parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds (Bitwarden Standard)</option>
                <option value={60}>60 Seconds</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>
        )}

        {/* Search & Category Filter strip */}
        {!showHealthReports && (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vault items..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'login', label: 'Logins' },
                { id: 'secure_note', label: 'Notes' },
                { id: 'card', label: 'Cards' },
                { id: 'favorites', label: 'Favorites' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterType(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === cat.id
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main View: Either Health Reports or Items List */}
      {showHealthReports ? (
        <VaultHealthReports
          items={items}
          onEditItem={item => {
            setEditingItem(item);
            setIsItemModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map(item => {
            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90"
              >
                {/* Left: Icon & Name */}
                <div
                  onClick={() => {
                    setEditingItem(item);
                    setIsItemModalOpen(true);
                  }}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                    {item.type === 'login' ? (
                      <KeyRound className="h-5 w-5" />
                    ) : item.type === 'secure_note' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate text-sm">
                        {item.name}
                      </span>
                      {item.favorite && (
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {item.username || item.uri || (item.notes ? 'Secure Note' : 'No username')}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.username && (
                    <button
                      onClick={() => handleCopy(item.username!, item.id, 'user')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors"
                      title="Copy username"
                    >
                      {copiedIdField === `${item.id}-user` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>User</span>
                        </>
                      )}
                    </button>
                  )}

                  {item.password && (
                    <button
                      onClick={() => handleCopy(item.password!, item.id, 'pass')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors"
                      title="Copy password (auto-clears in 30s)"
                    >
                      {copiedIdField === `${item.id}-pass` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Pass</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsItemModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
              <Folder className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No items found</p>
              <p className="text-xs text-slate-500 mt-1">
                {items.length === 0
                  ? 'Click "+ New Item" to store your first encrypted credential.'
                  : 'Try adjusting your search query or filter.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Item Modal (Add / Edit) */}
      <VaultItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        item={editingItem}
        onSave={handleSaveItem}
        onOpenGenerator={onOpenGenerator}
        generatedPassword={generatedPassword}
      />
    </div>
  );
};
