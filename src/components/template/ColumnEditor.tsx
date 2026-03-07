import { Trash2 } from 'lucide-react';
import type { Column, DataType } from '../../lib/types';

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'Text', label: '文字列' },
  { value: 'Number', label: '数値' },
  { value: 'Date', label: '日付' },
  { value: 'Boolean', label: '真偽値' },
];

interface ColumnEditorProps {
  column: Column;
  index: number;
  onChange: (index: number, column: Column) => void;
  onRemove: (index: number) => void;
}

export function ColumnEditor({ column, index, onChange, onRemove }: ColumnEditorProps) {
  const update = (field: keyof Column, value: string) => {
    onChange(index, { ...column, [field]: value });
  };

  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="grid flex-1 grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="カラム名 (snake_case)"
          value={column.name}
          onChange={(e) => update('name', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          placeholder="ラベル"
          value={column.label}
          onChange={(e) => update('label', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={column.dataType}
          onChange={(e) => update('dataType', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {DATA_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="説明（LLMへのヒント）"
          value={column.description}
          onChange={(e) => update('description', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`カラム${index + 1}を削除`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
