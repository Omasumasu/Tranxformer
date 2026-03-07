import type { WorkflowStep } from '../../lib/types';

interface HeaderProps {
  step: WorkflowStep | null;
  templateName: string | null;
}

const STEP_LABELS: Record<WorkflowStep, string> = {
  template: 'テンプレート編集',
  import: 'データ取り込み',
  generate: 'コード生成',
  review: 'コードレビュー',
  execute: '変換実行',
  results: '結果確認',
};

const STEPS: WorkflowStep[] = ['template', 'import', 'generate', 'review', 'execute', 'results'];

export function Header({ step, templateName }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b px-6 py-3">
      <h2 className="text-lg font-medium">{templateName ?? 'ダッシュボード'}</h2>
      {step && (
        <div className="flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : STEPS.indexOf(s) < STEPS.indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {STEP_LABELS[s]}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
