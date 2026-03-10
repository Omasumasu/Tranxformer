import { ArrowLeft, ArrowRight, Loader2, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import * as commands from '../../lib/tauri-commands';
import type { ImportedFile, JoinPreview } from '../../lib/types';

interface JoinSettingsProps {
  baseFile: ImportedFile;
  joinFile: ImportedFile;
  llmAvailable: boolean;
  onJoinConfigured: (baseExpr: string, joinExpr: string) => void;
  onBack: () => void;
  onSaveInputTemplate: (name: string, baseExpr: string, joinExpr: string) => void;
}

export function JoinSettings({
  baseFile,
  joinFile,
  llmAvailable,
  onJoinConfigured,
  onBack,
  onSaveInputTemplate,
}: JoinSettingsProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [baseExpr, setBaseExpr] = useState('');
  const [joinExpr, setJoinExpr] = useState('');
  const [preview, setPreview] = useState<JoinPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleInferKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      // Read sample data for LLM — use first 5 rows from preview
      // For now, pass headers only (sample data requires file read)
      const result = await commands.inferJoinKeys(
        baseFile.headers,
        [], // sample data — will be populated when full flow is connected
        joinFile.headers,
        [],
      );
      // Parse the JSON response
      const parsed = JSON.parse(result) as {
        baseExpression: string;
        joinExpression: string;
        explanation?: string;
      };
      setBaseExpr(parsed.baseExpression);
      setJoinExpr(parsed.joinExpression);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!baseExpr.trim() || !joinExpr.trim()) {
      setError('両方の結合キー式を入力してください');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await commands.joinPreview(
        baseFile.path,
        joinFile.path,
        baseExpr,
        joinExpr,
        'j',
      );
      setPreview(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (saveAsTemplate && templateName.trim()) {
      onSaveInputTemplate(templateName.trim(), baseExpr, joinExpr);
    }
    onJoinConfigured(baseExpr, joinExpr);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">結合設定</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!baseExpr.trim() || !joinExpr.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            次へ
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">基準テーブル</div>
          <div className="font-medium text-sm">{baseFile.label}</div>
          <div className="text-xs text-muted-foreground">
            {baseFile.headers.length}列 × {baseFile.totalRows}行
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">結合テーブル</div>
          <div className="font-medium text-sm">{joinFile.label}</div>
          <div className="text-xs text-muted-foreground">
            {joinFile.headers.length}列 × {joinFile.totalRows}行
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-md border p-1">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${mode === 'manual' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          手動入力
        </button>
        <button
          type="button"
          onClick={() => setMode('auto')}
          disabled={!llmAvailable}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${mode === 'auto' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} disabled:opacity-50`}
        >
          LLM自動推論
        </button>
      </div>

      {/* LLM auto mode */}
      {mode === 'auto' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleInferKeys}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            結合キーを推論
          </button>
        </div>
      )}

      {/* Expression inputs (shown in both modes) */}
      <div className="space-y-3">
        <div>
          <label htmlFor="base-expr" className="mb-1 block text-sm font-medium">
            基準テーブルのキー式
          </label>
          <input
            id="base-expr"
            type="text"
            value={baseExpr}
            onChange={(e) => setBaseExpr(e.target.value)}
            placeholder="例: file.customer_id  /  file.姓 + file.名"
            className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            カラム: {baseFile.headers.join(', ')}
          </div>
        </div>
        <div>
          <label htmlFor="join-expr" className="mb-1 block text-sm font-medium">
            結合テーブルのキー式
          </label>
          <input
            id="join-expr"
            type="text"
            value={joinExpr}
            onChange={(e) => setJoinExpr(e.target.value)}
            placeholder="例: file.customer_id  /  file.氏名"
            className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            カラム: {joinFile.headers.join(', ')}
          </div>
        </div>
      </div>

      {/* Preview button */}
      <button
        type="button"
        onClick={handlePreview}
        disabled={loading || !baseExpr.trim() || !joinExpr.trim()}
        className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        プレビュー
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            結合結果: {preview.baseRowCount}行 → {preview.joinedRowCount}行
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: preview rows have no unique ID
                  <tr key={`row-${i}`} className="border-b last:border-b-0">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 whitespace-nowrap">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save as input template */}
      <div className="flex items-center gap-3 rounded-md border p-3">
        <input
          id="save-template"
          type="checkbox"
          checked={saveAsTemplate}
          onChange={(e) => setSaveAsTemplate(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="save-template" className="text-sm">
          インプットテンプレートとして保存
        </label>
        {saveAsTemplate && (
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="テンプレート名"
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        )}
      </div>
    </div>
  );
}
