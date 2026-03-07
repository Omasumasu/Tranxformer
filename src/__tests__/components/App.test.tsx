import { App } from '@/App';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app shell with sidebar and header', () => {
    render(<App />);
    expect(screen.getByText('Tranxformer')).toBeInTheDocument();
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  it('renders new template button', () => {
    render(<App />);
    expect(screen.getByText('新規テンプレート')).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<App />);
    expect(screen.getByText('設定')).toBeInTheDocument();
  });
});
