import React, { useState } from 'react';
import { GeneratorOptions } from '../types/crypto';
import { generatePassword } from '../utils/cryptoGenerator';
import { analyzePasswordStrength } from '../utils/strengthAnalyzer';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface BatchGeneratorTabProps {
  options: GeneratorOptions;
}

interface BatchItem {
  id: string;
  password: string;
  length: number;
  entropyBits: number;
  score: number;
  ratingLabel: string;
}

export const BatchGeneratorTab: React.FC<BatchGeneratorTabProps> = ({ options }) => {
  const [batchCount, setBatchCount] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Initial batch generator
  const createBatch = (count: number): BatchItem[] => {
    const items: BatchItem[] = [];
    for (let i = 0; i < count; i++) {
      const pwd = generatePassword(options);
      const analysis = analyzePasswordStrength(pwd);
      items.push({
        id: `${Date.now()}-${i}`,
        password: pwd,
        length: pwd.length,
        entropyBits: analysis.entropyBits,
        score: analysis.score,
        ratingLabel: analysis.ratingLabel,
      });
    }
    return items;
  };

  const [batch, setBatch] = useState<BatchItem[]>(() => createBatch(10));

  const handleRegenerateBatch = () => {
    setBatch(createBatch(batchCount));
  };

  const handleCopyOne = async (item: BatchItem) => {
    try {
      await navigator.clipboard.writeText(item.password);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleCopyAll = async () => {
    try {
      const allText = batch.map(b => b.password).join('\n');
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportTxt = () => {
    const content = batch.map(b => b.password).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherforge_batch_${batch.length}_passwords.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['Index', 'Password', 'Length', 'EntropyBits', 'Score', 'Rating'];
    const rows = batch.map((item, idx) => [
      idx + 1,
      `"${item.password.replace(/"/g, '""')}"`,
      item.length,
      item.entropyBits,
      item.score,
      `"${item.ratingLabel}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherforge_passwords_${batch.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBatch = batch.filter(item =>
    item.password.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Batch Header Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Batch Cryptographic Password Generator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate large sets of cryptographically independent passwords for fleet migrations, deployment tokens, or key rotations.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quantity selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[5, 10, 25, 50, 100].map(qty => (
                <button
                  key={qty}
                  onClick={() => {
                    setBatchCount(qty);
                    setBatch(createBatch(qty));
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    batchCount === qty
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>

            <button
              onClick={handleRegenerateBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
              <span>Regenerate Batch</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedAll ? 'All Copied' : 'Copy All'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              title="Download as CSV spreadsheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              title="Download as Plain Text file"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export TXT</span>
            </button>
          </div>
        </div>

        {/* Filter search bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter passwords in this batch..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Batch Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Generated Password</th>
                <th className="py-3 px-4 w-20 text-right">Length</th>
                <th className="py-3 px-4 w-28 text-right">Entropy</th>
                <th className="py-3 px-4 w-28 text-right">Score</th>
                <th className="py-3 px-4 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredBatch.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-4 text-center text-slate-500 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-100 select-all break-all">
                    {item.password}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums">
                    {item.length}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-400 font-medium tabular-nums">
                    {item.entropyBits} bits
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.score >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-teal-400 bg-teal-950/40'
                    }`}>
                      {item.score}/100
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => handleCopyOne(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy password"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBatch.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No passwords match filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
