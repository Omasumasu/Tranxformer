import { createEmptyColumn, validateTemplate } from '@/lib/template-helpers';
import type { Column, Template } from '@/lib/types';
import { Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { ColumnEditor } from './ColumnEditor';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => Promise<void>;
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
  const [draft, setDraft] = useState<Template>(template);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const updateColumn = (index: number, column: Column) => {
    const columns = [...draft.columns];
    columns[index] = column;
    setDraft({ ...draft, columns });
  };

  const addColumn = () => {
    setDraft({ ...draft, columns: [...draft.columns, createEmptyColumn()] });
  };

  const removeColumn = (index: number) => {
    const columns = draft.columns.filter((_, i) => i !== index);
    setDraft({ ...draft, columns });
  };

  const handleSave = async () => {
    const validationErrors = validateTemplate(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      setErrors([String(e)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="space-y-2 block">
        <span className="text-sm font-medium">テンプレート名</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="テンプレート名を入力"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-sm font-medium">説明</span>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="テンプレートの説明（任意）"
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">カラム定義</span>
          <button
            type="button"
            onClick={addColumn}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            カラム追加
          </button>
        </div>
        <div className="space-y-2">
          {draft.columns.map((col, i) => {
            const key = `col-${col.name || i}`;
            return (
              <ColumnEditor
                key={key}
                column={col}
                index={i}
                onChange={updateColumn}
                onRemove={removeColumn}
                canRemove={draft.columns.length > 1}
              />
            );
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <ul className="list-inside list-disc">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
