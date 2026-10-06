import React from 'react';
import { X, BookOpen, ShieldAlert, Cpu, Key, CheckCircle2 } from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl scrollbar-thin scrollbar-thumb-slate-700">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Entropy & Cryptographic Scoring Guide
            </h3>
            <p className="text-xs text-slate-400">
              The mathematics of password resilience, keyspace entropy, and threat hardware.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Shannon Entropy & Keyspace */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Key className="h-4 w-4" />
              <span>1. How Entropy Is Measured (Bits)</span>
            </h4>
            <p className="mb-2">
              Password strength is fundamentally determined by <strong>information entropy</strong> (measured in bits). Each bit of entropy doubles the number of guesses an adversary must make to crack the password:
            </p>
            <div className="p-3 bg-slate-900 rounded font-mono text-emerald-300 mb-2 text-center text-xs">
              Keyspace Complexity = 2^Bits &nbsp;·&nbsp; Entropy = Length × log₂(Charset Size)
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>&lt; 35 bits (Critical):</strong> Cracks instantly on laptops (&lt; 1 second).</li>
              <li><strong>40–60 bits (Moderate):</strong> Resists basic web attacks; falls quickly to offline GPU hash dumps.</li>
              <li><strong>65–85 bits (Strong):</strong> Secure against multi-GPU rigs for decades.</li>
              <li><strong>90+ bits (Military / Quantum-Resistant):</strong> Trillions of years required, even under state-level supercomputing clusters.</li>
            </ul>
          </div>

          {/* Section 2: Length Beats Complexity */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>2. Why Length Overpowers Cryptic Substitutions</span>
            </h4>
            <p className="mb-2">
              Replacing letters with lookalike numbers (like <code className="text-amber-300 font-mono">P@ssw0rd!</code>) offers almost zero defense against modern password crackers like Hashcat or John the Ripper. These tools incorporate leetspeak rules into their primary dictionary passes.
            </p>
            <p>
              In contrast, <strong>passphrases</strong> (4 to 6 random words chosen from a large dictionary like Diceware) provide upwards of <strong>70–90 bits of true entropy</strong> while remaining vastly easier for humans to type accurately on mobile and desktop keyboards without transcription errors.
            </p>
          </div>

          {/* Section 3: The 5 Threat Models */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Cpu className="h-4 w-4" />
              <span>3. Modern Threat Models Explained</span>
            </h4>
            <div className="space-y-2 text-slate-400">
              <div>
                <strong className="text-slate-200">Online Throttled (10/min):</strong> Web login portals that rate-limit and lock accounts after invalid attempts.
              </div>
              <div>
                <strong className="text-slate-200">Online API (1,000/sec):</strong> Unprotected internal microservices or public endpoints without CAPTCHAs.
              </div>
              <div>
                <strong className="text-slate-200">Offline Slow Hash (10,000/sec):</strong> Passwords stored with memory-hard algorithms (Argon2id, bcrypt, scrypt) leaked in data breaches.
              </div>
              <div>
                <strong className="text-slate-200">Offline Fast Hash (100 Billion/sec):</strong> Legacy algorithms (MD5, SHA1, NTLM) run on dedicated 8x RTX 4090 GPU rigs.
              </div>
              <div>
                <strong className="text-slate-200">Nation-State Cluster (100 Trillion/sec):</strong> Massive distributed supercomputers and botnet swarms.
              </div>
            </div>
          </div>

          {/* Section 4: NIST SP 800-63B Standards */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span>4. NIST SP 800-63B Official Recommendations</span>
            </h4>
            <p className="text-slate-400 mb-2">
              The National Institute of Standards and Technology (NIST) updated its guidance:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Do NOT enforce arbitrary periodic rotations (e.g. 90-day changes lead to weaker predictable patterns).</li>
              <li>Allow long passwords (up to 64 or 128 characters) including spaces and all printable characters.</li>
              <li>Check against known leaked password dictionaries (e.g., HaveIBeenPwned corpus).</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
