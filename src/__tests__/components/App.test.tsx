import { App } from '@/App';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
