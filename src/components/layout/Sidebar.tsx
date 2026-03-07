import type { Template } from '@/lib/types';
import { FileText, Plus, Settings } from 'lucide-react';
import { TemplateList } from '../template/TemplateList';

interface SidebarProps {
  templates: Template[];
  selectedId: string | null;
  onSelectTemplate: (template: Template) => void;
  onNewTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
  onSettings: () => void;
}

export function Sidebar({
  templates,
  selectedId,
  onSelectTemplate,
  onNewTemplate,
  onDeleteTemplate,
  onSettings,
}: SidebarProps) {
  return (
    <aside className="flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <FileText className="h-5 w-5 text-sidebar-primary" />
        <h1 className="text-lg font-semibold">Tranxformer</h1>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <button
          type="button"
          onClick={onNewTemplate}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          新規テンプレート
        </button>

        <TemplateList
          templates={templates}
          selectedId={selectedId}
          onSelect={onSelectTemplate}
          onDelete={onDeleteTemplate}
        />
      </div>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={onSettings}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          設定
        </button>
      </div>
    </aside>
  );
}
