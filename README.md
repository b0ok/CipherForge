# CipherForge

A password generator, strength checker and encrypted vault that runs entirely in your browser.

## Features

- **Password generator:** random passwords, memorable Diceware passphrases, PINs and pronounceable passwords, using the browser's secure random number generator (`crypto.getRandomValues`). Batch mode generates many at once.
- **Strength checker:** entropy and keyspace math, common-pattern detection, and estimated crack times under different attack scenarios.
- **Breach check:** tells you if a password has appeared in a known data breach, via Have I Been Pwned. Only the first 5 characters of the password's SHA-1 hash leave your device (the k-anonymity method), never the password itself.
- **Encrypted vault:** save logins behind a master password. Each item is encrypted with AES-256-GCM, using a key derived with PBKDF2-SHA-256 at 600,000 iterations (the current OWASP recommendation). The vault is stored encrypted in your browser.
- **2FA codes:** a built-in authenticator that generates 6-digit codes (RFC 6238 TOTP).
- **Clipboard safety:** copied passwords are cleared from the clipboard after 30 seconds by default.

## How it works

Everything happens client-side with the browser's Web Crypto API. There is no server and no account, and your master password is never stored or sent anywhere. The only network call is the breach check to `api.pwnedpasswords.com`, which receives a 5-character hash prefix.

The crypto lives in [`src/utils/bitwardenCrypto.ts`](src/utils/bitwardenCrypto.ts) (key derivation, encryption, breach check, TOTP) and [`src/utils/cryptoGenerator.ts`](src/utils/cryptoGenerator.ts) (generation).

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. No API keys are needed.

## Tech

React 19, TypeScript, Vite, Tailwind CSS, Motion, lucide icons, and the Web Crypto API.

## A note on security

This is a personal project and hasn't had a professional security audit. It's a good way to see how a zero-knowledge vault works, but keep your real passwords in an established, audited password manager.

---

Built by Terry "T3" Nguyen · [t3rrynguy3n.netlify.app](https://t3rrynguy3n.netlify.app)
