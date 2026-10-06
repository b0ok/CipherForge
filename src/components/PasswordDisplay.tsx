import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Eye,
  EyeOff,
  QrCode,
  BookmarkPlus,
  Palette
} from 'lucide-react';
import { StrengthAnalysis } from '../types/crypto';

interface PasswordDisplayProps {
  password: string;
  analysis: StrengthAnalysis;
  onRegenerate: () => void;
  onOpenQr: () => void;
  onSaveToVault: () => void;
  isSavedToVault: boolean;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  password,
  analysis,
  onRegenerate,
  onOpenQr,
  onSaveToVault,
  isSavedToVault,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setIsSpinning(true);
    onRegenerate();
    setTimeout(() => setIsSpinning(false), 300);
  };

  // Color mapper for character heatmap
  const getCharStyle = (type: string, isAmbiguous: boolean) => {
    if (isAmbiguous) {
      return 'text-amber-300 underline decoration-amber-500/60 decoration-dotted';
    }
    switch (type) {
      case 'upper':
        return 'text-sky-300 font-semibold';
      case 'lower':
        return 'text-slate-200';
      case 'number':
        return 'text-emerald-400 font-semibold';
      case 'symbol':
        return 'text-fuchsia-400 font-semibold';
      case 'space':
        return 'bg-slate-800/80 text-slate-500 px-0.5 rounded';
      default:
        return 'text-violet-300';
    }
  };

  // Rating color palette
  const getRatingColor = () => {
    switch (analysis.rating) {
      case 'optimal':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
      case 'strong':
        return 'text-teal-400 border-teal-500/40 bg-teal-950/30';
      case 'fair':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
      case 'weak':
        return 'text-orange-400 border-orange-500/40 bg-orange-950/30';
      case 'critical':
      default:
        return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
    }
  };

  const getScoreBarColor = () => {
    switch (analysis.rating) {
      case 'optimal':
        return 'bg-emerald-500';
      case 'strong':
        return 'bg-teal-500';
      case 'fair':
        return 'bg-amber-500';
      case 'weak':
        return 'bg-orange-500';
      case 'critical':
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm transition-all">
      {/* Top Bar inside Display: Metadata & Toggles */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md border font-medium ${getRatingColor()}`}>
            {analysis.ratingLabel}
          </span>
          <span className="text-slate-400 font-mono tabular-nums">
            {analysis.entropyBits} bits entropy
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 font-mono tabular-nums hidden sm:inline">
            {analysis.charCounts.total} characters
          </span>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showHeatmap
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle character-type colored syntax highlighting"
          >
            <Palette className="h-3 w-3" />
            <span className="hidden sm:inline">Colorized</span>
          </button>
          <button
            onClick={() => setIsMasked(!isMasked)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title={isMasked ? 'Reveal password' : 'Hide password for shoulder-surfing safety'}
          >
            {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{isMasked ? 'Reveal' : 'Mask'}</span>
          </button>
        </div>
      </div>

      {/* Main Password Output Canvas */}
      <div className="group relative flex min-h-[5rem] items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/90 px-4 py-3 sm:px-5">
        <div className="max-w-[70%] sm:max-w-[76%] overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800">
          {isMasked ? (
            <div className="font-mono text-lg sm:text-2xl tracking-widest text-slate-500 select-none">
              {'•'.repeat(Math.min(36, password.length))}
            </div>
          ) : showHeatmap ? (
            <div className="font-mono text-base sm:text-2xl tracking-wider select-all break-all whitespace-pre-wrap font-medium">
              {analysis.breakdown.map((item, idx) => (
                <span
                  key={idx}
                  className={`${getCharStyle(item.type, item.isAmbiguous)} transition-colors`}
                  title={`${item.type.toUpperCase()}${item.isAmbiguous ? ' (Ambiguous char)' : ''}`}
                >
                  {item.char}
                </span>
              ))}
            </div>
          ) : (
            <div className="font-mono text-base sm:text-2xl tracking-wider text-slate-100 select-all break-all whitespace-pre-wrap font-medium">
              {password}
            </div>
          )}
        </div>

        {/* Action Controls cluster */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 pl-2">
          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={isSpinning}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 active:scale-95 transition-all"
            title="Generate new password (CSPRNG)"
          >
            <RotateCw className={`h-4 w-4 ${isSpinning ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex h-10 items-center gap-1.5 rounded-lg px-3 sm:px-4 font-medium text-xs sm:text-sm transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="Copy password to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* QR Code Transfer Button */}
          <button
            onClick={onOpenQr}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            title="Display QR code to scan with mobile camera"
          >
            <QrCode className="h-4 w-4" />
          </button>

          {/* Save to History / Vault */}
          <button
            onClick={onSaveToVault}
            className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
              isSavedToVault
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isSavedToVault ? 'Saved to Vault' : 'Save to temporary session vault'}
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Strength Progress Meter */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-300">Security Score</span>
            <span className="font-mono tabular-nums text-slate-400">
              {analysis.score}/100
            </span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Fast Hash Crack Time: <span className="text-slate-300 font-mono">{analysis.crackTimes.offlineFastHash.timeFormatted}</span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${getScoreBarColor()}`}
            style={{ width: `${Math.max(4, analysis.score)}%` }}
          />
        </div>
      </div>

      {/* Character Type Legend if heatmap is enabled */}
      {showHeatmap && !isMasked && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Uppercase ({analysis.charCounts.upper})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span>Lowercase ({analysis.charCounts.lower})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Numbers ({analysis.charCounts.numbers})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
            <span>Symbols ({analysis.charCounts.symbols})</span>
          </div>
          {analysis.breakdown.some(b => b.isAmbiguous) && (
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Ambiguous (i, l, 1, 0, O)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
