import { AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { useState } from 'react';
import type { SafetyReport } from '../../lib/types';

interface CodePreviewProps {
  code: string;
  safetyReport: SafetyReport | null;
  onCodeChange: (code: string) => void;
  onCheckSafety: () => void;
  onExecute: () => void;
  loading: boolean;
}

export function CodePreview({
  code,
  safetyReport,
  onCodeChange,
  onCheckSafety,
  onExecute,
  loading,
}: CodePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">コードプレビュー</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {isEditing ? '表示モード' : '編集モード'}
          </button>
          <button
            type="button"
            onClick={onCheckSafety}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            安全性チェック
          </button>
          <button
            type="button"
            onClick={onExecute}
            disabled={loading || (safetyReport !== null && !safetyReport.isSafe)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            実行
          </button>
        </div>
      </div>

      {safetyReport && <SafetyBadge report={safetyReport} />}

      {isEditing ? (
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="h-96 w-full rounded-lg border bg-muted/30 p-4 font-mono text-sm"
          spellCheck={false}
        />
      ) : (
        <pre className="h-96 overflow-auto rounded-lg border bg-muted/30 p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

function SafetyBadge({ report }: { report: SafetyReport }) {
  if (report.isSafe) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
        <CheckCircle className="h-4 w-4" />
        安全性チェック: 問題なし
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        安全性チェック: 問題が検出されました
      </div>
      <ul className="list-inside list-disc pl-6">
        {report.violations.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    </div>
  );
}
