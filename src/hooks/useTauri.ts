import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import * as commands from '../lib/tauri-commands';
import type {
  DataPreview,
  GenerateProgress,
  ModelStatus,
  SafetyReport,
  Template,
} from '../lib/types';

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
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setFilePath(path);
    setSheets([]);
    setSelectedSheet(null);
    try {
      const data = await commands.readFilePreview(path);
      setPreview(data);

      const ext = path.split('.').pop()?.toLowerCase() ?? '';
      const excelExts = ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'];
      if (excelExts.includes(ext)) {
        const sheetNames = await commands.listSheets(path);
        setSheets(sheetNames);
        if (sheetNames.length > 0) {
          setSelectedSheet(sheetNames[0] ?? null);
        }
      }
    } catch (e) {
      setError(String(e));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSheet = useCallback(
    async (sheet: string) => {
      if (!filePath) return;
      setLoading(true);
      setError(null);
      setSelectedSheet(sheet);
      try {
        const data = await commands.readFilePreviewSheet(filePath, sheet);
        setPreview(data);
      } catch (e) {
        setError(String(e));
        setPreview(null);
      } finally {
        setLoading(false);
      }
    },
    [filePath],
  );

  const clear = useCallback(() => {
    setPreview(null);
    setFilePath(null);
    setSheets([]);
    setSelectedSheet(null);
    setError(null);
  }, []);

  return { preview, filePath, sheets, selectedSheet, loading, error, loadFile, loadSheet, clear };
}

export function useLlm() {
  const [status, setStatus] = useState<ModelStatus>({ loaded: false, modelPath: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerateProgress | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await commands.getModelStatus();
      setStatus(s);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const loadModel = useCallback(
    async (modelPath: string) => {
      setLoading(true);
      setError(null);
      try {
        await commands.loadModel(modelPath);
        await refreshStatus();
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [refreshStatus],
  );

  const generateCode = useCallback(
    async (inputHeaders: string[], inputSample: string[][], template: Template) => {
      setLoading(true);
      setError(null);
      setProgress(null);

      const unlisten = await listen<GenerateProgress>('llm-progress', (event) => {
        setProgress(event.payload);
      });

      try {
        const code = await commands.generateTransformCode(inputHeaders, inputSample, template);
        return code;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        unlisten();
        setLoading(false);
        setProgress(null);
      }
    },
    [],
  );

  return { status, loading, error, progress, loadModel, generateCode, refreshStatus };
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
