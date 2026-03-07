import { open } from '@tauri-apps/plugin-dialog';
import { Cpu } from 'lucide-react';
import { useState } from 'react';

interface ModelSettingsProps {
  onClose: () => void;
}

export function ModelSettings({ onClose }: ModelSettingsProps) {
  const [modelPath, setModelPath] = useState<string | null>(null);

  const handleSelectModel = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'GGUF Model', extensions: ['gguf'] }],
    });
    if (selected) {
      setModelPath(selected);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">設定</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-sm hover:bg-accent"
        >
          閉じる
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Cpu className="h-4 w-4" />
          LLMモデル設定
        </h3>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSelectModel}
            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            GGUFモデルファイルを選択
          </button>

          {modelPath && <p className="text-xs text-muted-foreground">選択中: {modelPath}</p>}

          <p className="text-xs text-muted-foreground">
            推奨モデル: CodeQwen2.5-7B, Llama-3.1-8B, DeepSeek-Coder-6.7B（GGUF形式）
          </p>
        </div>
      </div>
    </div>
  );
}
