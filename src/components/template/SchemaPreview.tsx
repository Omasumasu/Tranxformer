import { Check, X } from 'lucide-react';
import type { DataType, InferredColumn } from '../../lib/types';

interface SchemaPreviewProps {
  columns: InferredColumn[];
  onConfirm: () => void;
  onCancel: () => void;
  onTypeChange: (index: number, dataType: DataType) => void;
}

const DATA_TYPES: DataType[] = ['Text', 'Number', 'Date', 'Boolean'];

export function SchemaPreview({ columns, onConfirm, onCancel, onTypeChange }: SchemaPreviewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">スキーマプレビュー</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            <X className="h-4 w-4" />
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            この内容で作成
          </button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">ラベル</th>
              <th className="px-4 py-2 text-left font-medium">フィールド名</th>
              <th className="px-4 py-2 text-left font-medium">推論された型</th>
              <th className="px-4 py-2 text-left font-medium">サンプル値</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr key={col.name} className="border-b last:border-b-0">
                <td className="px-4 py-2 font-medium">{col.label}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{col.name}</td>
                <td className="px-4 py-2">
                  <select
                    value={col.dataType}
                    onChange={(e) => onTypeChange(i, e.target.value as DataType)}
                    className="rounded border bg-background px-2 py-1 text-sm"
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {col.sampleValues.slice(0, 3).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
