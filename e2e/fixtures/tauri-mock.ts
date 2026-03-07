/**
 * Tauri IPC モック
 *
 * ブラウザ上で window.__TAURI_INTERNALS__ を差し替え、
 * invoke 呼び出しをインメモリストアで処理する。
 * Playwright の addInitScript で注入して使う。
 */
export function installTauriMock() {
  const templates: Record<string, unknown>[] = [];
  let callbackId = 0;
  let eventId = 0;

  // biome-ignore lint/suspicious/noExplicitAny: mock needs any for flexibility
  (window as any).__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args: Record<string, unknown> = {}) => {
      switch (cmd) {
        case 'plugin:event|listen':
          return ++eventId;

        case 'plugin:event|unlisten':
          return null;

        // ダイアログプラグイン
        case 'plugin:dialog|open':
          return '/mock/path/sample.csv';

        case 'plugin:dialog|save':
          return '/mock/path/output.csv';

        case 'plugin:dialog|confirm':
          return true;

        case 'plugin:dialog|ask':
          return true;

        case 'plugin:dialog|message':
          return null;
        case 'list_templates':
          return [...templates];

        case 'get_template': {
          const found = templates.find((t) => (t as Record<string, unknown>).id === args.id);
          if (!found) throw new Error(`Template not found: ${args.id}`);
          return found;
        }

        case 'save_template': {
          const t = args.template as Record<string, unknown>;
          const idx = templates.findIndex((x) => (x as Record<string, unknown>).id === t.id);
          if (idx >= 0) {
            templates[idx] = t;
          } else {
            templates.push(t);
          }
          return t;
        }

        case 'delete_template': {
          const delIdx = templates.findIndex((t) => (t as Record<string, unknown>).id === args.id);
          if (delIdx >= 0) templates.splice(delIdx, 1);
          return null;
        }

        case 'export_template':
          return null;

        case 'import_template':
          return {
            id: 'imported-1',
            name: 'インポート済みテンプレート',
            description: '',
            columns: [
              {
                name: 'col1',
                label: 'カラム1',
                dataType: 'Text',
                required: false,
                description: '',
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

        case 'read_file_preview':
          return {
            headers: ['name', 'age', 'email', 'city'],
            rows: [
              { name: 'Alice', age: '30', email: 'alice@example.com', city: 'Tokyo' },
              { name: 'Bob', age: '25', email: 'bob@example.com', city: 'Osaka' },
              { name: 'Charlie', age: '35', email: 'charlie@example.com', city: 'Nagoya' },
            ],
            totalRows: 5,
          };

        case 'read_file_full':
          return [
            ['name', 'age', 'email', 'city'],
            [
              { name: 'Alice', age: '30', email: 'alice@example.com', city: 'Tokyo' },
              { name: 'Bob', age: '25', email: 'bob@example.com', city: 'Osaka' },
              { name: 'Charlie', age: '35', email: 'charlie@example.com', city: 'Nagoya' },
              { name: 'Diana', age: '28', email: 'diana@example.com', city: 'Fukuoka' },
              { name: 'Eve', age: '32', email: 'eve@example.com', city: 'Sapporo' },
            ],
          ];

        case 'list_sheets':
          return [];

        case 'read_file_preview_sheet':
          return {
            headers: ['name', 'age'],
            rows: [{ name: 'Alice', age: '30' }],
            totalRows: 1,
          };

        case 'export_result':
          return null;

        case 'get_model_status':
          return { loaded: false, modelPath: null };

        case 'load_model':
          return null;

        case 'generate_transform_code':
          return 'function transform(rows) {\n  return rows.map(function(row) {\n    return { name: row.name, age: row.age };\n  });\n}';

        case 'check_code_safety':
          return { isSafe: true, violations: [] };

        case 'execute_transform':
          return JSON.stringify([
            { name: 'Alice', age: '30' },
            { name: 'Bob', age: '25' },
            { name: 'Charlie', age: '35' },
          ]);

        default:
          console.warn(`[tauri-mock] Unknown command: ${cmd}`);
          return null;
      }
    },

    transformCallback: (_callback: unknown, _once?: boolean) => {
      return ++callbackId;
    },

    convertFileSrc: (filePath: string) => filePath,
  };

  // biome-ignore lint/suspicious/noExplicitAny: Tauri detection flag
  (window as any).isTauri = true;
}
