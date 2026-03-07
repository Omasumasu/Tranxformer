import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ModelSettings } from './components/settings/ModelSettings';
import { TemplateEditor } from './components/template/TemplateEditor';
import { CodePreview } from './components/transform/CodePreview';
import { DataImport } from './components/transform/DataImport';
import { MappingView } from './components/transform/MappingView';
import { ResultView } from './components/transform/ResultView';
import { useTemplates, useTransform } from './hooks/useTauri';
import type { DataPreview, Template, TransformResult, WorkflowStep } from './lib/types';

export function App() {
  const { templates, refresh, save, remove } = useTemplates();
  const { loading: executing, execute } = useTransform();

  const [step, setStep] = useState<WorkflowStep | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setEditingTemplate(null);
    setIsNewTemplate(true);
    setStep('template');
    setShowSettings(false);
  };

  const handleSelectTemplate = (tmpl: Template) => {
    setSelectedTemplate(tmpl);
    setEditingTemplate(tmpl);
    setIsNewTemplate(false);
    setStep('template');
    setShowSettings(false);
    setDataPreview(null);
    setGeneratedCode('');
    setTransformResult(null);
  };

  const handleSaveTemplate = useCallback(
    async (tmpl: Template) => {
      await save(tmpl);
      setSelectedTemplate(tmpl);
      setEditingTemplate(tmpl);
      setIsNewTemplate(false);
      setStep('import');
    },
    [save],
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      await remove(id);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setEditingTemplate(null);
        setStep(null);
      }
    },
    [remove, selectedTemplate],
  );

  const handleDataImported = (preview: DataPreview, _filePath: string) => {
    setDataPreview(preview);
    setStep('review');
    setGeneratedCode('');
  };

  const handleExecute = async () => {
    if (!dataPreview || !generatedCode.trim()) return;
    setError(null);
    try {
      const result = await execute(generatedCode, dataPreview.rows);
      if (result) {
        setTransformResult(result);
        setStep('results');
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const renderContent = () => {
    if (showSettings) {
      return <ModelSettings onClose={() => setShowSettings(false)} />;
    }

    if (!step) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>テンプレートを選択するか、新規作成してください</p>
        </div>
      );
    }

    switch (step) {
      case 'template':
        return (
          <TemplateEditor
            key={editingTemplate?.id ?? 'new'}
            template={isNewTemplate ? null : editingTemplate}
            onSave={handleSaveTemplate}
          />
        );

      case 'import':
        return <DataImport onImported={handleDataImported} />;

      case 'review':
        return (
          <div className="space-y-6">
            {selectedTemplate && dataPreview && (
              <MappingView inputHeaders={dataPreview.headers} template={selectedTemplate} />
            )}
            <CodePreview
              code={generatedCode}
              onCodeChange={setGeneratedCode}
              onExecute={handleExecute}
              executing={executing}
            />
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        );

      case 'results':
        return transformResult ? <ResultView result={transformResult} /> : null;

      default:
        return null;
    }
  };

  const stepNav = step ? (
    <div className="flex gap-2 border-b px-6 py-2">
      {selectedTemplate && step !== 'template' && (
        <button
          type="button"
          onClick={() => setStep('template')}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          テンプレート
        </button>
      )}
      {selectedTemplate && step !== 'import' && step !== 'template' && (
        <button
          type="button"
          onClick={() => setStep('import')}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          データ取り込み
        </button>
      )}
      {dataPreview && step === 'results' && (
        <button
          type="button"
          onClick={() => setStep('review')}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          コードレビュー
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        templates={templates}
        selectedTemplateId={selectedTemplate?.id ?? null}
        onNewTemplate={handleNewTemplate}
        onSelectTemplate={handleSelectTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header step={step} templateName={selectedTemplate?.name ?? null} />
        {stepNav}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
