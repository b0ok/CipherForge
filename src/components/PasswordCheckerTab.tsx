import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ClipboardPaste,
  Trash2
} from 'lucide-react';
import { analyzePasswordStrength } from '../utils/strengthAnalyzer';
import { StrengthAuditor } from './StrengthAuditor';

interface PasswordCheckerTabProps {
  isCompareMode?: boolean;
}

export const PasswordCheckerTab: React.FC<PasswordCheckerTabProps> = ({
  isCompareMode = false,
}) => {
  // Tester state
  const [testPassword, setTestPassword] = useState('Tr0ub4dor&3');
  const [showTestPassword, setShowTestPassword] = useState(true);
  const [copiedTest, setCopiedTest] = useState(false);

  // Compare mode states
  const [passwordA, setPasswordA] = useState('P@ssword2024');
  const [passwordB, setPasswordB] = useState('Crimson#Falcon-92-Breeze');
  const [showA, setShowA] = useState(true);
  const [showB, setShowB] = useState(true);

  // Analyzers
  const analysisSingle = analyzePasswordStrength(testPassword);
  const analysisA = analyzePasswordStrength(passwordA);
  const analysisB = analyzePasswordStrength(passwordB);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setTestPassword(text);
    } catch {
      // ignore
    }
  };

  const handleCopyTest = async () => {
    if (!testPassword) return;
    try {
      await navigator.clipboard.writeText(testPassword);
      setCopiedTest(true);
      setTimeout(() => setCopiedTest(false), 2000);
    } catch {
      // ignore
    }
  };

  if (isCompareMode) {
    const entropyGain = Math.round((analysisB.entropyBits - analysisA.entropyBits) * 10) / 10;
    const scoreGain = analysisB.score - analysisA.score;

    return (
      <div className="space-y-6">
        {/* Intro */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Password Migration & Comparison Audit
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark your existing password against an upgraded passphrase or randomized key to measure security gains.
              </p>
            </div>
            {entropyGain > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Gain: +{entropyGain} bits entropy (+{scoreGain} pts)</span>
              </div>
            )}
          </div>

          {/* Side by side inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
            {/* Password A (Baseline) */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password A (Current / Baseline)
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  analysisA.score >= 75 ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                }`}>
                  Score: {analysisA.score}/100
                </span>
              </div>

              <div className="relative mb-3">
                <input
                  type={showA ? 'text' : 'password'}
                  value={passwordA}
                  onChange={e => setPasswordA(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowA(!showA)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showA ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-900 pt-2.5 font-mono">
                <div className="flex justify-between">
                  <span>Entropy:</span>
                  <span className="text-slate-200">{analysisA.entropyBits} bits</span>
                </div>
                <div className="flex justify-between">
                  <span>Length:</span>
                  <span className="text-slate-200">{analysisA.charCounts.total} chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Fast Hash GPU:</span>
                  <span className="text-rose-400">{analysisA.crackTimes.offlineFastHash.timeFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Hash:</span>
                  <span className="text-slate-300">{analysisA.crackTimes.offlineSlowHash.timeFormatted}</span>
                </div>
              </div>
            </div>

            {/* Password B (Upgraded) */}
            <div className="rounded-lg border border-emerald-900/40 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Password B (Upgraded Candidate)
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  analysisB.score >= 75 ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                }`}>
                  Score: {analysisB.score}/100
                </span>
              </div>

              <div className="relative mb-3">
                <input
                  type={showB ? 'text' : 'password'}
                  value={passwordB}
                  onChange={e => setPasswordB(e.target.value)}
                  placeholder="Enter candidate password..."
                  className="w-full rounded-lg border border-emerald-700/60 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowB(!showB)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showB ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-900 pt-2.5 font-mono">
                <div className="flex justify-between">
                  <span>Entropy:</span>
                  <span className="text-emerald-400 font-semibold">{analysisB.entropyBits} bits</span>
                </div>
                <div className="flex justify-between">
                  <span>Length:</span>
                  <span className="text-emerald-400 font-semibold">{analysisB.charCounts.total} chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Fast Hash GPU:</span>
                  <span className="text-emerald-400 font-semibold">{analysisB.crackTimes.offlineFastHash.timeFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Hash:</span>
                  <span className="text-emerald-400 font-semibold">{analysisB.crackTimes.offlineSlowHash.timeFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Verdict */}
          <div className="mt-4 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">Comparison Verdict: </span>
            {entropyGain > 20 ? (
              <span className="text-emerald-300">
                Password B provides a decisive cryptographic upgrade, increasing resistance against offline GPU cluster attacks from {analysisA.crackTimes.offlineFastHash.timeFormatted} to {analysisB.crackTimes.offlineFastHash.timeFormatted}.
              </span>
            ) : entropyGain > 0 ? (
              <span className="text-amber-300">
                Password B offers a moderate upgrade (+{entropyGain} bits), but consider extending the length to 16+ characters or using a 4-word Diceware passphrase for true military-grade security.
              </span>
            ) : (
              <span className="text-rose-300">
                Password B is weaker or identical to Password A. Expand length or add character variety to increase entropy.
              </span>
            )}
          </div>
        </div>

        {/* Detailed Audit of the Upgraded Password */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            In-Depth Analysis: Password B
          </h3>
          <StrengthAuditor analysis={analysisB} password={passwordB} />
        </div>
      </div>
    );
  }

  // Single Password Tester Mode
  return (
    <div className="space-y-6">
      {/* Input Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Interactive Strength & Vulnerability Tester
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type or paste any password to analyze keyspace entropy, pattern risks, and GPU crack times in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              <span>Paste</span>
            </button>
            <button
              onClick={() => setTestPassword('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Clear text"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Password input box with action icons */}
        <div className="relative mt-3">
          <input
            type={showTestPassword ? 'text' : 'password'}
            value={testPassword}
            onChange={e => setTestPassword(e.target.value)}
            placeholder="Type or paste password to test..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base sm:text-lg font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none pr-24"
          />
          <div className="absolute right-3 top-3 flex items-center gap-2 text-slate-400">
            <button
              onClick={() => setShowTestPassword(!showTestPassword)}
              className="p-1 hover:text-slate-200 transition-colors"
              title={showTestPassword ? 'Hide password' : 'Show password'}
            >
              {showTestPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCopyTest}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Copy"
            >
              {copiedTest ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            Length: <span className="text-slate-200">{analysisSingle.charCounts.total} chars</span>
          </div>
          <div>·</div>
          <div>
            Entropy: <span className="text-emerald-400 font-semibold">{analysisSingle.entropyBits} bits</span>
          </div>
          <div>·</div>
          <div>
            Rating: <span className="text-slate-200 font-medium">{analysisSingle.ratingLabel}</span>
          </div>
          <div>·</div>
          <div>
            Score: <span className="text-slate-200">{analysisSingle.score}/100</span>
          </div>
        </div>
      </div>

      {/* Complete Auditor for the tested password */}
      <StrengthAuditor analysis={analysisSingle} password={testPassword} />
    </div>
  );
};
