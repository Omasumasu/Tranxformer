import type { TransformResult } from '@/lib/types';
import { Download } from 'lucide-react';

interface ResultViewProps {
  result: TransformResult | null;
  onExport: (format: 'Csv' | 'Tsv' | 'Excel') => void;
}

export function ResultView({ result, onExport }: ResultViewProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        変換結果がありません。コードを実行してください。
      </div>
    );
  }

  const firstRow = result.output[0];
  const headers = firstRow ? Object.keys(firstRow) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{result.rowCount}行の変換結果</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExport('Csv')}
            className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => onExport('Excel')}
            className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
          >
            <Download className="h-3 w-3" />
            Excel
          </button>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <ul className="list-inside list-disc">
            {result.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.output.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: data rows have no stable ID
              <tr key={i} className="border-b last:border-0">
                {headers.map((header) => (
                  <td key={`${i}-${header}`} className="px-3 py-1.5">
                    {String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
