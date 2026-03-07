import { expect, test } from './helpers';

test.describe('設定画面', () => {
  test.beforeEach(async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=設定');
    await expect(page.locator('text=モデル設定')).toBeVisible();
  });

  test('LLMモデルセクションが表示される', async ({ tauriPage: page }) => {
    await expect(page.locator('text=LLMモデル')).toBeVisible();
  });

  test('モデルステータスが「未ロード」で表示される', async ({ tauriPage: page }) => {
    await expect(page.locator('text=未ロード')).toBeVisible();
  });

  test('GGUFモデル選択ボタンが表示される', async ({ tauriPage: page }) => {
    await expect(page.locator('text=GGUFモデルを選択')).toBeVisible();
  });

  test('推奨モデル情報が表示される', async ({ tauriPage: page }) => {
    await expect(page.locator('text=推奨モデル')).toBeVisible();
    await expect(page.locator('text=Qwen2.5-Coder-7B')).toBeVisible();
  });

  test('閉じるボタンで設定画面を閉じる', async ({ tauriPage: page }) => {
    // モデル設定ヘッダー行の閉じるボタン（h2の親の親にあるbutton）
    const closeButton = page
      .locator('div:has(> div > h2:has-text("モデル設定"))')
      .first()
      .locator('> button');
    await closeButton.click();

    // ダッシュボードに戻る
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=モデル設定')).not.toBeVisible();
  });

  test('RAM推奨情報が表示される', async ({ tauriPage: page }) => {
    await expect(page.locator('text=最低8GB RAM')).toBeVisible();
  });
});
