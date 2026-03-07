import { createTemplate, expect, test } from './helpers';

test.describe('変換パイプライン - コードプレビュー', () => {
  test('テンプレート作成後にインポート画面でファイル未選択を確認', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, 'コードレビューテスト');

    // インポート画面が表示される
    await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();

    // ファイルが読み込まれていないので「次へ」は表示されない
    await expect(page.locator('button:has-text("次へ")')).not.toBeVisible();
  });
});
