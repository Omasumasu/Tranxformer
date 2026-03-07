import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import type { DataPreview, SafetyReport, Template, TransformResult } from '../lib/types';

// --- Template commands ---

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await invoke<Template[]>('list_templates');
      setTemplates(list);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (template: Template) => {
      await invoke('save_template', { template });
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await invoke('delete_template', { id });
      await refresh();
    },
    [refresh],
  );

  const exportTemplate = useCallback(async (id: string, path: string) => {
    await invoke('export_template', { id, path });
  }, []);

  const importTemplate = useCallback(
    async (path: string) => {
      const template = await invoke<Template>('import_template', { path });
      await refresh();
      return template;
    },
    [refresh],
  );

  return {
    templates,
    loading,
    refresh,
    save,
    remove,
    exportTemplate,
    importTemplate,
  };
}

// --- Data I/O commands ---

export function useDataIO() {
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const readPreview = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const data = await invoke<DataPreview>('read_file_preview', { path });
      setPreview(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportResult = useCallback(
    async (
      headers: string[],
      records: Record<string, unknown>[],
      path: string,
      format: 'Csv' | 'Tsv' | 'Xlsx',
    ) => {
      await invoke('export_result', { headers, records, path, format });
    },
    [],
  );

  return { preview, loading, readPreview, exportResult };
}

// --- Transform commands ---

export function useTransform() {
  const [loading, setLoading] = useState(false);

  const checkSafety = useCallback(async (code: string) => {
    return invoke<SafetyReport>('check_code_safety', { code });
  }, []);

  const execute = useCallback(async (code: string, inputData: Record<string, unknown>[]) => {
    setLoading(true);
    try {
      return await invoke<TransformResult>('execute_transform', {
        code,
        inputData,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, checkSafety, execute };
}
