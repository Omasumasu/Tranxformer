import { ResultView } from '@/components/transform/ResultView';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ResultView', () => {
  const onExport = vi.fn();
  const onReset = vi.fn();

  const sampleData = [
    { name: 'Alice', age: '30' },
    { name: 'Bob', age: '25' },
  ];

  it('shows empty state when no data', () => {
    render(<ResultView data={[]} onExport={onExport} onReset={onReset} />);
    expect(screen.getByText('変換結果がありません')).toBeInTheDocument();
  });

  it('shows result table with headers and data', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    expect(screen.getByText('変換結果 (2 行)')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders CSV, TSV, and Excel export buttons', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('TSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
  });

  it('calls onExport with Csv when CSV clicked', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    fireEvent.click(screen.getByText('CSV'));
    expect(onExport).toHaveBeenCalledWith('Csv');
  });

  it('calls onExport with Tsv when TSV clicked', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    fireEvent.click(screen.getByText('TSV'));
    expect(onExport).toHaveBeenCalledWith('Tsv');
  });

  it('calls onExport with Excel when Excel clicked', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    fireEvent.click(screen.getByText('Excel'));
    expect(onExport).toHaveBeenCalledWith('Excel');
  });

  it('calls onReset when reset button clicked', () => {
    render(<ResultView data={sampleData} onExport={onExport} onReset={onReset} />);
    fireEvent.click(screen.getByText('最初から'));
    expect(onReset).toHaveBeenCalled();
  });
});
