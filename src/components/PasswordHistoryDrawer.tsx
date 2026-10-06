import React, { useState } from 'react';
import { HistoryItem } from '../types/crypto';
import {
  Clock,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  Shield,
  ShieldCheck
} from 'lucide-react';

interface PasswordHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const PasswordHistoryDrawer: React.FC<PasswordHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.password);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleExportVault = () => {
    const text = history
      .map(
        h =>
          `[${new Date(h.createdAt).toLocaleTimeString()}] (${h.entropyBits} bits, score: ${h.score}): ${h.password}`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherforge_vault_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">
                Session Vault & Generation History
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Passwords generated during this session are temporarily preserved here so you never lose one during testing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportVault}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download Vault</span>
                </button>
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 text-xs font-medium transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security disclaimer banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero-Knowledge Architecture:</strong> This vault is stored strictly in ephemeral browser memory. No data is synchronized or sent to external servers. Refreshing or closing this tab completely purges the session.
          </span>
        </div>
      </div>

      {/* History Items list */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
          <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Vault is empty</p>
          <p className="text-xs text-slate-500 mt-1">
            Generated passwords will appear here automatically for fast retrieval.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item, index) => {
            const isRevealed = revealedIds[item.id] || false;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 transition-colors hover:border-slate-700 font-mono text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-600 tabular-nums w-6 text-center">
                    #{history.length - index}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isRevealed ? (
                        <span className="font-semibold text-slate-100 select-all break-all">
                          {item.password}
                        </span>
                      ) : (
                        <span className="tracking-widest text-slate-500 select-none">
                          {'•'.repeat(Math.min(24, item.password.length))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                      <span>·</span>
                      <span className="text-emerald-400">{item.entropyBits} bits</span>
                      <span>·</span>
                      <span>{item.ratingLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => toggleReveal(item.id)}
                    className="p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
                    title={isRevealed ? 'Hide' : 'Reveal'}
                  >
                    {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleCopy(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
