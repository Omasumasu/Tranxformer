export type DataType = 'Text' | 'Number' | 'Date' | 'Boolean';

export interface Column {
  name: string;
  label: string;
  dataType: DataType;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface DataPreview {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface TransformResult {
  code: string;
  output: Record<string, unknown>[];
  rowCount: number;
  errors: string[];
}

export interface SafetyReport {
  isSafe: boolean;
  violations: string[];
}

export interface ModelStatus {
  loaded: boolean;
  modelPath: string | null;
}

export type AppStep = 'template' | 'import' | 'generate' | 'review' | 'execute' | 'results';

export function createEmptyColumn(): Column {
  return {
    name: '',
    label: '',
    dataType: 'Text',
    description: '',
  };
}

export function createEmptyTemplate(): Template {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    columns: [createEmptyColumn()],
    createdAt: now,
    updatedAt: now,
  };
}
