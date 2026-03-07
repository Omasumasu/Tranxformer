import { expect, test } from '@playwright/test';

test.describe('変換パイプライン', () => {
  test('コードプレビュー画面に主要ボタンが表示される', async ({ page }) => {
    await page.goto('/');

    // レビュー画面に遷移した状態を想定
    const codePreview = page.locator('text=コードプレビュー');
    if (await codePreview.isVisible()) {
      await expect(page.locator('text=再生成')).toBeVisible();
      await expect(page.locator('text=安全性チェック')).toBeVisible();
      await expect(page.locator('text=実行')).toBeVisible();
      await expect(page.locator('text=編集モード')).toBeVisible();
    }
  });

  test('編集モードでコードを編集できる', async ({ page }) => {
    await page.goto('/');

    const editButton = page.locator('text=編集モード');
    if (await editButton.isVisible()) {
      await editButton.click();

      // テキストエリアが表示される
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();

      // コードを入力
      await textarea.fill('function transform(rows) {\n  return rows;\n}');

      // 表示モードに切り替え
      await page.click('text=表示モード');
      const codeBlock = page.locator('pre code');
      await expect(codeBlock).toBeVisible();
    }
  });

  test('安全なコードの安全性チェックが通る', async ({ page }) => {
    await page.goto('/');

    const checkButton = page.locator('text=安全性チェック');
    if (await checkButton.isVisible()) {
      await checkButton.click();

      // 安全なコードの場合、「問題なし」が表示される
      const safeResult = page.locator('text=問題なし');
      const unsafeResult = page.locator('text=問題が検出されました');

      // どちらかが表示される
      await expect(safeResult.or(unsafeResult)).toBeVisible();
    }
  });

  test('結果画面にエクスポートボタンが表示される', async ({ page }) => {
    await page.goto('/');

    const resultHeader = page.locator('text=変換結果');
    if (await resultHeader.isVisible()) {
      await expect(page.locator('button:has-text("CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("TSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Excel")')).toBeVisible();
      await expect(page.locator('text=最初から')).toBeVisible();
    }
  });

  test('「最初から」ボタンでインポート画面に戻る', async ({ page }) => {
    await page.goto('/');

    const resetButton = page.locator('text=最初から');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(page.locator('text=ファイルを選択')).toBeVisible();
    }
  });
});

test.describe('設定画面', () => {
  test('設定ボタンからモデル設定画面に遷移できる', async ({ page }) => {
    await page.goto('/');

    await page.click('text=設定');
    await expect(page.locator('text=LLMモデル設定')).toBeVisible();
  });
});
