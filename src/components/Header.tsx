import React from 'react';
import { ShieldCheck, BookOpen, Clock, Lock } from 'lucide-react';

export type ActiveTab = 'generator' | 'checker' | 'compare' | 'batch' | 'encryptedVault';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSecurityGuide: () => void;
  vaultCount: number;
  isVaultUnlocked: boolean;
  hasMasterPassword: boolean;
  onLockVault: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSecurityGuide,
  vaultCount,
  isVaultUnlocked,
  hasMasterPassword,
  onLockVault,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <button
            onClick={() => setActiveTab('generator')}
            className="text-left font-bold tracking-tight text-white hover:text-emerald-400 transition-colors text-lg"
          >
            CipherForge
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'checker'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Strength Tester
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'batch'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Batch Engine
          </button>
          <button
            onClick={() => setActiveTab('encryptedVault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'encryptedVault'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Encrypted Vault</span>
            {hasMasterPassword && (
              <span
                className={`h-2 w-2 rounded-full ${
                  isVaultUnlocked ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={isVaultUnlocked ? 'Vault is Unlocked' : 'Vault is Locked'}
              />
            )}
            {vaultCount > 0 && (
              <span className="font-mono text-xs tabular-nums text-slate-400">
                ({vaultCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action / Security Guide & Vault Lock indicator */}
        <div className="flex items-center gap-2">
          {hasMasterPassword && isVaultUnlocked && (
            <button
              onClick={onLockVault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/40 rounded-lg transition-colors whitespace-nowrap"
              title="Lock encrypted vault immediately"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>
          )}

          <button
            onClick={onOpenSecurityGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
            title="Cryptographic methodology & threat models"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Entropy Guide</span>
          </button>

          <div className="hidden xl:flex items-center gap-1 text-xs text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">AES-256-GCM / 600k PBKDF2</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-900 px-3 py-2 gap-1 scrollbar-none bg-slate-950">
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'generator' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setActiveTab('checker')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'checker' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Tester
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'compare' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'batch' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Batch
        </button>
        <button
          onClick={() => setActiveTab('encryptedVault')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'encryptedVault' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="h-3 w-3" />
          <span>Vault ({vaultCount})</span>
        </button>
      </div>
    </header>
  );
};
