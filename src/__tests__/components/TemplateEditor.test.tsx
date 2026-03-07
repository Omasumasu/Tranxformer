import { TemplateEditor } from '@/components/template/TemplateEditor';
import { createEmptyTemplate } from '@/lib/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('TemplateEditor', () => {
  const defaultTemplate = createEmptyTemplate();
  const onSave = vi.fn();
  const onCancel = vi.fn();

  it('renders template name and description inputs', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText('テンプレート名')).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('shows error when saving with empty name', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('保存'));
    expect(screen.getByText('テンプレート名を入力してください')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows error when column name is empty', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    const nameInput = screen.getByLabelText('テンプレート名');
    fireEvent.change(nameInput, { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('保存'));
    expect(screen.getByText('すべてのカラムの名前とラベルを入力してください')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('adds a column when add button clicked', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    const addButton = screen.getByText('カラム追加');
    fireEvent.click(addButton);
    const nameInputs = screen.getAllByPlaceholderText('カラム名 (snake_case)');
    expect(nameInputs.length).toBe(2);
  });

  it('renders column editor section', () => {
    render(<TemplateEditor template={defaultTemplate} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('カラム定義')).toBeInTheDocument();
    expect(screen.getByText('カラム追加')).toBeInTheDocument();
  });
});
