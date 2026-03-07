import { save } from '@tauri-apps/plugin-dialog';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useDataIO } from '../../hooks/useTauri';
import type { ExportFormat, TransformResult } from '../../lib/types';

interface ResultViewProps {
  result: TransformResult;
}

export function ResultView({ result }: ResultViewProps) {
  const { exportResult } = useDataIO();
  const [exporting, setExporting] = useState(false);

  const firstRow = result.output[0];
  const headers = firstRow ? Object.keys(firstRow) : [];

  const handleExport = async (format: ExportFormat) => {
    const extensions: Record<ExportFormat, string[]> = {
      Csv: ['csv'],
      Tsv: ['tsv'],
      Xlsx: ['xlsx'],
    };

    const path = await save({
      filters: [{ name: format, extensions: extensions[format] }],
    });
    if (!path) return;

    setExporting(true);
    try {
      await exportResult(headers, result.output, path, format);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{result.rowCount}行の変換結果</p>
        <div className="flex gap-2">
          {(['Csv', 'Xlsx'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleExport(fmt)}
              disabled={exporting}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {fmt === 'Csv' ? 'CSV' : 'Excel'}
            </button>
          ))}
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {result.errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.output.slice(0, 50).map((row, i) => (
              <tr key={`row-${i.toString()}`} className="border-b last:border-0">
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-3 py-1.5">
                    {String(row[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.output.length > 50 && (
        <p className="text-center text-xs text-muted-foreground">
          先頭50行を表示中（全{result.output.length}行）
        </p>
      )}
    </div>
  );
}
