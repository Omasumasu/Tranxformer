import { Download } from 'lucide-react';

interface ResultViewProps {
  data: Record<string, unknown>[];
  onExport: (format: 'Csv' | 'Tsv' | 'Excel') => void;
  onReset: () => void;
}

export function ResultView({ data, onExport, onReset }: ResultViewProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        変換結果がありません
      </div>
    );
  }

  const first = data[0];
  const headers = first ? Object.keys(first) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">変換結果 ({data.length} 行)</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onExport('Csv')}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => onExport('Tsv')}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            TSV
          </button>
          <button
            type="button"
            onClick={() => onExport('Excel')}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            最初から
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: result rows have no unique ID
              <tr key={`result-${i}`} className="border-b last:border-0">
                {headers.map((h) => (
                  <td key={`${i}-${h}`} className="px-3 py-1.5 text-muted-foreground">
                    {String(row[h] ?? '')}
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
