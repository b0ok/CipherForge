import { GeneratorOptions } from '../types/crypto';
import { DICEWARE_WORDLIST } from './dicewareList';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const EXTENDED_CHARS = '~`±§°µ¿¡«»×÷';

// Visually ambiguous characters often confused on screens/print
const AMBIGUOUS_CHARS = new Set(['i', 'l', '1', 'I', 'o', '0', 'O', '`', '|', ';', ':']);

const CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'ch', 'sh', 'th', 'ph', 'qu'];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'ee', 'oa', 'oo', 'ou'];

/**
 * Cryptographically secure integer generator in range [0, max - 1].
 * Uses rejection sampling to completely eliminate modulo bias.
 */
export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (max === 1) return 0;

  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const buffer = new Uint32Array(1);

  let randomVal: number;
  do {
    window.crypto.getRandomValues(buffer);
    randomVal = buffer[0];
  } while (randomVal >= limit);

  return randomVal % max;
}

/**
 * Cryptographically secure array element picker.
 */
export function securePick<T>(array: T[]): T {
  const index = secureRandomInt(array.length);
  return array[index];
}

/**
 * Fisher-Yates CSPRNG shuffle.
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Filter charset based on ambiguity settings.
 */
function filterCharset(charset: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) return charset;
  return charset
    .split('')
    .filter(char => !AMBIGUOUS_CHARS.has(char))
    .join('');
}

/**
 * Generate a cryptographically secure random password.
 */
export function generatePassword(options: GeneratorOptions): string {
  switch (options.mode) {
    case 'passphrase':
      return generatePassphrase(options);
    case 'pin':
      return generatePin(options);
    case 'pronounceable':
      return generatePronounceable(options);
    case 'random':
    default:
      return generateRandomPassword(options);
  }
}

/**
 * Generates custom random characters according to options.
 */
function generateRandomPassword(options: GeneratorOptions): string {
  let charPool = '';
  const requiredCategories: string[] = [];

  const upper = filterCharset(UPPERCASE_CHARS, options.excludeAmbiguous);
  const lower = filterCharset(LOWERCASE_CHARS, options.excludeAmbiguous);
  const numbers = filterCharset(NUMBER_CHARS, options.excludeAmbiguous);
  const symbols = filterCharset(SYMBOL_CHARS, options.excludeAmbiguous);
  const extended = filterCharset(EXTENDED_CHARS, options.excludeAmbiguous);

  if (options.includeUppercase && upper.length > 0) {
    charPool += upper;
    requiredCategories.push(upper);
  }
  if (options.includeLowercase && lower.length > 0) {
    charPool += lower;
    requiredCategories.push(lower);
  }
  if (options.includeNumbers && numbers.length > 0) {
    charPool += numbers;
    requiredCategories.push(numbers);
  }
  if (options.includeSymbols && symbols.length > 0) {
    charPool += symbols;
    requiredCategories.push(symbols);
  }
  if (options.includeExtended && extended.length > 0) {
    charPool += extended;
    requiredCategories.push(extended);
  }

  // Fallback to lowercase + numbers if nothing selected
  if (charPool.length === 0) {
    charPool = lower + numbers;
    requiredCategories.push(lower);
    requiredCategories.push(numbers);
  }

  const length = Math.max(4, Math.min(128, options.length));
  const characters: string[] = [];

  // Guarantee at least one character from each selected category
  for (const cat of requiredCategories) {
    if (characters.length < length) {
      characters.push(cat[secureRandomInt(cat.length)]);
    }
  }

  // Fill remaining length
  while (characters.length < length) {
    const nextChar = charPool[secureRandomInt(charPool.length)];
    if (options.avoidRepeats && characters.length > 0 && characters[characters.length - 1] === nextChar) {
      continue;
    }
    characters.push(nextChar);
  }

  // Shuffle thoroughly using Fisher-Yates
  return secureShuffle(characters).join('');
}

/**
 * Generates a Diceware memorable passphrase.
 */
function generatePassphrase(options: GeneratorOptions): string {
  const count = Math.max(3, Math.min(12, options.wordCount));
  const chosenWords: string[] = [];

  for (let i = 0; i < count; i++) {
    const word = securePick(DICEWARE_WORDLIST);
    let formatted = word;

    switch (options.capitalizeMode) {
      case 'title':
        formatted = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        break;
      case 'upper':
        formatted = word.toUpperCase();
        break;
      case 'random':
        formatted = secureRandomInt(2) === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() 
          : word.toLowerCase();
        break;
      case 'none':
      default:
        formatted = word.toLowerCase();
        break;
    }

    chosenWords.push(formatted);
  }

  // Optional insertion of numbers / symbols for NIST compliance
  if (options.includeNumberInPassphrase) {
    const num = secureRandomInt(90) + 10; // 2-digit number 10-99
    const pos = secureRandomInt(chosenWords.length);
    chosenWords[pos] += `${num}`;
  }

  if (options.includeSymbolInPassphrase) {
    const symbol = securePick(['!', '@', '#', '$', '%', '&', '*', '?']);
    const pos = secureRandomInt(chosenWords.length);
    chosenWords[pos] += symbol;
  }

  return chosenWords.join(options.delimiter);
}

/**
 * Generates a numerical PIN code.
 */
function generatePin(options: GeneratorOptions): string {
  const length = Math.max(4, Math.min(32, options.pinLength));
  const digits: string[] = [];

  let attempts = 0;
  while (digits.length < length && attempts < 1000) {
    attempts++;
    const nextDigit = `${secureRandomInt(10)}`;
    if (!options.allowRepeatedDigits && digits.length > 0 && digits[digits.length - 1] === nextDigit) {
      continue;
    }
    digits.push(nextDigit);
  }

  return digits.join('');
}

/**
 * Generates pronounceable syllabic passwords.
 */
function generatePronounceable(options: GeneratorOptions): string {
  const syllables = Math.max(3, Math.min(10, options.syllableCount));
  const parts: string[] = [];

  for (let i = 0; i < syllables; i++) {
    const cons = securePick(CONSONANTS);
    const vow = securePick(VOWELS);
    let syl = cons + vow;

    if (options.capitalizeSyllables) {
      syl = syl.charAt(0).toUpperCase() + syl.slice(1);
    }
    parts.push(syl);
  }

  let result = parts.join('');

  if (options.appendNumber) {
    result += `${secureRandomInt(900) + 100}`;
  }
  if (options.appendSymbol) {
    result += securePick(['!', '#', '$', '%', '*', '+']);
  }

  return result;
}
