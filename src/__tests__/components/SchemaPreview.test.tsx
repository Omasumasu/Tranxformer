import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SchemaPreview } from '../../components/template/SchemaPreview';
import type { InferredColumn } from '../../lib/types';

const mockColumns: InferredColumn[] = [
  {
    name: 'user_name',
    label: 'User Name',
    dataType: 'Text',
    sampleValues: ['Alice', 'Bob'],
  },
  {
    name: 'age',
    label: 'Age',
    dataType: 'Number',
    sampleValues: ['25', '30'],
  },
  {
    name: 'active',
    label: 'Active',
    dataType: 'Boolean',
    sampleValues: ['true', 'false'],
  },
];

describe('SchemaPreview', () => {
  it('renders column names and inferred types', () => {
    render(
      <SchemaPreview
        columns={mockColumns}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('User Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('shows sample values', () => {
    render(
      <SchemaPreview
        columns={mockColumns}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <SchemaPreview
        columns={mockColumns}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        onTypeChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /作成/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <SchemaPreview
        columns={mockColumns}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        onTypeChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /キャンセル/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
