import React from 'react';
import { GeneratorMode, GeneratorOptions } from '../types/crypto';
import {
  KeyRound,
  BookOpenCheck,
  Hash,
  Speech,
  Check,
  Sparkles
} from 'lucide-react';

interface GeneratorControlsProps {
  options: GeneratorOptions;
  setOptions: React.Dispatch<React.SetStateAction<GeneratorOptions>>;
  onGenerate: () => void;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  options,
  setOptions,
  onGenerate,
}) => {
  const updateOption = <K extends keyof GeneratorOptions>(key: K, value: GeneratorOptions[K]) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleModeChange = (mode: GeneratorMode) => {
    updateOption('mode', mode);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
      {/* Mode Switcher Segmented Control */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
          Generation Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          <button
            onClick={() => handleModeChange('random')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              options.mode === 'random'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Random Custom</span>
          </button>
          <button
            onClick={() => handleModeChange('passphrase')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              options.mode === 'passphrase'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
            <span>Memorable Words</span>
          </button>
          <button
            onClick={() => handleModeChange('pin')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              options.mode === 'pin'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
            <span>PIN Code</span>
          </button>
          <button
            onClick={() => handleModeChange('pronounceable')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              options.mode === 'pronounceable'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Speech className="h-3.5 w-3.5" />
            <span>Pronounceable</span>
          </button>
        </div>
      </div>

      {/* MODE 1: RANDOM CUSTOM */}
      {options.mode === 'random' && (
        <div className="space-y-5">
          {/* Length Slider & Direct Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-200">
                Password Length
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={4}
                  max={128}
                  value={options.length}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 16;
                    updateOption('length', Math.max(4, Math.min(128, val)));
                  }}
                  className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-sm tabular-nums text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400">chars</span>
              </div>
            </div>

            <input
              type="range"
              min={4}
              max={128}
              value={options.length}
              onChange={e => updateOption('length', parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500 transition-all hover:bg-slate-700"
            />

            {/* Quick length presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Presets:</span>
              {[12, 16, 24, 32, 64].map(len => (
                <button
                  key={len}
                  onClick={() => updateOption('length', len)}
                  className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums transition-colors ${
                    options.length === len
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Character Sets Checkboxes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
              Character Inclusions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">Uppercase Letters</span>
                  <span className="font-mono text-[11px] text-slate-400">A B C D E F ...</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={e => updateOption('includeUppercase', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">Lowercase Letters</span>
                  <span className="font-mono text-[11px] text-slate-400">a b c d e f ...</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={e => updateOption('includeLowercase', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">Numbers</span>
                  <span className="font-mono text-[11px] text-slate-400">0 1 2 3 4 5 6 7 8 9</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={e => updateOption('includeNumbers', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200">Standard Symbols</span>
                  <span className="font-mono text-[11px] text-slate-400">! @ # $ % ^ & * ( )</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={e => updateOption('includeSymbols', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Hardening & Hygiene Rules */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
              Hardening Rules
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-medium text-slate-200">Exclude Ambiguous Characters</span>
                  <span className="text-[11px] text-slate-400">Omit lookalikes: 0, O, o, 1, l, I, |</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={e => updateOption('excludeAmbiguous', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-colors">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-medium text-slate-200">Avoid Sequential Duplicates</span>
                  <span className="text-[11px] text-slate-400">Prevent adjacent identical chars (e.g. "aa")</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.avoidRepeats}
                  onChange={e => updateOption('avoidRepeats', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MEMORABLE PASSPHRASE (DICEWARE) */}
      {options.mode === 'passphrase' && (
        <div className="space-y-5">
          {/* Word Count */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-200">
                Word Count (Diceware)
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {options.wordCount}
                </span>
                <span className="text-xs text-slate-400">words</span>
              </div>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              value={options.wordCount}
              onChange={e => updateOption('wordCount', parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500 transition-all hover:bg-slate-700"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Suggested:</span>
              {[4, 5, 6, 8].map(count => (
                <button
                  key={count}
                  onClick={() => updateOption('wordCount', count)}
                  className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums transition-colors ${
                    options.wordCount === count
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count} words ({count * 12.9 > 70 ? 'High Entropy' : 'Standard'})
                </button>
              ))}
            </div>
          </div>

          {/* Word Delimiter */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Word Separator
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Hyphen (-)', val: '-' },
                { label: 'Underscore (_)', val: '_' },
                { label: 'Dot (.)', val: '.' },
                { label: 'Space ( )', val: ' ' },
                { label: 'Slash (/)', val: '/' },
                { label: 'Hash (#)', val: '#' },
              ].map(sep => (
                <button
                  key={sep.val}
                  onClick={() => updateOption('delimiter', sep.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                    options.delimiter === sep.val
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sep.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capitalization Style */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Capitalization
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'title', label: 'TitleCase', preview: 'Solar-Beacon' },
                { id: 'none', label: 'lowercase', preview: 'solar-beacon' },
                { id: 'upper', label: 'UPPERCASE', preview: 'SOLAR-BEACON' },
                { id: 'random', label: 'RandomCase', preview: 'solar-Beacon' },
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => updateOption('capitalizeMode', style.id as any)}
                  className={`p-2 rounded-lg text-left border transition-colors ${
                    options.capitalizeMode === style.id
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-200">{style.label}</div>
                  <div className="font-mono text-[10px] text-slate-500">{style.preview}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Number & Symbol Injection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">Append Number</span>
                <span className="text-[11px] text-slate-400">Embed random 2-digit number</span>
              </div>
              <input
                type="checkbox"
                checked={options.includeNumberInPassphrase}
                onChange={e => updateOption('includeNumberInPassphrase', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">Append Special Symbol</span>
                <span className="text-[11px] text-slate-400">Embed symbol (!@#$%...)</span>
              </div>
              <input
                type="checkbox"
                checked={options.includeSymbolInPassphrase}
                onChange={e => updateOption('includeSymbolInPassphrase', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* MODE 3: PIN CODE */}
      {options.mode === 'pin' && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-200">
                PIN Digits Length
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {options.pinLength}
                </span>
                <span className="text-xs text-slate-400">digits</span>
              </div>
            </div>
            <input
              type="range"
              min={4}
              max={32}
              value={options.pinLength}
              onChange={e => updateOption('pinLength', parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Standard:</span>
              {[4, 6, 8, 12, 16].map(len => (
                <button
                  key={len}
                  onClick={() => updateOption('pinLength', len)}
                  className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums transition-colors ${
                    options.pinLength === len
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {len} {len === 4 ? '(ATM)' : len === 6 ? '(2FA)' : ''}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">Allow Consecutive Duplicate Digits</span>
              <span className="text-[11px] text-slate-400">Permit adjacent identical digits (e.g. 55)</span>
            </div>
            <input
              type="checkbox"
              checked={options.allowRepeatedDigits}
              onChange={e => updateOption('allowRepeatedDigits', e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
            />
          </label>
        </div>
      )}

      {/* MODE 4: PRONOUNCEABLE */}
      {options.mode === 'pronounceable' && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-200">
                Syllable Count
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {options.syllableCount}
                </span>
                <span className="text-xs text-slate-400">syllables</span>
              </div>
            </div>
            <input
              type="range"
              min={3}
              max={8}
              value={options.syllableCount}
              onChange={e => updateOption('syllableCount', parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Capitalize Syllables</span>
              <input
                type="checkbox"
                checked={options.capitalizeSyllables}
                onChange={e => updateOption('capitalizeSyllables', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Append Number</span>
              <input
                type="checkbox"
                checked={options.appendNumber}
                onChange={e => updateOption('appendNumber', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer">
              <span className="text-xs font-medium text-slate-200">Append Symbol</span>
              <input
                type="checkbox"
                checked={options.appendSymbol}
                onChange={e => updateOption('appendSymbol', e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Immediate Re-roll Trigger Button */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Apply & Generate New Password</span>
        </button>
      </div>
    </div>
  );
};
