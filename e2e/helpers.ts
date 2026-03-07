import { type Page, test as base, expect } from '@playwright/test';
import { installTauriMock } from './fixtures/tauri-mock';

/**
 * Tauri モック付きのテストフィクスチャ。
 * 全 E2E テストでこの test を使う。
 */
export const test = base.extend<{ tauriPage: Page }>({
  tauriPage: async ({ page }, use) => {
    await page.addInitScript({ content: `(${installTauriMock.toString()})()` });
    await use(page);
  },
});

export { expect };

/** テンプレートを作成するヘルパー */
export async function createTemplate(
  page: Page,
  name: string,
  columnName = 'test_col',
  columnLabel = 'テスト',
) {
  await page.click('text=新規テンプレート');
  await page.fill('#template-name', name);
  const nameInput = page.locator('input[placeholder*="カラム名"]').first();
  await nameInput.fill(columnName);
  const labelInput = page.locator('input[placeholder*="ラベル"]').first();
  await labelInput.fill(columnLabel);
  await page.click('text=保存');
  // 保存後、テンプレートがサイドバーに表示されるまで待つ
  await expect(page.locator(`text=${name}`)).toBeVisible();
}
