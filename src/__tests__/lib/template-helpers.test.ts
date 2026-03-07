import { createEmptyColumn, createEmptyTemplate, validateTemplate } from '@/lib/template-helpers';
import type { Template } from '@/lib/types';
import { describe, expect, it } from 'vitest';

describe('createEmptyColumn', () => {
  it('creates a column with default values', () => {
    const col = createEmptyColumn();
    expect(col.name).toBe('');
    expect(col.label).toBe('');
    expect(col.dataType).toBe('Text');
    expect(col.description).toBe('');
  });
});

describe('createEmptyTemplate', () => {
  it('creates a template with one empty column', () => {
    const t = createEmptyTemplate();
    expect(t.id).toBe('');
    expect(t.name).toBe('');
    expect(t.columns).toHaveLength(1);
  });
});

describe('validateTemplate', () => {
  const validTemplate: Template = {
    id: '1',
    name: 'テスト',
    description: '',
    columns: [{ name: 'col1', label: 'カラム1', dataType: 'Text', description: '' }],
    createdAt: '',
    updatedAt: '',
  };

  it('returns no errors for valid template', () => {
    expect(validateTemplate(validTemplate)).toHaveLength(0);
  });

  it('reports empty name', () => {
    const errors = validateTemplate({ ...validTemplate, name: '' });
    expect(errors.some((e) => e.includes('テンプレート名'))).toBe(true);
  });

  it('reports name too long', () => {
    const errors = validateTemplate({
      ...validTemplate,
      name: 'a'.repeat(101),
    });
    expect(errors.some((e) => e.includes('100文字'))).toBe(true);
  });

  it('reports no columns', () => {
    const errors = validateTemplate({ ...validTemplate, columns: [] });
    expect(errors.some((e) => e.includes('カラムが1つ以上'))).toBe(true);
  });

  it('reports empty column name', () => {
    const errors = validateTemplate({
      ...validTemplate,
      columns: [{ name: '', label: 'ラベル', dataType: 'Text', description: '' }],
    });
    expect(errors.some((e) => e.includes('名前が空'))).toBe(true);
  });

  it('reports empty column label', () => {
    const errors = validateTemplate({
      ...validTemplate,
      columns: [{ name: 'col', label: '', dataType: 'Text', description: '' }],
    });
    expect(errors.some((e) => e.includes('ラベルが空'))).toBe(true);
  });
});
