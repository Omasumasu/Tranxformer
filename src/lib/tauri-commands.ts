import { invoke } from '@tauri-apps/api/core';
import type {
  DataPreview,
  ModelStatus,
  SafetyReport,
  SchemaInferenceResult,
  Template,
} from './types';

// テンプレート
export async function listTemplates(): Promise<Template[]> {
  return invoke('list_templates');
}

export async function getTemplate(id: string): Promise<Template> {
  return invoke('get_template', { id });
}

export async function saveTemplate(template: Template): Promise<void> {
  return invoke('save_template', { template });
}

export async function deleteTemplate(id: string): Promise<void> {
  return invoke('delete_template', { id });
}

export async function exportTemplate(id: string, path: string): Promise<void> {
  return invoke('export_template', { id, path });
}

export async function importTemplate(path: string): Promise<Template> {
  return invoke('import_template', { path });
}

// データI/O
export async function readFilePreview(path: string): Promise<DataPreview> {
  return invoke('read_file_preview', { path });
}

export async function readFileFull(path: string): Promise<[string[], Record<string, unknown>[]]> {
  return invoke('read_file_full', { path });
}

export async function listSheets(path: string): Promise<string[]> {
  return invoke('list_sheets', { path });
}

export async function readFilePreviewSheet(path: string, sheet: string): Promise<DataPreview> {
  return invoke('read_file_preview_sheet', { path, sheet });
}

export async function inferSchemaFromFile(path: string): Promise<SchemaInferenceResult> {
  return invoke('infer_schema_from_file', { path });
}

export async function exportResult(
  headers: string[],
  rows: string[][],
  path: string,
  format: 'Csv' | 'Tsv' | 'Excel',
): Promise<void> {
  return invoke('export_result', { headers, rows, path, format });
}

// LLM
export async function loadModel(modelPath: string): Promise<void> {
  return invoke('load_model', { modelPath });
}

export async function getModelStatus(): Promise<ModelStatus> {
  return invoke('get_model_status');
}

export async function generateTransformCode(
  inputHeaders: string[],
  inputSample: string[][],
  template: Template,
): Promise<string> {
  return invoke('generate_transform_code', { inputHeaders, inputSample, template });
}

// 変換
export async function checkCodeSafety(code: string): Promise<SafetyReport> {
  return invoke('check_code_safety', { code });
}

export async function executeTransform(code: string, inputData: string): Promise<string> {
  return invoke('execute_transform', { code, inputData });
}
