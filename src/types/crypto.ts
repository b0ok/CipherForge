export type GeneratorMode = 'random' | 'passphrase' | 'pin' | 'pronounceable';

export type StrengthRating = 'critical' | 'weak' | 'fair' | 'strong' | 'optimal';

export interface GeneratorOptions {
  mode: GeneratorMode;
  length: number;
  // Character set options for 'random'
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  includeExtended: boolean;
  excludeAmbiguous: boolean; // e.g. 0, O, o, 1, l, I
  avoidRepeats: boolean; // Avoid sequential identical characters
  
  // Passphrase options
  wordCount: number;
  delimiter: string;
  capitalizeMode: 'none' | 'title' | 'upper' | 'random';
  includeNumberInPassphrase: boolean;
  includeSymbolInPassphrase: boolean;
  
  // PIN options
  pinLength: number;
  allowRepeatedDigits: boolean;
  
  // Pronounceable options
  syllableCount: number;
  capitalizeSyllables: boolean;
  appendNumber: boolean;
  appendSymbol: boolean;
}

export interface CrackTimeMetric {
  title: string;
  hardware: string;
  hashRateStr: string;
  timeFormatted: string;
  seconds: number;
  riskLevel: 'immediate' | 'high' | 'medium' | 'low' | 'negligible';
  description: string;
}

export interface VulnerabilityCheck {
  id: string;
  label: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'danger';
  detail: string;
}

export interface CharacterItem {
  char: string;
  type: 'upper' | 'lower' | 'number' | 'symbol' | 'space' | 'extended';
  isAmbiguous: boolean;
}

export interface StrengthAnalysis {
  score: number; // 0 to 100
  rating: StrengthRating;
  ratingLabel: string;
  entropyBits: number;
  charsetSize: number;
  crackTimes: {
    onlineThrottled: CrackTimeMetric;
    onlineUnthrottled: CrackTimeMetric;
    offlineSlowHash: CrackTimeMetric;
    offlineFastHash: CrackTimeMetric;
    supercomputer: CrackTimeMetric;
  };
  breakdown: CharacterItem[];
  charCounts: {
    total: number;
    upper: number;
    lower: number;
    numbers: number;
    symbols: number;
    other: number;
  };
  vulnerabilities: VulnerabilityCheck[];
  feedback: {
    warnings: string[];
    suggestions: string[];
  };
}

export interface HistoryItem {
  id: string;
  password: string;
  mode: GeneratorMode;
  createdAt: number;
  entropyBits: number;
  score: number;
  ratingLabel: string;
}
