import { open } from '@tauri-apps/plugin-dialog';
import { Brain, FolderOpen, Loader2, X } from 'lucide-react';
import type { ModelStatus } from '../../lib/types';

interface ModelSettingsProps {
  status: ModelStatus;
  loading: boolean;
  error: string | null;
  onLoadModel: (path: string) => void;
  onClose: () => void;
}

export function ModelSettings({
  status,
  loading,
  error,
  onLoadModel,
  onClose,
}: ModelSettingsProps) {
  const handleSelectModel = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'GGUFモデル', extensions: ['gguf'] }],
    });
    if (file) {
      onLoadModel(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <h2 className="text-lg font-semibold">モデル設定</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-medium">LLMモデル</h3>

        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${status.loaded ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span className="text-sm">{status.loaded ? 'ロード済み' : '未ロード'}</span>
        </div>

        {status.modelPath && (
          <p className="text-xs text-muted-foreground break-all">{status.modelPath}</p>
        )}

        <button
          type="button"
          onClick={handleSelectModel}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4" />
          )}
          {loading ? 'ロード中...' : 'GGUFモデルを選択'}
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="text-sm font-medium">対応モデル（GGUF形式）</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>CodeQwen2.5-7B — コード生成に強い</li>
          <li>Llama-3.1-8B — 汎用、命令追従性が高い</li>
          <li>DeepSeek-Coder-6.7B — コード特化</li>
        </ul>
      </div>
    </div>
  );
}
