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

  it('renders move up/down buttons for columns', () => {
    const template = {
      ...defaultTemplate,
      columns: [
        { name: 'col1', label: 'Label1', dataType: 'Text' as const, description: '' },
        { name: 'col2', label: 'Label2', dataType: 'Text' as const, description: '' },
      ],
    };
    render(<TemplateEditor template={template} onSave={onSave} onCancel={onCancel} />);
    const upButtons = screen.getAllByTitle('上へ移動');
    const downButtons = screen.getAllByTitle('下へ移動');
    expect(upButtons.length).toBe(2);
    expect(downButtons.length).toBe(2);
  });

  it('disables move up for first column and move down for last', () => {
    const template = {
      ...defaultTemplate,
      columns: [
        { name: 'col1', label: 'Label1', dataType: 'Text' as const, description: '' },
        { name: 'col2', label: 'Label2', dataType: 'Text' as const, description: '' },
      ],
    };
    render(<TemplateEditor template={template} onSave={onSave} onCancel={onCancel} />);
    const upButtons = screen.getAllByTitle('上へ移動');
    const downButtons = screen.getAllByTitle('下へ移動');
    expect(upButtons[0]).toBeDisabled();
    expect(upButtons[1]).not.toBeDisabled();
    expect(downButtons[0]).not.toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it('reorders columns when move down is clicked', () => {
    const template = {
      ...defaultTemplate,
      name: 'Test',
      columns: [
        { name: 'first', label: 'First', dataType: 'Text' as const, description: '' },
        { name: 'second', label: 'Second', dataType: 'Text' as const, description: '' },
      ],
    };
    render(<TemplateEditor template={template} onSave={onSave} onCancel={onCancel} />);

    const firstDownButton = screen.getAllByTitle('下へ移動')[0];
    if (!firstDownButton) throw new Error('down button not found');
    fireEvent.click(firstDownButton);

    // After moving first column down, the inputs should have swapped
    const nameInputs = screen.getAllByPlaceholderText('カラム名 (snake_case)');
    expect((nameInputs[0] as HTMLInputElement).value).toBe('second');
    expect((nameInputs[1] as HTMLInputElement).value).toBe('first');
  });
});
