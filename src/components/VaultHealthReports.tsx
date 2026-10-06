import React, { useState } from 'react';
import { VaultItem } from '../types/vault';
import { analyzePasswordStrength } from '../utils/strengthAnalyzer';
import { checkPwnedPassword } from '../utils/bitwardenCrypto';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Repeat,
  Flame,
  Clock,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface VaultHealthReportsProps {
  items: VaultItem[];
  onEditItem: (item: VaultItem) => void;
}

export const VaultHealthReports: React.FC<VaultHealthReportsProps> = ({
  items,
  onEditItem,
}) => {
  const [activeReport, setActiveReport] = useState<'reused' | 'weak' | 'pwned' | 'missing2fa'>('reused');
  const [isScanningPwned, setIsScanningPwned] = useState(false);
  const [pwnedResults, setPwnedResults] = useState<Record<string, { isPwned: boolean; breachCount: number }>>({});

  // 1. Reused Passwords Analysis
  const passwordMap: Record<string, VaultItem[]> = {};
  items.forEach(item => {
    if (item.password) {
      passwordMap[item.password] = passwordMap[item.password] || [];
      passwordMap[item.password].push(item);
    }
  });

  const reusedGroups = Object.entries(passwordMap)
    .filter(([_, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  // 2. Weak Passwords Analysis
  const weakItems = items.filter(item => {
    if (!item.password) return false;
    const analysis = analyzePasswordStrength(item.password);
    return analysis.score < 60 || analysis.entropyBits < 50;
  });

  // 3. Missing 2FA Analysis
  const missing2faItems = items.filter(item => item.type === 'login' && !item.totpSeed);

  // Batch Pwned Passwords Scan using k-Anonymity
  const handleScanPwned = async () => {
    setIsScanningPwned(true);
    const results: Record<string, { isPwned: boolean; breachCount: number }> = {};

    for (const item of items) {
      if (item.password) {
        const res = await checkPwnedPassword(item.password);
        results[item.id] = res;
      }
    }

    setPwnedResults(results);
    setIsScanningPwned(false);
  };

  const compromisedItems = items.filter(item => pwnedResults[item.id]?.isPwned);

  return (
    <div className="space-y-5">
      {/* Report Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Bitwarden-Grade Vault Health Reports</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Automated cryptographic audit of all items in your encrypted vault.
            </p>
          </div>

          <button
            onClick={handleScanPwned}
            disabled={isScanningPwned || items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isScanningPwned ? 'animate-spin' : ''}`} />
            <span>{isScanningPwned ? 'Auditing with HIBP...' : 'Scan Leaked Databases'}</span>
          </button>
        </div>

        {/* 4 Report Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <button
            onClick={() => setActiveReport('reused')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeReport === 'reused'
                ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Repeat className="h-4 w-4" />
              <span className="font-mono text-xs font-bold">{reusedGroups.length}</span>
            </div>
            <div className="text-xs font-medium mt-1">Reused Passwords</div>
            <div className="text-[10px] text-slate-500">Shared across multiple sites</div>
          </button>

          <button
            onClick={() => setActiveReport('weak')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeReport === 'weak'
                ? 'border-rose-500/50 bg-rose-950/20 text-rose-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-mono text-xs font-bold">{weakItems.length}</span>
            </div>
            <div className="text-xs font-medium mt-1">Weak Passwords</div>
            <div className="text-[10px] text-slate-500">Below 50 bits of entropy</div>
          </button>

          <button
            onClick={() => setActiveReport('pwned')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeReport === 'pwned'
                ? 'border-red-500/50 bg-red-950/20 text-red-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Flame className="h-4 w-4" />
              <span className="font-mono text-xs font-bold">{compromisedItems.length}</span>
            </div>
            <div className="text-xs font-medium mt-1">Breached Passwords</div>
            <div className="text-[10px] text-slate-500">Exposed in public breaches</div>
          </button>

          <button
            onClick={() => setActiveReport('missing2fa')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeReport === 'missing2fa'
                ? 'border-sky-500/50 bg-sky-950/20 text-sky-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <KeyRound className="h-4 w-4" />
              <span className="font-mono text-xs font-bold">{missing2faItems.length}</span>
            </div>
            <div className="text-xs font-medium mt-1">Inactive 2FA / TOTP</div>
            <div className="text-[10px] text-slate-500">Logins lacking authenticator</div>
          </button>
        </div>
      </div>

      {/* REPORT CONTENT */}

      {/* 1. Reused Passwords */}
      {activeReport === 'reused' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-amber-400" />
            <span>Reused Passwords Report</span>
          </h3>

          {reusedGroups.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              No reused passwords found. Each account has a unique credential.
            </div>
          ) : (
            <div className="space-y-4">
              {reusedGroups.map(([pwd, group], idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-400 font-semibold">
                      Reused across {group.length} items
                    </span>
                    <span className="font-mono text-slate-500">
                      {'•'.repeat(Math.min(16, pwd.length))}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {group.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onEditItem(item)}
                        className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-200">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.username || 'No username'}</div>
                        </div>
                        <span className="text-[10px] text-emerald-400">Update ›</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Weak Passwords */}
      {activeReport === 'weak' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Weak Passwords Report</span>
          </h3>

          {weakItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              All passwords in your vault meet strong entropy thresholds.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 text-xs">
              {weakItems.map(item => {
                const analysis = analyzePasswordStrength(item.password || '');
                return (
                  <div
                    key={item.id}
                    onClick={() => onEditItem(item)}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.username} · {analysis.entropyBits} bits entropy ({analysis.ratingLabel})
                      </div>
                    </div>
                    <span className="text-[11px] text-rose-400 font-medium">
                      Score: {analysis.score}/100 ›
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Breached Passwords */}
      {activeReport === 'pwned' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-400" />
              <span>Exposed / Breached Passwords Report</span>
            </h3>
            <span className="text-[11px] text-slate-500">Have I Been Pwned API</span>
          </div>

          {Object.keys(pwnedResults).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <p>Click "Scan Leaked Databases" to check all vault passwords against billions of leaked credentials.</p>
              <p className="text-[11px] text-slate-500">
                Uses k-Anonymity mathematical hashing: only the first 5 characters of the SHA-1 hash leave your device.
              </p>
              <button
                onClick={handleScanPwned}
                disabled={isScanningPwned || items.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-block mt-2"
              >
                Start Audit Now
              </button>
            </div>
          ) : compromisedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              None of your passwords were found in known public data breaches!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 text-xs">
              {compromisedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onEditItem(item)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.username}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400">
                      Exposed {pwnedResults[item.id].breachCount.toLocaleString()}×
                    </span>
                    <div className="text-[10px] text-slate-500">Replace immediately ›</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Missing 2FA */}
      {activeReport === 'missing2fa' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-400" />
            <span>Missing Two-Factor Authenticator (TOTP)</span>
          </h3>

          {missing2faItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              All login accounts have an active 2FA TOTP seed configured!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 text-xs">
              {missing2faItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onEditItem(item)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.username || item.uri}</div>
                  </div>
                  <span className="text-[11px] text-sky-400 font-medium">
                    + Add TOTP Key ›
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
