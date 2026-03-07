# フロントエンドデザインルール

## アイコン

- 絵文字（emoji）をUI要素として使用しない。必ず `lucide-react` のアイコンコンポーネントを使う
- アイコンは `lucide-react` から named import する: `import { IconName } from 'lucide-react';`
- サイズは Tailwind の `className` で指定する（例: `className="h-4 w-4"`）
- 新しいアイコンライブラリを追加しない。`lucide-react` に統一する
- ボタンやステータス表示にテキスト絵文字（例: `"✅"`, `"❌"`, `"⚠️"`）を使わず、`<CheckCircle />`, `<XCircle />`, `<AlertTriangle />` 等を使う
