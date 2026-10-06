import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, ShieldCheck, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  password,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && password) {
      QRCode.toCanvas(canvasRef.current, password, {
        width: 250,
        margin: 2,
        color: {
          dark: '#020617', // slate-950
          light: '#f8fafc', // slate-50
        },
        errorCorrectionLevel: 'M',
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }
  }, [isOpen, password]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Air-Gapped Mobile Transfer
            </h3>
            <p className="text-xs text-slate-400">
              Scan with your phone's camera to import directly.
            </p>
          </div>
        </div>

        {/* QR Canvas */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-950 p-6 border border-slate-800/80 my-4">
          <div className="overflow-hidden rounded-lg bg-white p-2.5 shadow-md">
            <canvas ref={canvasRef} className="block" />
          </div>
          <div className="mt-3 text-center">
            <p className="font-mono text-xs text-slate-300 break-all select-all px-4 py-1.5 bg-slate-900 rounded border border-slate-800/60 max-w-xs mx-auto">
              {password}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="flex items-start gap-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 p-3 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>
            Zero network transit. The QR code is rendered directly in memory on your GPU canvas. No data leaves your machine.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Plaintext'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
