import {
  CharacterItem,
  CrackTimeMetric,
  StrengthAnalysis,
  StrengthRating,
  VulnerabilityCheck
} from '../types/crypto';

// Common passwords & dictionary root stems
const COMMON_ROOTS = [
  'password', 'pass', 'admin', 'administrator', 'root', 'user', 'guest',
  'welcome', 'login', 'letmein', 'default', 'secret', 'qwerty', 'asdfgh',
  '123456', '12345678', 'iloveyou', 'dragon', 'football', 'baseball',
  'monkey', 'master', 'shadow', 'superman', 'batman', 'starwars', 'matrix',
  'trustno1', 'hunter2', 'sunshine', 'princess', 'michael', 'jessica',
  'charlie', 'computer', 'server', 'access', 'freedom', 'security', 'system',
  'winter', 'summer', 'autumn', 'spring', 'coffee', 'orange', 'testing'
];

const KEYBOARD_SEQUENCES = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', '0987654321',
  'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz'
];

const AMBIGUOUS_CHARS = new Set(['i', 'l', '1', 'I', 'o', '0', 'O', '`', '|', ';', ':']);

/**
 * Format duration in seconds into human-readable text.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0.1) return 'Instant (< 0.1s)';
  if (seconds < 1) return '< 1 second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours`;
  
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} days`;
  
  const months = days / 30.44;
  if (months < 12) return `${Math.round(months)} months`;
  
  const years = days / 365.25;
  if (years < 100) return `${Math.round(years)} years`;
  if (years < 1000) return `${Math.round(years / 10) * 10} years`;
  if (years < 1_000_000) return `${(years / 1_000).toFixed(1)} thousand years`;
  if (years < 1_000_000_000) return `${(years / 1_000_000).toFixed(1)} million years`;
  if (years < 1_000_000_000_000) return `${(years / 1_000_000_000).toFixed(1)} billion years`;
  if (years < 14_000_000_000) return `${(years / 1_000_000_000).toFixed(0)} billion years`;
  
  return 'Universe lifetime+ (> 13.8B yrs)';
}

/**
 * Perform deep cryptographic entropy and vulnerability analysis.
 */
export function analyzePasswordStrength(password: string): StrengthAnalysis {
  if (!password || password.length === 0) {
    return getEmptyAnalysis();
  }

  const length = password.length;
  let upper = 0;
  let lower = 0;
  let numbers = 0;
  let symbols = 0;
  let other = 0;

  const charFreq: Record<string, number> = {};
  const breakdown: CharacterItem[] = [];

  for (let i = 0; i < length; i++) {
    const char = password[i];
    charFreq[char] = (charFreq[char] || 0) + 1;

    let type: CharacterItem['type'] = 'extended';
    if (/[A-Z]/.test(char)) {
      upper++;
      type = 'upper';
    } else if (/[a-z]/.test(char)) {
      lower++;
      type = 'lower';
    } else if (/[0-9]/.test(char)) {
      numbers++;
      type = 'number';
    } else if (/[!@#$%^&*()_\-+=\[\]{}|;:,.<>?/~`]/.test(char)) {
      symbols++;
      type = 'symbol';
    } else if (/\s/.test(char)) {
      type = 'space';
      symbols++;
    } else {
      other++;
    }

    breakdown.push({
      char,
      type,
      isAmbiguous: AMBIGUOUS_CHARS.has(char)
    });
  }

  // Calculate base pool size based on character classes present
  let poolSize = 0;
  if (lower > 0) poolSize += 26;
  if (upper > 0) poolSize += 26;
  if (numbers > 0) poolSize += 10;
  if (symbols > 0) poolSize += 33;
  if (other > 0) poolSize += 30;

  poolSize = Math.max(poolSize, Object.keys(charFreq).length);

  // Shannon entropy: H = - sum(p * log2(p))
  let shannonEntropy = 0;
  for (const char in charFreq) {
    const p = charFreq[char] / length;
    shannonEntropy -= p * Math.log2(p);
  }
  const totalShannonBits = Math.round(shannonEntropy * length * 10) / 10;

  // Keyspace entropy: L * log2(poolSize)
  let rawKeyspaceBits = poolSize > 1 ? length * Math.log2(poolSize) : 0;

  // Pattern Penalties & Deductions
  let penaltyBits = 0;
  const vulnerabilities: VulnerabilityCheck[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check 1: Length criteria (NIST SP 800-63B recommendation)
  if (length < 8) {
    penaltyBits += 25;
    vulnerabilities.push({
      id: 'crit-len',
      label: 'Critically Short (< 8 chars)',
      passed: false,
      severity: 'danger',
      detail: 'Passwords under 8 characters can be instantly brute-forced in seconds on commodity hardware.'
    });
    warnings.push('Length is under 8 characters. Vulnerable to near-instantaneous offline cracking.');
  } else if (length < 12) {
    penaltyBits += 10;
    vulnerabilities.push({
      id: 'warn-len',
      label: 'Below Modern Minimum (8-11 chars)',
      passed: false,
      severity: 'warning',
      detail: 'Modern enterprise policy mandates at least 12-16 characters to protect against GPU clusters.'
    });
    suggestions.push('Increase length to 16+ characters to resist modern GPU cluster attacks.');
  } else {
    vulnerabilities.push({
      id: 'pass-len',
      label: 'Sufficient Length (12+ characters)',
      passed: true,
      severity: 'info',
      detail: `${length} characters provide an expansive search space for resistance against brute force.`
    });
  }

  // Check 2: Sequential runs (e.g. 1234, abcd)
  const lowerStr = password.toLowerCase();
  let hasSequential = false;
  for (let i = 0; i < length - 2; i++) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
      hasSequential = true;
      break;
    }
  }

  if (hasSequential) {
    penaltyBits += 12;
    vulnerabilities.push({
      id: 'seq-chars',
      label: 'Sequential Character Run Detected',
      passed: false,
      severity: 'warning',
      detail: 'Sequential runs (like "123" or "abc") drastically reduce entropy as attackers prioritize sequence masks.'
    });
    warnings.push('Sequential characters detected (e.g. 123, abc). Attackers test these early.');
  } else {
    vulnerabilities.push({
      id: 'no-seq-chars',
      label: 'No Sequential Alphabetic or Numeric Runs',
      passed: true,
      severity: 'info',
      detail: 'Character progression does not follow predictable increment patterns.'
    });
  }

  // Check 3: Keyboard walks (qwerty, asdf)
  let hasKeyboardWalk = false;
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.substring(i, i + 4);
      if (lowerStr.includes(sub)) {
        hasKeyboardWalk = true;
        break;
      }
    }
    if (hasKeyboardWalk) break;
  }

  if (hasKeyboardWalk) {
    penaltyBits += 14;
    vulnerabilities.push({
      id: 'kb-walk',
      label: 'Keyboard Walk Pattern Detected',
      passed: false,
      severity: 'warning',
      detail: 'Keyboard patterns (e.g., qwerty, asdf) are among the first rules evaluated in Hashcat dictionaries.'
    });
    warnings.push('Physical keyboard sequence detected. Attack dictionaries prioritize these patterns.');
  }

  // Check 4: Repeated characters (e.g. "aaa", "111")
  let hasRepetition = false;
  for (let i = 0; i < length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      hasRepetition = true;
      break;
    }
  }

  if (hasRepetition) {
    penaltyBits += 10;
    vulnerabilities.push({
      id: 'char-rep',
      label: 'Repeated Identical Characters',
      passed: false,
      severity: 'warning',
      detail: 'Repeating the same character consecutively offers zero incremental entropy.'
    });
    suggestions.push('Avoid repeating identical characters consecutively (e.g., "aaa").');
  }

  // Check 5: Common dictionary root words & leetspeak
  // Normalize leetspeak: @->a, 0->o, 1->i, 3->e, $->s, 5->s, 7->t, !->i
  const deLeeted = lowerStr
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/!/g, 'i');

  let foundRoot: string | null = null;
  for (const root of COMMON_ROOTS) {
    if (deLeeted.includes(root)) {
      foundRoot = root;
      break;
    }
  }

  if (foundRoot) {
    penaltyBits += 20;
    vulnerabilities.push({
      id: 'dict-word',
      label: `Common Root Word Found ("${foundRoot}")`,
      passed: false,
      severity: 'danger',
      detail: `Contains known dictionary pattern "${foundRoot}" or its leetspeak variant. Modern cracking tools use hybrid mask attacks.`
    });
    warnings.push(`Contains dictionary root "${foundRoot}". Highly susceptible to targeted rule-based cracking.`);
  } else {
    vulnerabilities.push({
      id: 'no-dict-word',
      label: 'No Common Leaked Stems Found',
      passed: true,
      severity: 'info',
      detail: 'Does not match high-frequency credential leak lists or basic dictionary stems.'
    });
  }

  // Check 6: Character set diversity
  const categoriesCount = [upper > 0, lower > 0, numbers > 0, symbols > 0].filter(Boolean).length;
  if (categoriesCount >= 4) {
    vulnerabilities.push({
      id: 'diverse-pool',
      label: 'Max Charset Diversity (Upper, Lower, Number, Symbol)',
      passed: true,
      severity: 'info',
      detail: 'Forces attackers to expand brute-force keyspace across the full 95 ASCII printable range.'
    });
  } else {
    vulnerabilities.push({
      id: 'low-diversity',
      label: `Partial Diversity (${categoriesCount} of 4 character classes)`,
      passed: false,
      severity: 'warning',
      detail: 'Missing one or more character classes (uppercase, lowercase, numbers, or symbols).'
    });
    if (symbols === 0) suggestions.push('Incorporate special symbols (!@#$%^&*) to expand search space.');
    if (numbers === 0) suggestions.push('Add numeric digits to prevent alphabetic dictionary pruning.');
    if (upper === 0) suggestions.push('Include uppercase characters to double case permutation complexity.');
  }

  // Calculate final effective entropy (clamped)
  const effectiveEntropyBits = Math.max(2, Math.round((rawKeyspaceBits - penaltyBits) * 10) / 10);

  // Score from 0 to 100 based on effective entropy and length
  let score = 0;
  if (effectiveEntropyBits < 28) {
    score = Math.min(25, Math.round((effectiveEntropyBits / 28) * 25));
  } else if (effectiveEntropyBits < 45) {
    score = 25 + Math.round(((effectiveEntropyBits - 28) / (45 - 28)) * 25);
  } else if (effectiveEntropyBits < 70) {
    score = 50 + Math.round(((effectiveEntropyBits - 45) / (70 - 45)) * 25);
  } else if (effectiveEntropyBits < 100) {
    score = 75 + Math.round(((effectiveEntropyBits - 70) / (100 - 70)) * 20);
  } else {
    score = Math.min(100, 95 + Math.round(((effectiveEntropyBits - 100) / 30) * 5));
  }

  // Extra guardrail: if length < 8, score cannot exceed 30
  if (length < 8) score = Math.min(score, 30);
  if (foundRoot && length < 14) score = Math.min(score, 45);

  let rating: StrengthRating = 'fair';
  let ratingLabel = 'Fair';
  if (score < 25) {
    rating = 'critical';
    ratingLabel = 'Critical (Very Weak)';
  } else if (score < 50) {
    rating = 'weak';
    ratingLabel = 'Weak';
  } else if (score < 75) {
    rating = 'fair';
    ratingLabel = 'Moderate';
  } else if (score < 90) {
    rating = 'strong';
    ratingLabel = 'Strong';
  } else {
    rating = 'optimal';
    ratingLabel = 'Military-Grade (Optimal)';
  }

  // Add positive reinforcement suggestions if high score
  if (score >= 90) {
    suggestions.push('Excellent entropy. Resistant to offline GPU cluster and distributed botnet attacks.');
  }

  // Calculate Crack Times across 5 distinct threat models
  // Effective guess space: 2^(effectiveEntropyBits)
  // Average attempts to crack = 2^(effectiveEntropyBits) / 2
  const log2Guesses = Math.max(1, effectiveEntropyBits - 1);

  // Rates in guesses per second:
  // 1. Online throttled (e.g. web portal 10 attempts/min) = 0.1666 guesses/sec
  // 2. Online unthrottled (direct API brute force) = 1,000 guesses/sec (2^10)
  // 3. Offline slow hash (bcrypt cost 10 / argon2id on GPU cluster) = 10,000 guesses/sec (~2^13.3)
  // 4. Offline fast hash (MD5 / NTLM / SHA256 8x RTX 4090 rig) = 100,000,000,000 guesses/sec (10^11 ~ 2^36.5)
  // 5. High-end Supercomputer / State Actor botnet = 100,000,000,000,000 guesses/sec (10^14 ~ 2^46.5)
  const crackTimes = {
    onlineThrottled: calculateThreatCrackTime(
      'Online Throttled',
      'Web Login with Rate-Limiting',
      '10 attempts / min',
      log2Guesses,
      0.16666,
      'Web service enforcing CAPTCHA or standard 5-attempt timeout.'
    ),
    onlineUnthrottled: calculateThreatCrackTime(
      'Online Unthrottled',
      'Exposed API / Unprotected Auth',
      '1,000 guesses / sec',
      log2Guesses,
      1_000,
      'Exposed REST endpoint without rate limiting or IP banning.'
    ),
    offlineSlowHash: calculateThreatCrackTime(
      'Offline Slow Hash',
      'bcrypt / PBKDF2 / Argon2id',
      '10,000 hashes / sec',
      log2Guesses,
      10_000,
      'Leaked database protected by modern memory-hard password hashing.'
    ),
    offlineFastHash: calculateThreatCrackTime(
      'Offline Fast Hash',
      'MD5 / NTLM / SHA256 GPU Rig',
      '100 Billion / sec',
      log2Guesses,
      100_000_000_000,
      'Modern 8x RTX 4090 Hashcat rig attacking fast unsalted/salted hashes.'
    ),
    supercomputer: calculateThreatCrackTime(
      'State-Level Cluster',
      'Massive Supercomputer / Distributed Rig',
      '100 Trillion / sec',
      log2Guesses,
      100_000_000_000_000,
      'Nation-state supercomputer or distributed million-node botnet.'
    ),
  };

  return {
    score,
    rating,
    ratingLabel,
    entropyBits: effectiveEntropyBits,
    charsetSize: poolSize,
    crackTimes,
    breakdown,
    charCounts: {
      total: length,
      upper,
      lower,
      numbers,
      symbols,
      other
    },
    vulnerabilities,
    feedback: {
      warnings,
      suggestions
    }
  };
}

function calculateThreatCrackTime(
  title: string,
  hardware: string,
  hashRateStr: string,
  log2Guesses: number,
  ratePerSecond: number,
  description: string
): CrackTimeMetric {
  const log2Rate = Math.log2(ratePerSecond);
  const log2Seconds = log2Guesses - log2Rate;

  let seconds: number;
  if (log2Seconds > 1024) {
    seconds = Number.MAX_VALUE;
  } else if (log2Seconds < -20) {
    seconds = 0.000001;
  } else {
    seconds = Math.pow(2, log2Seconds);
  }

  let riskLevel: CrackTimeMetric['riskLevel'] = 'negligible';
  if (seconds < 60) {
    riskLevel = 'immediate';
  } else if (seconds < 86400) { // < 1 day
    riskLevel = 'high';
  } else if (seconds < 31536000 * 3) { // < 3 years
    riskLevel = 'medium';
  } else if (seconds < 31536000 * 100) { // < 100 years
    riskLevel = 'low';
  } else {
    riskLevel = 'negligible';
  }

  return {
    title,
    hardware,
    hashRateStr,
    timeFormatted: formatDuration(seconds),
    seconds,
    riskLevel,
    description
  };
}

function getEmptyAnalysis(): StrengthAnalysis {
  const emptyMetric: CrackTimeMetric = {
    title: 'N/A',
    hardware: 'N/A',
    hashRateStr: '0 / sec',
    timeFormatted: 'Instant',
    seconds: 0,
    riskLevel: 'immediate',
    description: 'Empty password string.'
  };

  return {
    score: 0,
    rating: 'critical',
    ratingLabel: 'Critical (Empty)',
    entropyBits: 0,
    charsetSize: 0,
    crackTimes: {
      onlineThrottled: { ...emptyMetric, title: 'Online Throttled' },
      onlineUnthrottled: { ...emptyMetric, title: 'Online Unthrottled' },
      offlineSlowHash: { ...emptyMetric, title: 'Offline Slow Hash' },
      offlineFastHash: { ...emptyMetric, title: 'Offline Fast Hash' },
      supercomputer: { ...emptyMetric, title: 'State-Level Cluster' }
    },
    breakdown: [],
    charCounts: {
      total: 0,
      upper: 0,
      lower: 0,
      numbers: 0,
      symbols: 0,
      other: 0
    },
    vulnerabilities: [],
    feedback: {
      warnings: ['No password provided.'],
      suggestions: ['Generate or type a password to evaluate strength and entropy.']
    }
  };
}
