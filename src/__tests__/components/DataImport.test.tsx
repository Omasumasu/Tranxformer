import { DataImport } from '@/components/transform/DataImport';
import type { DataPreview } from '@/lib/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DataImport', () => {
  const onSelectFile = vi.fn();
  const onNext = vi.fn();

  it('renders file selection button', () => {
    render(
      <DataImport
        preview={null}
        filePath={null}
        loading={false}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('ファイルを選択 (CSV / Excel)')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DataImport
        preview={null}
        filePath={null}
        loading={true}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <DataImport
        preview={null}
        filePath={null}
        loading={false}
        error="ファイルが読み込めません"
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('ファイルが読み込めません')).toBeInTheDocument();
  });

  it('shows file path when loaded', () => {
    render(
      <DataImport
        preview={null}
        filePath="/path/to/data.csv"
        loading={false}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('ファイル: /path/to/data.csv')).toBeInTheDocument();
  });

  it('shows preview table when data is loaded', () => {
    const preview: DataPreview = {
      headers: ['name', 'age'],
      rows: [{ name: 'Alice', age: 30 }],
      totalRows: 1,
    };
    render(
      <DataImport
        preview={preview}
        filePath="/data.csv"
        loading={false}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows next button when preview is available', () => {
    const preview: DataPreview = {
      headers: ['col'],
      rows: [{ col: 'val' }],
      totalRows: 1,
    };
    render(
      <DataImport
        preview={preview}
        filePath="/data.csv"
        loading={false}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    const nextButton = screen.getByText('次へ');
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
    expect(onNext).toHaveBeenCalled();
  });

  it('does not show next button when no preview', () => {
    render(
      <DataImport
        preview={null}
        filePath={null}
        loading={false}
        error={null}
        onSelectFile={onSelectFile}
        onNext={onNext}
      />,
    );
    expect(screen.queryByText('次へ')).not.toBeInTheDocument();
  });
});
