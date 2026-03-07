import type { Column, DataType, Template } from './types';

export function createEmptyColumn(): Column {
  return {
    name: '',
    label: '',
    dataType: 'Text',
    description: '',
  };
}

export function createEmptyTemplate(): Template {
  return {
    id: '',
    name: '',
    description: '',
    columns: [createEmptyColumn()],
    createdAt: '',
    updatedAt: '',
  };
}

export const DATA_TYPE_OPTIONS: { value: DataType; label: string }[] = [
  { value: 'Text', label: 'テキスト' },
  { value: 'Number', label: '数値' },
  { value: 'Date', label: '日付' },
  { value: 'Boolean', label: '真偽値' },
];

export function validateTemplate(template: Template): string[] {
  const errors: string[] = [];

  if (!template.name.trim()) {
    errors.push('テンプレート名は空にできません');
  }
  if (template.name.length > 100) {
    errors.push('テンプレート名は100文字以内にしてください');
  }
  if (template.columns.length === 0) {
    errors.push('カラムが1つ以上必要です');
  }

  for (const [i, col] of template.columns.entries()) {
    if (!col.name.trim()) {
      errors.push(`カラム${i + 1}の名前が空です`);
    }
    if (!col.label.trim()) {
      errors.push(`カラム${i + 1}のラベルが空です`);
    }
  }

  return errors;
}
