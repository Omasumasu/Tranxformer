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
