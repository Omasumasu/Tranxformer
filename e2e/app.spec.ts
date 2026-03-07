import { expect, test } from '@playwright/test';

test.describe('アプリ初期表示', () => {
  test('アプリが正しく起動する', async ({ page }) => {
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

  test('ダッシュボードヘッダーが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });

  test('テンプレートインポートボタンが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[title="テンプレートをインポート"]')).toBeVisible();
  });
});
