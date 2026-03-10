export type DataType = 'Text' | 'Number' | 'Date' | 'Boolean';

export interface Column {
  name: string;
  label: string;
  dataType: DataType;
  required: boolean;
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

export interface GenerateProgress {
  tokensGenerated: number;
  maxTokens: number;
}

export interface InferredColumn {
  name: string;
  label: string;
  dataType: DataType;
  sampleValues: string[];
}

export interface SchemaInferenceResult {
  columns: InferredColumn[];
  sampleRows: string[][];
  totalRows: number;
}

export interface InputTemplate {
  id: string;
  name: string;
  description: string;
  files: FileSlot[];
  joinType: 'Left';
  joinExpression: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileSlot {
  role: 'Base' | 'Join';
  label: string;
  expectedHeaders: string[];
}

export interface JoinPreview {
  headers: string[];
  rows: Record<string, unknown>[];
  baseRowCount: number;
  joinedRowCount: number;
}

export interface ImportedFile {
  path: string;
  role: 'Base' | 'Join';
  label: string;
  headers: string[];
  totalRows: number;
}

export function createEmptyInputTemplate(): InputTemplate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    files: [],
    joinType: 'Left',
    joinExpression: '',
    createdAt: now,
    updatedAt: now,
  };
}

export type AppStep = 'template' | 'import' | 'join' | 'review' | 'results';

export function createEmptyColumn(): Column {
  return {
    name: '',
    label: '',
    dataType: 'Text',
    required: false,
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
