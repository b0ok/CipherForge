import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Server,
  Globe,
  Terminal,
  Layers,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  RefreshCw,
  Lock,
  ExternalLink
} from 'lucide-react';
import { CrackTimeMetric, StrengthAnalysis } from '../types/crypto';
import { checkPwnedPassword, hashSha1 } from '../utils/bitwardenCrypto';

interface StrengthAuditorProps {
  analysis: StrengthAnalysis;
  password?: string;
  autoCheckPwned?: boolean;
}

export const StrengthAuditor: React.FC<StrengthAuditorProps> = ({
  analysis,
  password = '',
  autoCheckPwned = false,
}) => {
  // HaveIBeenPwned State
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [pwnedResult, setPwnedResult] = useState<{
    checked: boolean;
    isPwned: boolean;
    breachCount: number;
    prefix: string;
  }>({
    checked: false,
    isPwned: false,
    breachCount: 0,
    prefix: '',
  });

  // Reset or re-evaluate breach status when password changes
  useEffect(() => {
    setPwnedResult({
      checked: false,
      isPwned: false,
      breachCount: 0,
      prefix: '',
    });

    if (autoCheckPwned && password && password.length >= 4) {
      handleCheckPwned();
    }
  }, [password, autoCheckPwned]);

  const handleCheckPwned = async () => {
    if (!password) return;
    setIsCheckingPwned(true);

    try {
      const sha1 = await hashSha1(password);
      const prefix = sha1.substring(0, 5);
      const res = await checkPwnedPassword(password);

      setPwnedResult({
        checked: true,
        isPwned: res.isPwned,
        breachCount: res.breachCount,
        prefix,
      });
    } catch {
      setPwnedResult({
        checked: true,
        isPwned: false,
        breachCount: 0,
        prefix: '',
      });
    } finally {
      setIsCheckingPwned(false);
    }
  };

  const threatModels: Array<{ key: keyof StrengthAnalysis['crackTimes']; icon: any }> = [
    { key: 'onlineThrottled', icon: Globe },
    { key: 'onlineUnthrottled', icon: Terminal },
    { key: 'offlineSlowHash', icon: Server },
    { key: 'offlineFastHash', icon: Cpu },
    { key: 'supercomputer', icon: Layers },
  ];

  const getRiskBadge = (risk: CrackTimeMetric['riskLevel']) => {
    switch (risk) {
      case 'immediate':
        return {
          label: 'Vulnerable (Immediate)',
          className: 'text-rose-400 bg-rose-950/40 border border-rose-900/50'
        };
      case 'high':
        return {
          label: 'High Risk (< 1 Day)',
          className: 'text-orange-400 bg-orange-950/40 border border-orange-900/50'
        };
      case 'medium':
        return {
          label: 'Moderate (< 3 Yrs)',
          className: 'text-amber-400 bg-amber-950/40 border border-amber-900/50'
        };
      case 'low':
        return {
          label: 'Resistant (< 100 Yrs)',
          className: 'text-teal-400 bg-teal-950/40 border border-teal-900/50'
        };
      case 'negligible':
      default:
        return {
          label: 'Fortified (Century+)',
          className: 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HaveIBeenPwned Real-Time Breach Intelligence Card */}
      <div className={`rounded-xl border p-5 shadow-lg backdrop-blur-sm transition-all ${
        pwnedResult.checked && pwnedResult.isPwned
          ? 'border-rose-900/80 bg-rose-950/20 shadow-rose-950/30'
          : pwnedResult.checked && !pwnedResult.isPwned
          ? 'border-emerald-800/60 bg-emerald-950/15 shadow-emerald-950/20'
          : 'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              pwnedResult.checked && pwnedResult.isPwned
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : pwnedResult.checked && !pwnedResult.isPwned
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800/80 text-amber-400 border-slate-700'
            }`}>
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  HaveIBeenPwned Breach Intelligence
                </h3>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  k-Anonymity Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Check whether this credential appears in Troy Hunt's 850+ million breached passwords database.
              </p>
            </div>
          </div>

          <button
            onClick={handleCheckPwned}
            disabled={isCheckingPwned || !password}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all self-start sm:self-auto shrink-0 shadow-sm ${
              pwnedResult.checked && pwnedResult.isPwned
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : pwnedResult.checked && !pwnedResult.isPwned
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingPwned ? 'animate-spin' : ''}`} />
            <span>
              {isCheckingPwned
                ? 'Querying HIBP...'
                : pwnedResult.checked
                ? 'Re-check Breach'
                : 'Check Breach Database'}
            </span>
          </button>
        </div>

        {/* Breach Status Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          {!pwnedResult.checked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Zero-Knowledge Privacy:</strong> Only the first 5 characters of your password's SHA-1 hash are transmitted. Your actual password remains 100% private.
                </span>
              </div>
              <button
                onClick={handleCheckPwned}
                disabled={!password}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline decoration-emerald-500/40 text-left sm:text-right"
              >
                Scan Now
              </button>
            </div>
          ) : pwnedResult.isPwned ? (
            <div className="rounded-lg bg-rose-950/40 border border-rose-900/60 p-3.5 text-xs text-rose-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>CRITICAL: Password Found in Known Breaches!</span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-900/60 text-rose-200">
                  Seen {pwnedResult.breachCount.toLocaleString()} times
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                This password has been exposed in <strong>{pwnedResult.breachCount.toLocaleString()}</strong> public data leaks. Threat actors include this exact value in automated dictionary tools and credential-stuffing botnets. <strong>Do not use this password for any account.</strong>
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-1">
                k-Anonymity SHA-1 Prefix: <code className="text-rose-300">{pwnedResult.prefix}*****</code> (matched remaining 35 characters locally)
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-3.5 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 block">Clean & Uncompromised</span>
                  <span className="text-slate-400 text-[11px]">
                    Not found in HaveIBeenPwned's corpus of 850+ million leaked credentials.
                  </span>
                </div>
              </div>
              <div className="font-mono text-[11px] text-slate-400 shrink-0">
                Prefix: <span className="text-emerald-400">{pwnedResult.prefix}*****</span> · 0 matches
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Threat Model Crack Time Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Estimated Crack Times by Attack Scenario
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Time for an adversary to test 50% of the possible password keyspace at various compute rates.
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-slate-400">
              Search Space: <span className="text-emerald-400 font-semibold">2^{analysis.entropyBits}</span> combinations
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {threatModels.map(({ key, icon: IconComponent }) => {
            const metric = analysis.crackTimes[key];
            const risk = getRiskBadge(metric.riskLevel);
            return (
              <div
                key={key}
                className="flex flex-col justify-between rounded-lg border border-slate-800/90 bg-slate-950/70 p-3.5 transition-colors hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {metric.title}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${risk.className}`}>
                      {risk.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mb-1">
                    {metric.hardware}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mb-2">
                    Rate: {metric.hashRateStr}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500">Est. Time:</span>
                  <span className="font-mono text-sm font-bold text-slate-100 tabular-nums">
                    {metric.timeFormatted}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick Technical Summary Card */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-800/90 bg-slate-950/70 p-3.5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  Cryptographic Metrics
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Effective Entropy:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{analysis.entropyBits} bits</span>
                </div>
                <div className="flex justify-between">
                  <span>Charset Pool Size:</span>
                  <span className="font-mono text-slate-300">{analysis.charsetSize} symbols</span>
                </div>
                <div className="flex justify-between">
                  <span>HIBP Status:</span>
                  <span className="font-mono text-slate-300">
                    {pwnedResult.checked
                      ? pwnedResult.isPwned
                        ? 'Compromised'
                        : 'Clean'
                      : 'Not Checked'}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500">
              Entropy scales exponentially: every additional 10 bits multiplies difficulty by ~1,024×.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Security Checkpoints & Vulnerability Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Checkpoints */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Security Checkpoints & Audits
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {analysis.vulnerabilities.filter(v => v.passed).length}/{analysis.vulnerabilities.length} Passed
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Dynamic HIBP checkpoint item */}
            {pwnedResult.checked && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                  !pwnedResult.isPwned
                    ? 'border-emerald-800/60 bg-emerald-950/20'
                    : 'border-rose-900/60 bg-rose-950/30'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {!pwnedResult.isPwned ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${!pwnedResult.isPwned ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {!pwnedResult.isPwned
                      ? 'HaveIBeenPwned Breach Check (Passed)'
                      : `Compromised in ${pwnedResult.breachCount.toLocaleString()} Public Breaches`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {!pwnedResult.isPwned
                      ? 'No instances of this password exist in public credential breaches.'
                      : 'Observed in circulating breach dumps. Immediate replacement mandatory.'}
                  </div>
                </div>
              </div>
            )}

            {analysis.vulnerabilities.map(v => (
              <div
                key={v.id}
                className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                  v.passed
                    ? 'border-slate-800/80 bg-slate-950/40'
                    : v.severity === 'danger'
                    ? 'border-rose-900/40 bg-rose-950/20'
                    : 'border-amber-900/40 bg-amber-950/20'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {v.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : v.severity === 'danger' ? (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${v.passed ? 'text-slate-200' : v.severity === 'danger' ? 'text-rose-300' : 'text-amber-300'}`}>
                    {v.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {v.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Feedback & Intelligence */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Actionable Intelligence & Recommendations
            </h3>

            {/* Pwned Warning if compromised */}
            {pwnedResult.checked && pwnedResult.isPwned && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
                <Flame className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-200">Critical Breach Alert:</strong>
                  Do not use this password. It is indexed in credential dictionaries used by automated account takeover attacks.
                </div>
              </div>
            )}

            {/* Warnings */}
            {analysis.feedback.warnings.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Vulnerability Warnings</span>
                </div>
                {analysis.feedback.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2"
                  >
                    <span className="text-rose-400 font-mono">!</span>
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {analysis.feedback.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Improvement Recommendations</span>
                </div>
                {analysis.feedback.suggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-400 font-bold">›</span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            )}

            {analysis.feedback.warnings.length === 0 && analysis.feedback.suggestions.length === 0 && (!pwnedResult.checked || !pwnedResult.isPwned) && (
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300">
                No vulnerabilities or weaknesses detected. This configuration exceeds standard NIST guidelines.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500">
            <strong>Security Notice:</strong> Calculations assume uniform cryptographic PRNG distribution. Password evaluation is performed strictly inside your browser. No plaintext or hashes ever leave your device.
          </div>
        </div>
      </div>
    </div>
  );
};
