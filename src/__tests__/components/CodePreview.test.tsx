import { CodePreview } from '@/components/transform/CodePreview';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('CodePreview', () => {
  const defaultProps = {
    code: 'function transform(rows) { return rows; }',
    safetyReport: null,
    error: null,
    onCodeChange: vi.fn(),
    onCheckSafety: vi.fn(),
    onExecute: vi.fn(),
    onRetryGenerate: vi.fn(),
    loading: false,
  };

  it('renders code in preview mode', () => {
    render(<CodePreview {...defaultProps} />);
    expect(screen.getByText('function transform(rows) { return rows; }')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<CodePreview {...defaultProps} />);
    expect(screen.getByText('再生成')).toBeInTheDocument();
    expect(screen.getByText('安全性チェック')).toBeInTheDocument();
    expect(screen.getByText('実行')).toBeInTheDocument();
    expect(screen.getByText('編集モード')).toBeInTheDocument();
  });

  it('switches to edit mode', () => {
    render(<CodePreview {...defaultProps} />);
    fireEvent.click(screen.getByText('編集モード'));
    expect(screen.getByText('表示モード')).toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<CodePreview {...defaultProps} error="コード生成に失敗しました" />);
    expect(screen.getByText('コード生成に失敗しました')).toBeInTheDocument();
  });

  it('shows safety badge when report is safe', () => {
    render(<CodePreview {...defaultProps} safetyReport={{ isSafe: true, violations: [] }} />);
    expect(screen.getByText('安全性チェック: 問題なし')).toBeInTheDocument();
  });

  it('shows violations when report is unsafe', () => {
    render(
      <CodePreview
        {...defaultProps}
        safetyReport={{
          isSafe: false,
          violations: ['eval() による動的コード実行'],
        }}
      />,
    );
    expect(screen.getByText('安全性チェック: 問題が検出されました')).toBeInTheDocument();
    expect(screen.getByText('eval() による動的コード実行')).toBeInTheDocument();
  });

  it('disables execute button when unsafe', () => {
    render(
      <CodePreview {...defaultProps} safetyReport={{ isSafe: false, violations: ['danger'] }} />,
    );
    const execButton = screen.getByText('実行').closest('button');
    expect(execButton).toBeDisabled();
  });

  it('shows loading state when generating', () => {
    render(<CodePreview {...defaultProps} code="" loading={true} />);
    expect(screen.getByText('コードを生成中...')).toBeInTheDocument();
  });

  it('calls onRetryGenerate when retry button clicked', () => {
    render(<CodePreview {...defaultProps} />);
    fireEvent.click(screen.getByText('再生成'));
    expect(defaultProps.onRetryGenerate).toHaveBeenCalled();
  });

  it('calls onCheckSafety when safety check clicked', () => {
    render(<CodePreview {...defaultProps} />);
    fireEvent.click(screen.getByText('安全性チェック'));
    expect(defaultProps.onCheckSafety).toHaveBeenCalled();
  });
});
