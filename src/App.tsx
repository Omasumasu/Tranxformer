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
import { useCodeSafety, useFilePreview, useTemplates, useTransform } from './hooks/useTauri';
import * as commands from './lib/tauri-commands';
import { createEmptyTemplate } from './lib/template-helpers';
import type { Template } from './lib/types';

type AppView = 'template' | 'transform' | 'settings';
type TransformStep = 'import' | 'mapping' | 'code' | 'result';

export function App() {
  const [view, setView] = useState<AppView>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [transformStep, setTransformStep] = useState<TransformStep>('import');
  const [generatedCode, setGeneratedCode] = useState('');

  const { templates, save: saveTemplate, remove: removeTemplate } = useTemplates();
  const { preview, loading: fileLoading, error: fileError, loadFile } = useFilePreview();
  const { report: safetyReport, check: checkSafety } = useCodeSafety();
  const { result: transformResult, loading: transformLoading, execute } = useTransform();

  const handleNewTemplate = () => {
    setEditingTemplate(createEmptyTemplate());
    setView('template');
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditingTemplate(template);
    setView('template');
  };

  const handleSaveTemplate = async (template: Template) => {
    const saved = await saveTemplate(template);
    setSelectedTemplate(saved);
    setEditingTemplate(saved);
  };

  const handleStartTransform = () => {
    if (!selectedTemplate) return;
    setView('transform');
    setTransformStep('import');
  };

  const handleSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'データファイル', extensions: ['csv', 'tsv', 'xlsx', 'xls'] }],
    });
    if (selected) {
      await loadFile(selected);
    }
  };

  const handleSelectModel = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'GGUFモデル', extensions: ['gguf'] }],
    });
    if (selected) {
      try {
        await commands.loadModel(selected);
      } catch (_e) {
        // Phase 4で実装予定
      }
    }
  };

  const handleExport = async (format: 'Csv' | 'Tsv' | 'Excel') => {
    if (!transformResult) return;
    const ext = format === 'Excel' ? 'xlsx' : format === 'Tsv' ? 'tsv' : 'csv';
    const path = await save({
      filters: [{ name: `${format}ファイル`, extensions: [ext] }],
    });
    if (path) {
      const firstRow = transformResult.output[0];
      const headers = firstRow ? Object.keys(firstRow) : [];
      await commands.exportResult(headers, transformResult.output, path, format);
    }
  };

  const renderMainContent = () => {
    if (view === 'settings') {
      return (
        <ModelSettings modelLoaded={false} modelPath={null} onSelectModel={handleSelectModel} />
      );
    }

    if (view === 'template' && editingTemplate) {
      return (
        <div className="space-y-4">
          <TemplateEditor template={editingTemplate} onSave={handleSaveTemplate} />
          {selectedTemplate && (
            <button
              type="button"
              onClick={handleStartTransform}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              このテンプレートで変換を開始
            </button>
          )}
        </div>
      );
    }

    if (view === 'transform' && selectedTemplate) {
      return (
        <div className="space-y-6">
          <div className="flex gap-2 border-b pb-3">
            {(['import', 'mapping', 'code', 'result'] as const).map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setTransformStep(step)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  transformStep === step
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {step === 'import' && 'データ読込'}
                {step === 'mapping' && 'マッピング'}
                {step === 'code' && 'コード'}
                {step === 'result' && '結果'}
              </button>
            ))}
          </div>

          {transformStep === 'import' && (
            <DataImport
              preview={preview}
              loading={fileLoading}
              error={fileError}
              onSelectFile={handleSelectFile}
            />
          )}

          {transformStep === 'mapping' && preview && (
            <MappingView inputHeaders={preview.headers} template={selectedTemplate} />
          )}

          {transformStep === 'code' && (
            <CodePreview
              code={generatedCode}
              onCodeChange={setGeneratedCode}
              safetyReport={safetyReport}
              onCheckSafety={() => checkSafety(generatedCode)}
              onExecute={async () => {
                if (preview) {
                  await execute(generatedCode, preview.rows);
                  setTransformStep('result');
                }
              }}
              executing={transformLoading}
            />
          )}

          {transformStep === 'result' && (
            <ResultView result={transformResult} onExport={handleExport} />
          )}
        </div>
      );
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
        selectedId={selectedTemplate?.id ?? null}
        onSelectTemplate={handleSelectTemplate}
        onNewTemplate={handleNewTemplate}
        onDeleteTemplate={removeTemplate}
        onSettings={() => setView('settings')}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={
            view === 'settings'
              ? '設定'
              : view === 'transform'
                ? `変換: ${selectedTemplate?.name ?? ''}`
                : editingTemplate
                  ? editingTemplate.name || '新規テンプレート'
                  : 'ダッシュボード'
          }
        />
        <main className="flex-1 overflow-auto p-6">{renderMainContent()}</main>
      </div>
    </div>
  );
}
