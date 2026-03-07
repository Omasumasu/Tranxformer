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
      <div className="py-8 text-center text-sm text-muted-foreground">テンプレートがありません</div>
    );
  }

  return (
    <div className="space-y-1">
      {templates.map((tmpl) => (
        <div
          key={tmpl.id}
          className={`group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm ${
            selectedId === tmpl.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          }`}
        >
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => onSelect(tmpl)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{tmpl.name}</p>
              <p className="truncate text-xs text-muted-foreground">{tmpl.columns.length}カラム</p>
            </div>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tmpl.id);
            }}
            className="hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
            aria-label={`${tmpl.name}を削除`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
