import { invoke } from '@tauri-apps/api/core';
import type { DataPreview, SafetyReport, Template } from './types';

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

export async function exportResult(
  headers: string[],
  rows: string[][],
  path: string,
  format: 'Csv' | 'Tsv' | 'Excel',
): Promise<void> {
  return invoke('export_result', { headers, rows, path, format });
}

// 変換
export async function checkCodeSafety(code: string): Promise<SafetyReport> {
  return invoke('check_code_safety', { code });
}

export async function executeTransform(code: string, inputData: string): Promise<string> {
  return invoke('execute_transform', { code, inputData });
}
