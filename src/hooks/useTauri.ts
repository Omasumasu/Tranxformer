import { useCallback, useEffect, useState } from 'react';
import * as commands from '../lib/tauri-commands';
import type { DataPreview, SafetyReport, Template } from '../lib/types';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await commands.listTemplates();
      setTemplates(list);
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
      await commands.saveTemplate(template);
      await refresh();
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
  const [filePath, setFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setFilePath(path);
    try {
      const data = await commands.readFilePreview(path);
      setPreview(data);
    } catch (e) {
      setError(String(e));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPreview(null);
    setFilePath(null);
    setError(null);
  }, []);

  return { preview, filePath, loading, error, loadFile, clear };
}

export function useTransform() {
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSafety = useCallback(async (code: string) => {
    try {
      const report = await commands.checkCodeSafety(code);
      setSafetyReport(report);
      return report;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  const execute = useCallback(async (code: string, inputData: string) => {
    setLoading(true);
    setError(null);
    try {
      const output = await commands.executeTransform(code, inputData);
      setResult(output);
      return output;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { safetyReport, result, loading, error, checkSafety, execute };
}
