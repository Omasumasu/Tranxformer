import { Plus, Save } from 'lucide-react';
import { useState } from 'react';
import type { Column, Template } from '../../lib/types';
import { createEmptyColumn } from '../../lib/types';
import { ColumnEditor } from './ColumnEditor';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template: initial, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [columns, setColumns] = useState<Column[]>(initial.columns);
  const [error, setError] = useState<string | null>(null);

  const handleColumnChange = (index: number, column: Column) => {
    const next = [...columns];
    next[index] = column;
    setColumns(next);
  };

  const handleColumnRemove = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleAddColumn = () => {
    setColumns([...columns, createEmptyColumn()]);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...columns];
    const temp = next[index];
    next[index] = next[index - 1] as Column;
    next[index - 1] = temp as Column;
    setColumns(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= columns.length - 1) return;
    const next = [...columns];
    const temp = next[index];
    next[index] = next[index + 1] as Column;
    next[index + 1] = temp as Column;
    setColumns(next);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('テンプレート名を入力してください');
      return;
    }
    if (columns.length === 0) {
      setError('カラムを1つ以上追加してください');
      return;
    }
    const hasEmpty = columns.some((c) => !c.name.trim() || !c.label.trim());
    if (hasEmpty) {
      setError('すべてのカラムの名前とラベルを入力してください');
      return;
    }

    setError(null);
    onSave({
      ...initial,
      name: name.trim(),
      description: description.trim(),
      columns,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">テンプレート編集</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="template-name" className="mb-1 block text-sm font-medium">
            テンプレート名
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 顧客リスト"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="template-desc" className="mb-1 block text-sm font-medium">
            説明
          </label>
          <input
            id="template-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="テンプレートの用途を簡潔に"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">カラム定義</h3>
          <button
            type="button"
            onClick={handleAddColumn}
            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            カラム追加
          </button>
        </div>
        {columns.map((col, i) => (
          <ColumnEditor
            // biome-ignore lint/suspicious/noArrayIndexKey: columns identified by index
            key={`col-${i}`}
            column={col}
            index={i}
            onChange={handleColumnChange}
            onRemove={handleColumnRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            canRemove={columns.length > 1}
            canMoveUp={i > 0}
            canMoveDown={i < columns.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
