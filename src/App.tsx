import { confirm, open, save } from '@tauri-apps/plugin-dialog';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ModelSettings } from './components/settings/ModelSettings';
import { SchemaPreview } from './components/template/SchemaPreview';
import { TemplateEditor } from './components/template/TemplateEditor';
import { CodePreview } from './components/transform/CodePreview';
import { DataImport } from './components/transform/DataImport';
import { JoinSettings } from './components/transform/JoinSettings';
import { MappingView } from './components/transform/MappingView';
import { ResultView } from './components/transform/ResultView';
import { useFilePreview, useLlm, useTemplates, useTransform } from './hooks/useTauri';
import * as commands from './lib/tauri-commands';
import type { AppStep, DataType, ImportedFile, InferredColumn, Template } from './lib/types';
import { createEmptyInputTemplate, createEmptyTemplate } from './lib/types';

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
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [inferredColumns, setInferredColumns] = useState<InferredColumn[] | null>(null);
  const [inferring, setInferring] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [joinedFullData, setJoinedFullData] = useState<{
    headers: string[];
    rows: Record<string, unknown>[];
  } | null>(null);

  const handleNewTemplate = () => {
    setShowNewTemplateDialog(true);
  };

  const handleCreateFromScratch = () => {
    setShowNewTemplateDialog(false);
    setEditingTemplate(createEmptyTemplate());
    setStep('template');
  };

  const handleCreateFromCsv = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'データファイル', extensions: ['csv', 'tsv', 'txt', 'xlsx', 'xls'] }],
    });
    if (!file) return;

    setShowNewTemplateDialog(false);
    setInferring(true);
    try {
      const result = await commands.inferSchemaFromFile(file);
      setInferredColumns(result.columns.map((c) => ({ ...c })));
    } catch {
      setEditingTemplate(createEmptyTemplate());
      setStep('template');
    } finally {
      setInferring(false);
    }
  };

  const handleInferredTypeChange = (index: number, dataType: DataType) => {
    if (!inferredColumns) return;
    const next = [...inferredColumns];
    const col = next[index];
    if (!col) return;
    next[index] = { ...col, dataType };
    setInferredColumns(next);
  };

  const handleConfirmSchema = () => {
    if (!inferredColumns) return;
    const template = createEmptyTemplate();
    template.columns = inferredColumns.map((col) => ({
      name: col.name,
      label: col.label,
      dataType: col.dataType,
      required: false,
      description: '',
    }));
    setInferredColumns(null);
    setEditingTemplate(template);
    setStep('template');
  };

  const handleCancelSchema = () => {
    setInferredColumns(null);
  };

  const handleAddFile = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'データファイル', extensions: ['csv', 'tsv', 'txt', 'xlsx', 'xls'] }],
    });
    if (!file) return;

    const preview = await commands.readFilePreview(file);
    const label = file.split('/').pop() ?? file;
    const isFirst = importedFiles.length === 0;
    const newFile: ImportedFile = {
      path: file,
      role: isFirst ? 'Base' : 'Join',
      label,
      headers: preview.headers,
      totalRows: preview.totalRows,
    };
    setImportedFiles((prev) => [...prev, newFile]);

    // 最初のファイルの場合、filePreviewにも読み込む（既存の単一ファイルフローとの互換性）
    if (isFirst) {
      await filePreview.loadFile(file);
    }
  };

  const handleRemoveFile = (index: number) => {
    setImportedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // 基準テーブルが削除された場合、最初のファイルを基準に
      const first = next[0];
      if (first && !next.some((f) => f.role === 'Base')) {
        next[0] = { ...first, role: 'Base' };
      }
      return next;
    });
  };

  const handleSetBase = (index: number) => {
    setImportedFiles((prev) =>
      prev.map((f, i) => ({
        ...f,
        role: i === index ? 'Base' : 'Join',
      })),
    );
  };

  const handleJoinConfigured = async (baseExpr: string, joinExpr: string) => {
    const baseFile = importedFiles.find((f) => f.role === 'Base');
    const joinFile = importedFiles.find((f) => f.role === 'Join');
    if (baseFile && joinFile) {
      try {
        const [headers, rows] = await commands.joinAndReadFull(
          baseFile.path,
          joinFile.path,
          baseExpr,
          joinExpr,
          'j',
        );
        setJoinedFullData({ headers, rows });
      } catch {
        // エラーは結合設定画面で表示済み
      }
    }

    setStep('review');
    await generateCode();
  };

  const handleSaveInputTemplate = async (name: string, baseExpr: string, joinExpr: string) => {
    const tmpl = createEmptyInputTemplate();
    tmpl.name = name;
    tmpl.files = importedFiles.map((f) => ({
      role: f.role,
      label: f.label,
      expectedHeaders: f.headers,
    }));
    tmpl.joinExpression = `${baseExpr} === ${joinExpr}`;
    try {
      await commands.saveInputTemplate(tmpl);
    } catch {
      // テンプレート保存失敗は致命的ではない
    }
  };

  const handleImportNext = () => {
    if (importedFiles.length >= 2) {
      setStep('join');
    } else {
      handleGoToReview();
    }
  };

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setEditingTemplate(null);
    setStep('import');
    filePreview.clear();
    setGeneratedCode('');
    setTransformResult([]);
    setCodeGenError(null);
    setImportedFiles([]);
    setJoinedFullData(null);
  };

  const handleEditTemplate = (t: Template) => {
    setEditingTemplate(t);
    setStep('template');
  };

  const handleSaveTemplate = async (t: Template) => {
    try {
      await saveTemplate(t);
      setEditingTemplate(null);
      setSelectedTemplate(t);
      setStep('import');
    } catch (e) {
      setSaveError(String(e));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const ok = await confirm('このテンプレートを削除しますか？この操作は取り消せません。', {
      title: 'テンプレートの削除',
      kind: 'warning',
      okLabel: '削除',
      cancelLabel: 'キャンセル',
    });
    if (!ok) return;
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
    const report = await transform.checkSafety(generatedCode);
    if (!report?.isSafe) return;

    let fullRows: Record<string, unknown>[];
    if (joinedFullData) {
      fullRows = joinedFullData.rows;
    } else if (filePreview.filePath) {
      const [, rows] = await commands.readFileFull(filePreview.filePath);
      fullRows = rows;
    } else {
      return;
    }

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
    setImportedFiles([]);
    setJoinedFullData(null);
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

    if (inferring) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
          <p className="text-lg">スキーマを推論中...</p>
        </div>
      );
    }

    if (inferredColumns) {
      return (
        <SchemaPreview
          columns={inferredColumns}
          onConfirm={handleConfirmSchema}
          onCancel={handleCancelSchema}
          onTypeChange={handleInferredTypeChange}
        />
      );
    }

    if (editingTemplate) {
      return (
        <div className="space-y-4">
          {saveError && (
            <div className="mx-auto max-w-2xl rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              テンプレートの保存に失敗しました: {saveError}
            </div>
          )}
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setEditingTemplate(null);
              setSaveError(null);
              setStep(selectedTemplate ? 'import' : null);
            }}
          />
        </div>
      );
    }

    if (step === 'import') {
      return (
        <div className="space-y-6">
          <DataImport
            preview={filePreview.preview}
            filePath={filePreview.filePath}
            sheets={filePreview.sheets}
            selectedSheet={filePreview.selectedSheet}
            loading={filePreview.loading}
            error={filePreview.error}
            onSelectFile={handleSelectFile}
            onSelectSheet={filePreview.loadSheet}
            onNext={handleImportNext}
            importedFiles={importedFiles}
            onAddFile={handleAddFile}
            onRemoveFile={handleRemoveFile}
            onSetBase={handleSetBase}
          />
          {filePreview.preview && selectedTemplate && (
            <MappingView inputHeaders={filePreview.preview.headers} template={selectedTemplate} />
          )}
        </div>
      );
    }

    if (step === 'join') {
      const baseFile = importedFiles.find((f) => f.role === 'Base');
      const joinFile = importedFiles.find((f) => f.role === 'Join');
      if (baseFile && joinFile) {
        return (
          <JoinSettings
            baseFile={baseFile}
            joinFile={joinFile}
            llmAvailable={llm.status.loaded}
            onJoinConfigured={handleJoinConfigured}
            onBack={() => setStep('import')}
            onSaveInputTemplate={handleSaveInputTemplate}
          />
        );
      }
      // フォールバック: ファイルが不足していたらimportに戻す
      setStep('import');
      return null;
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
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-lg">テンプレートを選択するか、新規作成してください</p>
        <button
          type="button"
          onClick={handleNewTemplate}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          テンプレートを作成
        </button>
      </div>
    );
  };

  return (
    <>
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
      {showNewTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg bg-background p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold">新規テンプレート</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCreateFromScratch}
                className="w-full rounded-md border px-4 py-3 text-left text-sm hover:bg-muted"
              >
                <div className="font-medium">空から作成</div>
                <div className="text-xs text-muted-foreground">カラムを手動で定義</div>
              </button>
              <button
                type="button"
                onClick={handleCreateFromCsv}
                className="w-full rounded-md border px-4 py-3 text-left text-sm hover:bg-muted"
              >
                <div className="font-medium">CSVからインポート</div>
                <div className="text-xs text-muted-foreground">データから型を自動推論</div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowNewTemplateDialog(false)}
              className="w-full rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  );
}
