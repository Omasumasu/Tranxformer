import { FileUp, Loader2 } from 'lucide-react';
import type { DataPreview } from '../../lib/types';

interface DataImportProps {
  preview: DataPreview | null;
  filePath: string | null;
  sheets: string[];
  selectedSheet: string | null;
  loading: boolean;
  error: string | null;
  onSelectFile: () => void;
  onSelectSheet: (sheet: string) => void;
  onNext: () => void;
}

export function DataImport({
  preview,
  filePath,
  sheets,
  selectedSheet,
  loading,
  error,
  onSelectFile,
  onSelectSheet,
  onNext,
}: DataImportProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">データ読み込み</h2>
        {preview && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            次へ
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onSelectFile}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground hover:border-primary hover:text-primary"
      >
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
        <span>{loading ? '読み込み中...' : 'ファイルを選択 (CSV / Excel)'}</span>
      </button>

      {filePath && <p className="text-xs text-muted-foreground">ファイル: {filePath}</p>}

      {sheets.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="sheet-select" className="text-sm font-medium">
            シート:
          </label>
          <select
            id="sheet-select"
            value={selectedSheet ?? ''}
            onChange={(e) => onSelectSheet(e.target.value)}
            disabled={loading}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            {sheets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {preview && <PreviewTable preview={preview} />}
    </div>
  );
}

function PreviewTable({ preview }: { preview: DataPreview }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        全 {preview.totalRows} 行（プレビュー: {preview.rows.length} 行）
      </p>
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {preview.headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: preview rows have no unique ID
              <tr key={`row-${i}`} className="border-b last:border-0">
                {preview.headers.map((h) => (
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
