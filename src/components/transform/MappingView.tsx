import type { Template } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

interface MappingViewProps {
  inputHeaders: string[];
  template: Template;
}

export function MappingView({ inputHeaders, template }: MappingViewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">マッピング概要</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
        <div className="rounded-md border p-3">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">入力カラム</h4>
          <ul className="space-y-1">
            {inputHeaders.map((header) => (
              <li key={header} className="rounded bg-muted/50 px-2 py-1 text-sm">
                {header}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="rounded-md border p-3">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">出力カラム</h4>
          <ul className="space-y-1">
            {template.columns.map((col) => (
              <li key={col.name} className="rounded bg-primary/10 px-2 py-1 text-sm">
                {col.label} ({col.name})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
