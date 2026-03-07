import { Download, FileText, Pencil, Trash2 } from 'lucide-react';
import type { Template } from '../../lib/types';

interface TemplateListProps {
  templates: Template[];
  selectedId: string | null;
  onSelect: (template: Template) => void;
  onDelete: (id: string) => void;
  onEdit: (template: Template) => void;
  onExport: (id: string) => void;
}

export function TemplateList({
  templates,
  selectedId,
  onSelect,
  onDelete,
  onEdit,
  onExport,
}: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
        テンプレートがありません
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {templates.map((t) => (
        <div
          key={t.id}
          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer ${
            selectedId === t.id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => onSelect(t)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{t.name}</span>
          </button>
          <div className="hidden gap-0.5 group-hover:flex">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(t);
              }}
              className="rounded p-0.5 hover:text-primary"
              title="編集"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExport(t.id);
              }}
              className="rounded p-0.5 hover:text-primary"
              title="エクスポート"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t.id);
              }}
              className="rounded p-0.5 hover:text-destructive"
              title="削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
