import { createTemplate, expect, test } from './helpers';

async function setupImportScreen(page: import('@playwright/test').Page) {
  await createTemplate(page, 'インポートテスト');
  await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();
}

test.describe('データインポート', () => {
  test('テンプレート作成後にインポート画面が表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await setupImportScreen(page);

    await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();
    await expect(page.locator('text=ファイルを選択')).toBeVisible();
  });

  test('ファイル選択ボタンが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await setupImportScreen(page);

    // ファイル選択エリアが表示される
    await expect(page.locator('text=ファイルを選択 (CSV / Excel)')).toBeVisible();
  });

  test('テンプレート選択でもインポート画面に遷移する', async ({ tauriPage: page }) => {
    await page.goto('/');
    await setupImportScreen(page);

    // サイドバーのテンプレートをクリック
    const templateItem = page.locator('[data-testid="template-item"]').first();
    await templateItem.click();
    await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();
  });

  test('ファイル未選択時に「次へ」ボタンが表示されない', async ({ tauriPage: page }) => {
    await page.goto('/');
    await setupImportScreen(page);

    // プレビューがない場合は「次へ」ボタンは非表示
    await expect(page.locator('button:has-text("次へ")')).not.toBeVisible();
  });

  test('ステップインジケーターにデータ読み込みが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await setupImportScreen(page);

    // ヘッダーのステップインジケーターを確認
    const header = page.locator('header');
    await expect(header.locator('text=データ読み込み')).toBeVisible();
    await expect(header.locator('text=コードレビュー')).toBeVisible();
    await expect(header.locator('text=結果')).toBeVisible();
  });
});
