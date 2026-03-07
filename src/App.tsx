import { open, save } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ModelSettings } from './components/settings/ModelSettings';
import { TemplateEditor } from './components/template/TemplateEditor';
import { CodePreview } from './components/transform/CodePreview';
import { DataImport } from './components/transform/DataImport';
import { MappingView } from './components/transform/MappingView';
import { ResultView } from './components/transform/ResultView';
import { useFilePreview, useLlm, useTemplates, useTransform } from './hooks/useTauri';
import * as commands from './lib/tauri-commands';
import type { AppStep, Template } from './lib/types';
import { createEmptyTemplate } from './lib/types';

export function App() {
  const { templates, save: saveTemplate, remove: removeTemplate, refresh } = useTemplates();
  const filePreview = useFilePreview();
  const transform = useTransform();
  const llm = useLlm();

  const [step, setStep] = useState<AppStep | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [transformResult, setTransformResult] = useState<Record<string, unknown>[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [codeGenError, setCodeGenError] = useState<string | null>(null);

  const handleNewTemplate = () => {
    setEditingTemplate(createEmptyTemplate());
    setStep('template');
  };

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setEditingTemplate(null);
    setStep('import');
    filePreview.clear();
    setGeneratedCode('');
    setTransformResult([]);
    setCodeGenError(null);
  };

  const handleEditTemplate = (t: Template) => {
    setEditingTemplate(t);
    setStep('template');
  };

  const handleSaveTemplate = async (t: Template) => {
    await saveTemplate(t);
    setEditingTemplate(null);
    setSelectedTemplate(t);
    setStep('import');
  };

  const handleDeleteTemplate = async (id: string) => {
    await removeTemplate(id);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
      setStep(null);
    }
  };

  const handleExportTemplate = async (id: string) => {
    const path = await save({
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return;
    await commands.exportTemplate(id, path);
  };

  const handleImportTemplate = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'テンプレート', extensions: ['json'] }],
    });
    if (!file) return;
    const imported = await commands.importTemplate(file);
    await refresh();
    setSelectedTemplate(imported);
    setStep('import');
  };

  const handleSelectFile = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'データファイル', extensions: ['csv', 'tsv', 'txt', 'xlsx', 'xls'] }],
    });
    if (file) {
      await filePreview.loadFile(file);
    }
  };

  const generateCode = async () => {
    setCodeGenError(null);
    if (llm.status.loaded && filePreview.preview && selectedTemplate) {
      const headers = filePreview.preview.headers;
      const sampleRows = filePreview.preview.rows
        .slice(0, 5)
        .map((row) => headers.map((h) => String(row[h] ?? '')));
      const code = await llm.generateCode(headers, sampleRows, selectedTemplate);
      if (code) {
        setGeneratedCode(code);
        return;
      }
      if (llm.error) {
        setCodeGenError(llm.error);
        return;
      }
    }

    if (!llm.status.loaded) {
      setGeneratedCode(
        '// LLMモデルが未ロードのため、コードを手動で入力してください\n' +
          '// 例:\n' +
          'function transform(rows) {\n' +
          '  return rows.map(function(row) {\n' +
          '    return row;\n' +
          '  });\n' +
          '}',
      );
    }
  };

  const handleGoToReview = async () => {
    setStep('review');
    await generateCode();
  };

  const handleRetryGenerate = async () => {
    setCodeGenError(null);
    await generateCode();
  };

  const handleExecute = async () => {
    if (!filePreview.filePath) return;

    const report = await transform.checkSafety(generatedCode);
    if (!report?.isSafe) return;

    const [, fullRows] = await commands.readFileFull(filePreview.filePath);
    const inputData = JSON.stringify(fullRows);
    const result = await transform.execute(generatedCode, inputData);
    if (result) {
      try {
        const parsed = JSON.parse(result) as Record<string, unknown>[];
        setTransformResult(parsed);
        setStep('results');
      } catch {
        setTransformResult([]);
      }
    }
  };

  const handleExport = async (format: 'Csv' | 'Tsv' | 'Excel') => {
    if (transformResult.length === 0) return;

    const extMap = { Csv: 'csv', Tsv: 'tsv', Excel: 'xlsx' } as const;
    const ext = extMap[format];
    const path = await save({
      filters: [{ name: format, extensions: [ext] }],
    });
    if (!path) return;

    const first = transformResult[0];
    if (!first) return;
    const headers = Object.keys(first);
    const rows = transformResult.map((r) => headers.map((h) => String(r[h] ?? '')));
    await commands.exportResult(headers, rows, path, format);
  };

  const handleReset = () => {
    setStep(selectedTemplate ? 'import' : null);
    filePreview.clear();
    setGeneratedCode('');
    setTransformResult([]);
    setCodeGenError(null);
  };

  const renderMainContent = () => {
    if (showSettings) {
      return (
        <ModelSettings
          status={llm.status}
          loading={llm.loading}
          error={llm.error}
          onLoadModel={llm.loadModel}
          onClose={() => setShowSettings(false)}
        />
      );
    }

    if (editingTemplate) {
      return (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setEditingTemplate(null);
            setStep(selectedTemplate ? 'import' : null);
          }}
        />
      );
    }

    if (step === 'import') {
      return (
        <div className="space-y-6">
          <DataImport
            preview={filePreview.preview}
            filePath={filePreview.filePath}
            loading={filePreview.loading}
            error={filePreview.error}
            onSelectFile={handleSelectFile}
            onNext={handleGoToReview}
          />
          {filePreview.preview && selectedTemplate && (
            <MappingView inputHeaders={filePreview.preview.headers} template={selectedTemplate} />
          )}
        </div>
      );
    }

    if (step === 'review') {
      return (
        <CodePreview
          code={generatedCode}
          safetyReport={transform.safetyReport}
          error={codeGenError ?? transform.error}
          onCodeChange={setGeneratedCode}
          onCheckSafety={() => transform.checkSafety(generatedCode)}
          onExecute={handleExecute}
          onRetryGenerate={handleRetryGenerate}
          loading={transform.loading || llm.loading}
          progress={llm.progress}
        />
      );
    }

    if (step === 'results') {
      return <ResultView data={transformResult} onExport={handleExport} onReset={handleReset} />;
    }

    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>テンプレートを選択するか、新規作成してください</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        templates={templates}
        selectedTemplateId={selectedTemplate?.id ?? null}
        onNewTemplate={handleNewTemplate}
        onSelectTemplate={handleSelectTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onEditTemplate={handleEditTemplate}
        onExportTemplate={handleExportTemplate}
        onImportTemplate={handleImportTemplate}
        onSettings={() => setShowSettings(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header currentStep={step} />
        <main className="flex-1 overflow-auto p-6">{renderMainContent()}</main>
      </div>
    </div>
  );
}
