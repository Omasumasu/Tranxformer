import { AlertTriangle, CheckCircle, Loader2, Play, RefreshCw } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import type { GenerateProgress, SafetyReport } from '../../lib/types';

interface CodePreviewProps {
  code: string;
  safetyReport: SafetyReport | null;
  error: string | null;
  onCodeChange: (code: string) => void;
  onCheckSafety: () => void;
  onExecute: () => void;
  onRetryGenerate: () => void;
  loading: boolean;
  progress: GenerateProgress | null;
}

export function CodePreview({
  code,
  safetyReport,
  error,
  onCodeChange,
  onCheckSafety,
  onExecute,
  onRetryGenerate,
  loading,
  progress,
}: CodePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCode = `${code.substring(0, start)}  ${code.substring(end)}`;
    onCodeChange(newCode);
    requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">コードプレビュー</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetryGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            再生成
          </button>
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
            disabled={loading}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            安全性チェック
          </button>
          <button
            type="button"
            onClick={onExecute}
            disabled={loading || (safetyReport !== null && !safetyReport.isSafe)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            実行
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {safetyReport && <SafetyBadge report={safetyReport} />}

      {loading && !code ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            コードを生成中...
          </div>
          {progress && (
            <div className="w-64">
              <div className="mb-1 text-center text-xs text-muted-foreground">
                {progress.tokensGenerated} / {progress.maxTokens} トークン
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min((progress.tokensGenerated / progress.maxTokens) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : isEditing ? (
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
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
