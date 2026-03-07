import { TemplateList } from '@/components/template/TemplateList';
import type { Template } from '@/lib/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('TemplateList', () => {
  const templates: Template[] = [
    {
      id: 't1',
      name: '顧客リスト',
      description: '',
      columns: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 't2',
      name: '商品マスタ',
      description: '',
      columns: [],
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const onSelect = vi.fn();
  const onDelete = vi.fn();
  const onEdit = vi.fn();
  const onExport = vi.fn();

  it('shows empty message when no templates', () => {
    render(
      <TemplateList
        templates={[]}
        selectedId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onEdit={onEdit}
        onExport={onExport}
      />,
    );
    expect(screen.getByText('テンプレートがありません')).toBeInTheDocument();
  });

  it('renders template names', () => {
    render(
      <TemplateList
        templates={templates}
        selectedId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onEdit={onEdit}
        onExport={onExport}
      />,
    );
    expect(screen.getByText('顧客リスト')).toBeInTheDocument();
    expect(screen.getByText('商品マスタ')).toBeInTheDocument();
  });

  it('calls onSelect when template clicked', () => {
    render(
      <TemplateList
        templates={templates}
        selectedId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onEdit={onEdit}
        onExport={onExport}
      />,
    );
    fireEvent.click(screen.getByText('顧客リスト'));
    expect(onSelect).toHaveBeenCalledWith(templates[0]);
  });

  it('has edit, export, and delete buttons', () => {
    render(
      <TemplateList
        templates={templates}
        selectedId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onEdit={onEdit}
        onExport={onExport}
      />,
    );
    expect(screen.getAllByTitle('編集')).toHaveLength(2);
    expect(screen.getAllByTitle('エクスポート')).toHaveLength(2);
    expect(screen.getAllByTitle('削除')).toHaveLength(2);
  });
});
