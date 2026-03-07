import { ArrowRight } from 'lucide-react';
import type { Template } from '../../lib/types';

interface MappingViewProps {
  inputHeaders: string[];
  template: Template;
}

export function MappingView({ inputHeaders, template }: MappingViewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">マッピング概要</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <div className="space-y-1">
          <p className="mb-2 text-xs font-medium text-muted-foreground">入力カラム</p>
          {inputHeaders.map((h) => (
            <div key={h} className="rounded bg-muted/50 px-3 py-1.5 text-sm">
              {h}
            </div>
          ))}
        </div>

        <div className="flex items-center pt-8">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <p className="mb-2 text-xs font-medium text-muted-foreground">出力カラム</p>
          {template.columns.map((col) => (
            <div key={col.name} className="rounded bg-primary/10 px-3 py-1.5 text-sm">
              {col.label}
              <span className="ml-1 text-xs text-muted-foreground">({col.name})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
