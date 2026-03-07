import type { AppStep } from '../../lib/types';

const STEP_LABELS: Record<AppStep, string> = {
  template: 'テンプレート',
  import: 'データ読み込み',
  review: 'コードレビュー',
  results: '結果',
};

const STEPS: AppStep[] = ['template', 'import', 'review', 'results'];

interface HeaderProps {
  currentStep: AppStep | null;
}

export function Header({ currentStep }: HeaderProps) {
  if (!currentStep) {
    return (
      <header className="flex items-center border-b px-6 py-3">
        <h2 className="text-lg font-medium">ダッシュボード</h2>
      </header>
    );
  }

  return (
    <header className="flex items-center gap-4 border-b px-6 py-3">
      {STEPS.map((step, i) => {
        const isActive = step === currentStep;
        const isPast = STEPS.indexOf(currentStep) > i;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span
              className={`text-sm ${
                isActive
                  ? 'font-semibold text-primary'
                  : isPast
                    ? 'text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </header>
  );
}
