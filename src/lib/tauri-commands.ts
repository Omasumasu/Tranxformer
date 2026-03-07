import { invoke } from '@tauri-apps/api/core';
import type { Column, DataPreview, SafetyReport, Template, TransformResult } from './types';

// Rust側の型名変換用
interface RustTemplate {
  id: string;
  name: string;
  description: string;
  columns: {
    name: string;
    label: string;
    data_type: Column['dataType'];
    description: string;
  }[];
  created_at: string;
  updated_at: string;
}

function toRustTemplate(t: Template): RustTemplate {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    columns: t.columns.map((c) => ({
      name: c.name,
      label: c.label,
      data_type: c.dataType,
      description: c.description,
    })),
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function fromRustTemplate(t: RustTemplate): Template {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    columns: t.columns.map((c) => ({
      name: c.name,
      label: c.label,
      dataType: c.data_type,
      description: c.description,
    })),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

// テンプレート
export async function listTemplates(): Promise<Template[]> {
  const result = await invoke<RustTemplate[]>('list_templates');
  return result.map(fromRustTemplate);
}

export async function getTemplate(id: string): Promise<Template> {
  const result = await invoke<RustTemplate>('get_template', { id });
  return fromRustTemplate(result);
}

export async function saveTemplate(template: Template): Promise<Template> {
  const result = await invoke<RustTemplate>('save_template', {
    template: toRustTemplate(template),
  });
  return fromRustTemplate(result);
}

export async function deleteTemplate(id: string): Promise<void> {
  await invoke('delete_template', { id });
}

export async function exportTemplate(id: string, path: string): Promise<void> {
  await invoke('export_template', { id, path });
}

export async function importTemplate(path: string): Promise<Template> {
  const result = await invoke<RustTemplate>('import_template', { path });
  return fromRustTemplate(result);
}

// データI/O
export async function readFilePreview(path: string, maxRows?: number): Promise<DataPreview> {
  return invoke<DataPreview>('read_file_preview', {
    path,
    maxRows: maxRows ?? null,
  });
}

export async function exportResult(
  headers: string[],
  rows: Record<string, unknown>[],
  path: string,
  format: 'Csv' | 'Tsv' | 'Excel',
): Promise<void> {
  await invoke('export_result', { headers, rows, path, format });
}

// LLM
export async function loadModel(modelPath: string): Promise<void> {
  await invoke('load_model', { modelPath });
}

export async function getModelStatus(): Promise<{
  loaded: boolean;
  modelPath: string | null;
}> {
  return invoke('get_model_status');
}

export async function generateTransformCode(
  inputSample: DataPreview,
  template: Template,
): Promise<string> {
  return invoke<string>('generate_transform_code', {
    inputSample: inputSample,
    template: toRustTemplate(template),
  });
}

// 変換
export async function checkCodeSafety(code: string): Promise<SafetyReport> {
  return invoke<SafetyReport>('check_code_safety', { code });
}

export async function executeTransform(
  code: string,
  inputData: Record<string, unknown>[],
): Promise<TransformResult> {
  return invoke<TransformResult>('execute_transform', {
    code,
    inputData,
  });
}
