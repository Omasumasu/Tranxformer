import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

export function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>テンプレートを選択するか、新規作成してください</p>
          </div>
        </main>
      </div>
    </div>
  );
}
