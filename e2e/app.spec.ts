import { expect, test } from './helpers';

test.describe('アプリ初期表示', () => {
  test('アプリが正しく起動する', async ({ tauriPage: page }) => {
    await page.goto('/');

    // サイドバーのタイトルが表示される
    await expect(page.locator('text=Tranxformer')).toBeVisible();

    // 新規テンプレートボタンが表示される
    await expect(page.locator('text=新規テンプレート')).toBeVisible();

    // 設定ボタンが表示される
    await expect(page.locator('text=設定')).toBeVisible();

    // 初期メッセージが表示される
    await expect(page.locator('text=テンプレートを選択するか、新規作成してください')).toBeVisible();
  });

  test('ダッシュボードヘッダーが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });

  test('テンプレートインポートボタンが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('[title="テンプレートをインポート"]')).toBeVisible();
  });

  test('メインエリアに「テンプレートを作成」ボタンが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('text=テンプレートを作成')).toBeVisible();
  });

  test('サイドバーとメインコンテンツが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});
