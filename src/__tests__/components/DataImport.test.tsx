import { DataImport } from '@/components/transform/DataImport';
import type { DataPreview } from '@/lib/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DataImport', () => {
  const onSelectFile = vi.fn();
  const onSelectSheet = vi.fn();
  const onNext = vi.fn();

  const defaultProps = {
    preview: null as DataPreview | null,
    filePath: null as string | null,
    sheets: [] as string[],
    selectedSheet: null as string | null,
    loading: false,
    error: null as string | null,
    onSelectFile,
    onSelectSheet,
    onNext,
  };

  it('renders file selection button', () => {
    render(<DataImport {...defaultProps} />);
    expect(screen.getByText('ファイルを選択 (CSV / Excel)')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataImport {...defaultProps} loading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<DataImport {...defaultProps} error="ファイルが読み込めません" />);
    expect(screen.getByText('ファイルが読み込めません')).toBeInTheDocument();
  });

  it('shows file path when loaded', () => {
    render(<DataImport {...defaultProps} filePath="/path/to/data.csv" />);
    expect(screen.getByText('ファイル: /path/to/data.csv')).toBeInTheDocument();
  });

  it('shows preview table when data is loaded', () => {
    const preview: DataPreview = {
      headers: ['name', 'age'],
      rows: [{ name: 'Alice', age: 30 }],
      totalRows: 1,
    };
    render(<DataImport {...defaultProps} preview={preview} filePath="/data.csv" />);
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
    render(<DataImport {...defaultProps} preview={preview} filePath="/data.csv" />);
    const nextButton = screen.getByText('次へ');
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);
    expect(onNext).toHaveBeenCalled();
  });

  it('does not show next button when no preview', () => {
    render(<DataImport {...defaultProps} />);
    expect(screen.queryByText('次へ')).not.toBeInTheDocument();
  });

  it('shows sheet selector when multiple sheets exist', () => {
    const preview: DataPreview = {
      headers: ['col'],
      rows: [{ col: 'val' }],
      totalRows: 1,
    };
    render(
      <DataImport
        {...defaultProps}
        preview={preview}
        filePath="/data.xlsx"
        sheets={['Sheet1', 'Sheet2', 'Sheet3']}
        selectedSheet="Sheet1"
      />,
    );
    expect(screen.getByLabelText('シート:')).toBeInTheDocument();
    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
    expect(screen.getByText('Sheet3')).toBeInTheDocument();
  });

  it('does not show sheet selector for single sheet', () => {
    const preview: DataPreview = {
      headers: ['col'],
      rows: [{ col: 'val' }],
      totalRows: 1,
    };
    render(
      <DataImport
        {...defaultProps}
        preview={preview}
        filePath="/data.xlsx"
        sheets={['Sheet1']}
        selectedSheet="Sheet1"
      />,
    );
    expect(screen.queryByLabelText('シート:')).not.toBeInTheDocument();
  });

  it('calls onSelectSheet when sheet is changed', () => {
    const preview: DataPreview = {
      headers: ['col'],
      rows: [{ col: 'val' }],
      totalRows: 1,
    };
    render(
      <DataImport
        {...defaultProps}
        preview={preview}
        filePath="/data.xlsx"
        sheets={['Sheet1', 'Sheet2']}
        selectedSheet="Sheet1"
      />,
    );
    fireEvent.change(screen.getByLabelText('シート:'), { target: { value: 'Sheet2' } });
    expect(onSelectSheet).toHaveBeenCalledWith('Sheet2');
  });
});
