import { Cpu, FolderOpen } from 'lucide-react';

interface ModelSettingsProps {
  modelLoaded: boolean;
  modelPath: string | null;
  onSelectModel: () => void;
}

export function ModelSettings({ modelLoaded, modelPath, onSelectModel }: ModelSettingsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">LLMモデル設定</h2>

      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">モデルステータス</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              modelLoaded ? 'bg-green-500/10 text-green-700' : 'bg-muted text-muted-foreground'
            }`}
          >
            {modelLoaded ? 'ロード済み' : '未ロード'}
          </span>
        </div>

        {modelPath && <p className="text-sm text-muted-foreground truncate">{modelPath}</p>}

        <button
          type="button"
          onClick={onSelectModel}
          className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80"
        >
          <FolderOpen className="h-4 w-4" />
          GGUFモデルを選択
        </button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>推奨モデル:</p>
          <ul className="list-inside list-disc">
            <li>CodeQwen2.5-7B-GGUF</li>
            <li>Llama-3.1-8B-GGUF</li>
            <li>DeepSeek-Coder-6.7B-GGUF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
