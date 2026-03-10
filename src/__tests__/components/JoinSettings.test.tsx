import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JoinSettings } from '../../components/transform/JoinSettings';
import type { ImportedFile } from '../../lib/types';

// Mock tauri commands
vi.mock('../../lib/tauri-commands', () => ({
  joinPreview: vi.fn(),
  inferJoinKeys: vi.fn(),
}));

const baseFile: ImportedFile = {
  path: '/a.csv',
  role: 'Base',
  label: 'customers.csv',
  headers: ['id', 'name', 'email'],
  totalRows: 100,
};

const joinFile: ImportedFile = {
  path: '/b.csv',
  role: 'Join',
  label: 'orders.csv',
  headers: ['order_id', 'customer_id', 'amount'],
  totalRows: 500,
};

describe('JoinSettings', () => {
  it('renders file info for both tables', () => {
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={false}
        onJoinConfigured={vi.fn()}
        onBack={vi.fn()}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    expect(screen.getByText('customers.csv')).toBeInTheDocument();
    expect(screen.getByText('orders.csv')).toBeInTheDocument();
  });

  it('shows mode toggle', () => {
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={true}
        onJoinConfigured={vi.fn()}
        onBack={vi.fn()}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    expect(screen.getByText('手動入力')).toBeInTheDocument();
    expect(screen.getByText('LLM自動推論')).toBeInTheDocument();
  });

  it('disables LLM mode when not available', () => {
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={false}
        onJoinConfigured={vi.fn()}
        onBack={vi.fn()}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    const llmButton = screen.getByText('LLM自動推論');
    expect(llmButton).toBeDisabled();
  });

  it('shows expression inputs', () => {
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={false}
        onJoinConfigured={vi.fn()}
        onBack={vi.fn()}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('基準テーブルのキー式')).toBeInTheDocument();
    expect(screen.getByLabelText('結合テーブルのキー式')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={false}
        onJoinConfigured={vi.fn()}
        onBack={onBack}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('戻る'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows available columns as hints', () => {
    render(
      <JoinSettings
        baseFile={baseFile}
        joinFile={joinFile}
        llmAvailable={false}
        onJoinConfigured={vi.fn()}
        onBack={vi.fn()}
        onSaveInputTemplate={vi.fn()}
      />,
    );
    expect(screen.getByText(/id, name, email/)).toBeInTheDocument();
    expect(screen.getByText(/order_id, customer_id, amount/)).toBeInTheDocument();
  });
});
