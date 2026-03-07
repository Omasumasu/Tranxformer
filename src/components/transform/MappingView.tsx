import { ArrowRight } from 'lucide-react';
import type { Template } from '../../lib/types';

interface MappingViewProps {
  inputHeaders: string[];
  template: Template;
}

export function MappingView({ inputHeaders, template }: MappingViewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">マッピング概要</h3>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">入力カラム</h4>
          <ul className="space-y-1">
            {inputHeaders.map((h) => (
              <li key={h} className="rounded bg-muted/50 px-2 py-1 text-sm">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center self-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            出力カラム ({template.name})
          </h4>
          <ul className="space-y-1">
            {template.columns.map((c) => (
              <li key={c.name} className="rounded bg-muted/50 px-2 py-1 text-sm">
                {c.label} <span className="text-xs text-muted-foreground">({c.name})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
