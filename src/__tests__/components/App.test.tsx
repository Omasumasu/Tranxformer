import { App } from '@/App';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Tauri APIのモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('App', () => {
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

  it('renders placeholder message when no template selected', () => {
    render(<App />);
    expect(screen.getByText('テンプレートを選択するか、新規作成してください')).toBeInTheDocument();
  });
});
