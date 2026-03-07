import type { Template } from '@/lib/types';
import { FileText, Trash2 } from 'lucide-react';

interface TemplateListProps {
  templates: Template[];
  selectedId: string | null;
  onSelect: (template: Template) => void;
  onDelete: (id: string) => void;
}

export function TemplateList({ templates, selectedId, onSelect, onDelete }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">テンプレートがありません</div>
    );
  }

  return (
    <div className="space-y-1">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer ${
            selectedId === template.id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => onSelect(template)}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{template.name}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
