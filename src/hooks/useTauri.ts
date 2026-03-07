import * as commands from '@/lib/tauri-commands';
import type { DataPreview, SafetyReport, Template, TransformResult } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await commands.listTemplates();
      setTemplates(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (template: Template) => {
      const saved = await commands.saveTemplate(template);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await commands.deleteTemplate(id);
      await refresh();
    },
    [refresh],
  );

  return { templates, loading, error, refresh, save, remove };
}

export function useFilePreview() {
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await commands.readFilePreview(path);
      setPreview(result);
    } catch (e) {
      setError(String(e));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { preview, loading, error, loadFile };
}

export function useCodeSafety() {
  const [report, setReport] = useState<SafetyReport | null>(null);

  const check = useCallback(async (code: string) => {
    const result = await commands.checkCodeSafety(code);
    setReport(result);
    return result;
  }, []);

  return { report, check };
}

export function useTransform() {
  const [result, setResult] = useState<TransformResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (code: string, inputData: Record<string, unknown>[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await commands.executeTransform(code, inputData);
      setResult(res);
      return res;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, execute };
}
