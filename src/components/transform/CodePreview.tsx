import type { SafetyReport } from '@/lib/types';
import { AlertTriangle, CheckCircle, Play, Shield } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  onCodeChange: (code: string) => void;
  safetyReport: SafetyReport | null;
  onCheckSafety: () => void;
  onExecute: () => void;
  executing: boolean;
}

export function CodePreview({
  code,
  onCodeChange,
  safetyReport,
  onCheckSafety,
  onExecute,
  executing,
}: CodePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCheckSafety}
          className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80"
        >
          <Shield className="h-4 w-4" />
          安全性チェック
        </button>
        <button
          type="button"
          onClick={onExecute}
          disabled={executing || (safetyReport !== null && !safetyReport.isSafe)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {executing ? '実行中...' : '実行'}
        </button>
      </div>

      {safetyReport && (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-sm ${
            safetyReport.isSafe
              ? 'bg-green-500/10 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {safetyReport.isSafe ? (
            <>
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>安全性チェック通過</span>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">安全性チェック違反</span>
              </div>
              <ul className="list-inside list-disc pl-6">
                {safetyReport.violations.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        rows={20}
        className="w-full rounded-md border bg-muted/30 px-4 py-3 font-mono text-sm"
        spellCheck={false}
      />
    </div>
  );
}
