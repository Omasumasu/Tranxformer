import { FileText, Trash2 } from 'lucide-react';
import type { Template } from '../../lib/types';

interface TemplateListProps {
  templates: Template[];
  selectedId: string | null;
  onSelect: (template: Template) => void;
  onDelete: (id: string) => void;
}

export function TemplateList({ templates, selectedId, onSelect, onDelete }: TemplateListProps) {
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(t.id);
            }}
            className="hidden rounded p-0.5 hover:text-destructive group-hover:block"
            title="削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
