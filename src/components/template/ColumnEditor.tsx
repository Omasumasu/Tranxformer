import { DATA_TYPE_OPTIONS } from '@/lib/template-helpers';
import type { Column } from '@/lib/types';
import { Trash2 } from 'lucide-react';

interface ColumnEditorProps {
  column: Column;
  index: number;
  onChange: (index: number, column: Column) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ColumnEditor({ column, index, onChange, onRemove, canRemove }: ColumnEditorProps) {
  const update = (field: keyof Column, value: string) => {
    onChange(index, { ...column, [field]: value });
  };

  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
        <input
          type="text"
          placeholder="カラム名 (snake_case)"
          value={column.name}
          onChange={(e) => update('name', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          placeholder="表示ラベル"
          value={column.label}
          onChange={(e) => update('label', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={column.dataType}
          onChange={(e) => update('dataType', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {DATA_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
        disabled={!canRemove}
        className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
