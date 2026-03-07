import { MappingView } from '@/components/transform/MappingView';
import type { Template } from '@/lib/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MappingView', () => {
  const template: Template = {
    id: 't1',
    name: 'テスト',
    description: '',
    columns: [
      { name: 'full_name', label: '氏名', dataType: 'Text', description: '' },
      { name: 'email', label: 'メール', dataType: 'Text', description: '' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('renders input headers', () => {
    render(<MappingView inputHeaders={['first_name', 'last_name']} template={template} />);
    expect(screen.getByText('first_name')).toBeInTheDocument();
    expect(screen.getByText('last_name')).toBeInTheDocument();
  });

  it('renders output columns from template', () => {
    render(<MappingView inputHeaders={['a']} template={template} />);
    expect(screen.getByText('氏名')).toBeInTheDocument();
    expect(screen.getByText('メール')).toBeInTheDocument();
  });

  it('shows template name in output section', () => {
    render(<MappingView inputHeaders={['a']} template={template} />);
    expect(screen.getByText(`出力カラム (${template.name})`)).toBeInTheDocument();
  });

  it('renders mapping overview heading', () => {
    render(<MappingView inputHeaders={['a']} template={template} />);
    expect(screen.getByText('マッピング概要')).toBeInTheDocument();
  });
});
