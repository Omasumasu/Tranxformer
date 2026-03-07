import type {
  Column,
  DataPreview,
  DataType,
  SafetyReport,
  Template,
  TransformResult,
} from '@/lib/types';
import { describe, expect, it } from 'vitest';

describe('types', () => {
  it('Column interface can be used correctly', () => {
    const column: Column = {
      name: 'test_col',
      label: 'テスト列',
      dataType: 'Text',
      description: 'テスト用カラム',
    };
    expect(column.name).toBe('test_col');
    expect(column.dataType).toBe('Text');
  });

  it('Template interface can be used correctly', () => {
    const template: Template = {
      id: '1',
      name: 'テスト',
      description: 'テスト用テンプレート',
      columns: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(template.name).toBe('テスト');
    expect(template.columns).toHaveLength(0);
  });

  it('DataType supports all expected values', () => {
    const types: DataType[] = ['Text', 'Number', 'Date', 'Boolean'];
    expect(types).toHaveLength(4);
  });

  it('DataPreview interface can be used correctly', () => {
    const preview: DataPreview = {
      headers: ['name', 'age'],
      rows: [{ name: 'Alice', age: 30 }],
      totalRows: 1,
    };
    expect(preview.headers).toHaveLength(2);
    expect(preview.totalRows).toBe(1);
  });

  it('TransformResult interface can be used correctly', () => {
    const result: TransformResult = {
      code: 'function transform(rows) { return rows; }',
      output: [],
      rowCount: 0,
      errors: [],
    };
    expect(result.errors).toHaveLength(0);
  });

  it('SafetyReport interface can be used correctly', () => {
    const report: SafetyReport = {
      isSafe: true,
      violations: [],
    };
    expect(report.isSafe).toBe(true);
  });
});
