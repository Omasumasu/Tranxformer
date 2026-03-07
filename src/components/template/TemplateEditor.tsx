import { Plus, Save } from 'lucide-react';
import { useState } from 'react';
import type { Column, Template } from '../../lib/types';
import { ColumnEditor } from './ColumnEditor';

interface TemplateEditorProps {
  template: Template | null;
  onSave: (template: Template) => void;
}

function createEmptyColumn(): Column {
  return { name: '', label: '', dataType: 'Text', description: '' };
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [columns, setColumns] = useState<Column[]>(template?.columns ?? [createEmptyColumn()]);
  const [errors, setErrors] = useState<string[]>([]);

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

  const handleSave = () => {
    const validationErrors: string[] = [];
    if (!name.trim()) {
      validationErrors.push('テンプレート名を入力してください');
    }
    if (columns.length === 0) {
      validationErrors.push('カラムを1つ以上追加してください');
    }
    for (const [i, col] of columns.entries()) {
      if (!col.name.trim()) validationErrors.push(`カラム${i + 1}の名前が空です`);
      if (!col.label.trim()) validationErrors.push(`カラム${i + 1}のラベルが空です`);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    const now = new Date().toISOString();
    onSave({
      id: template?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      columns,
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="テンプレート名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium"
        />
        <input
          type="text"
          placeholder="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">カラム定義</h3>
        {columns.map((col, i) => (
          <ColumnEditor
            key={`col-${i.toString()}`}
            column={col}
            index={i}
            onChange={handleColumnChange}
            onRemove={handleColumnRemove}
          />
        ))}
        <button
          type="button"
          onClick={handleAddColumn}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          カラムを追加
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Save className="h-4 w-4" />
        保存
      </button>
    </div>
  );
}
