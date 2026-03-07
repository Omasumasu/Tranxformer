import { AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTransform } from '../../hooks/useTauri';
import type { SafetyReport } from '../../lib/types';

interface CodePreviewProps {
  code: string;
  onCodeChange: (code: string) => void;
  onExecute: () => void;
  executing: boolean;
}

export function CodePreview({ code, onCodeChange, onExecute, executing }: CodePreviewProps) {
  const { checkSafety } = useTransform();
  const [safety, setSafety] = useState<SafetyReport | null>(null);

  useEffect(() => {
    if (!code.trim()) {
      setSafety(null);
      return;
    }

    let cancelled = false;
    checkSafety(code).then((report) => {
      if (!cancelled) setSafety(report);
    });
    return () => {
      cancelled = true;
    };
  }, [code, checkSafety]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">生成コード</h3>
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="h-64 w-full rounded-md border bg-muted/30 p-3 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {safety && (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-sm ${
            safety.isSafe ? 'bg-green-500/10 text-green-700' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {safety.isSafe ? (
            <>
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>安全性チェック: 問題なし</span>
            </>
          ) : (
            <>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">安全性チェック: 問題が検出されました</p>
                <ul className="mt-1 list-inside list-disc">
                  {safety.violations.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onExecute}
        disabled={executing || !code.trim() || (safety != null && !safety.isSafe)}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        {executing ? '実行中...' : '変換を実行'}
      </button>
    </div>
  );
}
