import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratorOptions, HistoryItem } from './types/crypto';
import { VaultItem, EncryptedVaultPayload } from './types/vault';
import { generatePassword } from './utils/cryptoGenerator';
import { analyzePasswordStrength } from './utils/strengthAnalyzer';
import { encryptData } from './utils/bitwardenCrypto';
import { Header, ActiveTab } from './components/Header';
import { PasswordDisplay } from './components/PasswordDisplay';
import { GeneratorControls } from './components/GeneratorControls';
import { StrengthAuditor } from './components/StrengthAuditor';
import { PasswordCheckerTab } from './components/PasswordCheckerTab';
import { BatchGeneratorTab } from './components/BatchGeneratorTab';
import { EncryptedVaultTab } from './components/EncryptedVaultTab';
import { MasterPasswordSetupModal } from './components/MasterPasswordSetupModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { VaultItemModal } from './components/VaultItemModal';

const DEFAULT_OPTIONS: GeneratorOptions = {
  mode: 'random',
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  includeExtended: false,
  excludeAmbiguous: false,
  avoidRepeats: false,

  wordCount: 5,
  delimiter: '-',
  capitalizeMode: 'title',
  includeNumberInPassphrase: true,
  includeSymbolInPassphrase: false,

  pinLength: 6,
  allowRepeatedDigits: false,

  syllableCount: 4,
  capitalizeSyllables: true,
  appendNumber: true,
  appendSymbol: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [currentPassword, setCurrentPassword] = useState<string>('');

  // Bitwarden-Grade Encrypted Vault State
  const [hasMasterPassword, setHasMasterPassword] = useState<boolean>(() => {
    return localStorage.getItem('cipherforge_vault_has_master') === 'true';
  });
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(15);
  const [clipboardTimeoutSeconds, setClipboardTimeoutSeconds] = useState<number>(30);

  // Modals state
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSetupMasterOpen, setIsSetupMasterOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isQuickSaveModalOpen, setIsQuickSaveModalOpen] = useState(false);

  // Auto-Lock Inactivity Timer
  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockVault = useCallback(() => {
    setMasterKey(null);
    setIsVaultUnlocked(false);
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
  }, []);

  const resetAutoLockTimer = useCallback(() => {
    if (!isVaultUnlocked || autoLockMinutes <= 0) return;
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    autoLockTimerRef.current = setTimeout(() => {
      lockVault();
    }, autoLockMinutes * 60 * 1000);
  }, [isVaultUnlocked, autoLockMinutes, lockVault]);

  // Activity listeners for auto-lock
  useEffect(() => {
    if (!isVaultUnlocked) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetAutoLockTimer();

    events.forEach(e => window.addEventListener(e, handleActivity));
    resetAutoLockTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [isVaultUnlocked, resetAutoLockTimer]);

  // Analyze active password
  const analysis = React.useMemo(() => {
    return analyzePasswordStrength(currentPassword);
  }, [currentPassword]);

  // Generate password function
  const handleGenerate = useCallback(() => {
    const pwd = generatePassword(options);
    setCurrentPassword(pwd);
  }, [options]);

  // Initial password generation on mount
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Handle master password setup success
  const handleMasterSetupSuccess = (key: CryptoKey, _payload: EncryptedVaultPayload) => {
    setMasterKey(key);
    setHasMasterPassword(true);
    setIsVaultUnlocked(true);
    setVaultItems([]);
    setIsSetupMasterOpen(false);
  };

  // Handle unlock success
  const handleUnlockSuccess = (key: CryptoKey, items: VaultItem[]) => {
    setMasterKey(key);
    setVaultItems(items);
    setIsVaultUnlocked(true);
    setIsUnlockModalOpen(false);
  };

  // Reset vault confirmation
  const handleResetVault = () => {
    localStorage.removeItem('cipherforge_vault_data');
    localStorage.removeItem('cipherforge_vault_has_master');
    setHasMasterPassword(false);
    setMasterKey(null);
    setIsVaultUnlocked(false);
    setVaultItems([]);
    setIsUnlockModalOpen(false);
  };

  // Quick save to Encrypted Vault
  const handleSaveToVault = () => {
    if (!hasMasterPassword) {
      setIsSetupMasterOpen(true);
      return;
    }
    if (!isVaultUnlocked) {
      setIsUnlockModalOpen(true);
      return;
    }
    setIsQuickSaveModalOpen(true);
  };

  const handleSaveNewItemFromQuickSave = async (newItem: VaultItem) => {
    if (!masterKey) return;
    const updated = [newItem, ...vaultItems];
    try {
      const savedRaw = localStorage.getItem('cipherforge_vault_data');
      if (savedRaw) {
        const payload: EncryptedVaultPayload = JSON.parse(savedRaw);
        const encrypted = await encryptData(JSON.stringify(updated), masterKey);
        const updatedPayload: EncryptedVaultPayload = {
          ...payload,
          itemsCiphertext: encrypted.ciphertext,
          itemsIv: encrypted.iv,
          updatedAt: Date.now(),
        };
        localStorage.setItem('cipherforge_vault_data', JSON.stringify(updatedPayload));
      }
      setVaultItems(updated);
    } catch (err) {
      console.error('Failed to encrypt item:', err);
    }
  };

  const isSavedInVault = vaultItems.some(v => v.password === currentPassword);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar Contract with Encrypted Vault indicators */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSecurityGuide={() => setIsGuideOpen(true)}
        vaultCount={vaultItems.length}
        isVaultUnlocked={isVaultUnlocked}
        hasMasterPassword={hasMasterPassword}
        onLockVault={lockVault}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab 1: Primary Generator View */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <PasswordDisplay
              password={currentPassword}
              analysis={analysis}
              onRegenerate={handleGenerate}
              onOpenQr={() => setIsQrOpen(true)}
              onSaveToVault={handleSaveToVault}
              isSavedToVault={isSavedInVault}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <GeneratorControls
                  options={options}
                  setOptions={setOptions}
                  onGenerate={handleGenerate}
                />
              </div>

              <div className="lg:col-span-7">
                <StrengthAuditor
                  analysis={analysis}
                  password={currentPassword}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Strength Tester */}
        {activeTab === 'checker' && (
          <PasswordCheckerTab isCompareMode={false} />
        )}

        {/* Tab 3: Compare Passwords */}
        {activeTab === 'compare' && (
          <PasswordCheckerTab isCompareMode={true} />
        )}

        {/* Tab 4: Batch Generator Engine */}
        {activeTab === 'batch' && (
          <BatchGeneratorTab options={options} />
        )}

        {/* Tab 5: Bitwarden-Grade Encrypted Vault */}
        {activeTab === 'encryptedVault' && (
          <EncryptedVaultTab
            isUnlocked={isVaultUnlocked}
            hasMasterPassword={hasMasterPassword}
            masterKey={masterKey}
            items={vaultItems}
            setItems={setVaultItems}
            onLockVault={lockVault}
            onOpenSetupMaster={() => setIsSetupMasterOpen(true)}
            onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
            onOpenGenerator={() => {
              setActiveTab('generator');
            }}
            generatedPassword={currentPassword}
            autoLockMinutes={autoLockMinutes}
            setAutoLockMinutes={setAutoLockMinutes}
            clipboardTimeoutSeconds={clipboardTimeoutSeconds}
            setClipboardTimeoutSeconds={setClipboardTimeoutSeconds}
          />
        )}
      </main>

      {/* Bitwarden Master Password Setup Modal */}
      <MasterPasswordSetupModal
        isOpen={isSetupMasterOpen}
        onClose={() => setIsSetupMasterOpen(false)}
        onSuccess={handleMasterSetupSuccess}
      />

      {/* Bitwarden Vault Unlock Modal */}
      <VaultUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlockSuccess={handleUnlockSuccess}
        onResetVault={handleResetVault}
      />

      {/* Quick Save Modal for adding current password to vault */}
      <VaultItemModal
        isOpen={isQuickSaveModalOpen}
        onClose={() => setIsQuickSaveModalOpen(false)}
        item={null}
        onSave={handleSaveNewItemFromQuickSave}
        onOpenGenerator={() => {
          setIsQuickSaveModalOpen(false);
          setActiveTab('generator');
        }}
        generatedPassword={currentPassword}
      />

      {/* Air-Gapped QR Transfer Modal */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        password={currentPassword}
      />

      {/* Cryptographic Guide Modal */}
      <SecurityGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Clean Footer adhering to Anti-Slop Discipline */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CipherForge</span>
            <span>·</span>
            <span>Zero-Knowledge AES-256-GCM · 600k PBKDF2 Rounds · RFC 6238 TOTP</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Security Architecture
            </button>
            <span>·</span>
            <span>Bitwarden-Grade Local Cryptography</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
