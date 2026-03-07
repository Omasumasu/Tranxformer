import { open } from '@tauri-apps/plugin-dialog';
import { FileUp } from 'lucide-react';
import { useState } from 'react';
import { useDataIO } from '../../hooks/useTauri';
import type { DataPreview } from '../../lib/types';

interface DataImportProps {
  onImported: (preview: DataPreview, filePath: string) => void;
}

export function DataImport({ onImported }: DataImportProps) {
  const { preview, loading, readPreview } = useDataIO();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Data Files',
          extensions: ['csv', 'tsv', 'txt', 'xlsx', 'xls'],
        },
      ],
    });
    if (!selected) return;

    setError(null);
    try {
      const data = await readPreview(selected);
      setFilePath(selected);
      if (data) {
        onImported(data, selected);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleSelectFile}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
      >
        <FileUp className="h-5 w-5" />
        {loading ? '読み込み中...' : 'ファイルを選択（CSV / Excel）'}
      </button>

      {filePath && <p className="text-xs text-muted-foreground">ファイル: {filePath}</p>}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {preview && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            プレビュー（{preview.rows.length} / {preview.totalRows}行）
          </p>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {preview.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={`row-${i.toString()}`} className="border-b last:border-0">
                    {preview.headers.map((h) => (
                      <td key={h} className="whitespace-nowrap px-3 py-1.5">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
