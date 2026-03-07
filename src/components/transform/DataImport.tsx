import type { DataPreview } from '@/lib/types';
import { FileUp, Loader2 } from 'lucide-react';

interface DataImportProps {
  preview: DataPreview | null;
  loading: boolean;
  error: string | null;
  onSelectFile: () => void;
}

export function DataImport({ preview, loading, error, onSelectFile }: DataImportProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSelectFile}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          ファイルを選択
        </button>
        {preview && (
          <span className="text-sm text-muted-foreground">
            {preview.totalRows}行 / {preview.headers.length}列
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {preview && (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {preview.headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: data rows have no stable ID
                <tr key={i} className="border-b last:border-0">
                  {preview.headers.map((header) => (
                    <td key={`${i}-${header}`} className="px-3 py-1.5">
                      {String(row[header] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
