import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { Column, DataType } from '../../lib/types';

interface ColumnEditorProps {
  column: Column;
  index: number;
  onChange: (index: number, column: Column) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'Text', label: 'テキスト' },
  { value: 'Number', label: '数値' },
  { value: 'Date', label: '日付' },
  { value: 'Boolean', label: '真偽値' },
];

export function ColumnEditor({
  column,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
  canMoveUp,
  canMoveDown,
}: ColumnEditorProps) {
  const update = (field: keyof Column, value: string | boolean) => {
    onChange(index, { ...column, [field]: value });
  };

  return (
    <div className="flex items-start gap-2 rounded-lg border p-3">
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="説明（LLMへのヒント）"
            value={column.description}
            onChange={(e) => update('description', e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
            <input
              type="checkbox"
              checked={column.required}
              onChange={(e) => update('required', e.target.checked)}
              className="rounded"
            />
            必須
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={!canMoveUp}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          title="上へ移動"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={!canMoveDown}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          title="下へ移動"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
        title="カラムを削除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
