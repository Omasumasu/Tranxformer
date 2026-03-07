import { expect, test } from '@playwright/test';

test.describe('テンプレート管理', () => {
  test('新規テンプレートを作成できる', async ({ page }) => {
    await page.goto('/');

    // 「新規テンプレート」ボタンをクリック
    await page.click('text=新規テンプレート');

    // テンプレート名を入力
    await page.fill('input[placeholder*="テンプレート名"]', 'テスト用テンプレート');

    // カラム名を入力
    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('user_name');

    // ラベルを入力
    const labelInput = page.locator('input[placeholder*="ラベル"]').first();
    await labelInput.fill('ユーザー名');

    // 保存ボタンをクリック
    await page.click('text=保存');

    // サイドバーにテンプレートが表示される
    await expect(page.locator('text=テスト用テンプレート')).toBeVisible();
  });

  test('テンプレートを選択するとインポート画面に遷移する', async ({ page }) => {
    await page.goto('/');

    // テンプレートがある前提（既存テンプレートをクリック）
    const templateItem = page.locator('[data-testid="template-item"]').first();
    if (await templateItem.isVisible()) {
      await templateItem.click();
      await expect(page.locator('text=データ読み込み')).toBeVisible();
    }
  });

  test('テンプレートを編集できる', async ({ page }) => {
    await page.goto('/');

    // 編集ボタンをクリック
    const editButton = page.locator('[title="編集"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('text=テンプレート編集')).toBeVisible();
    }
  });

  test('テンプレートを削除できる', async ({ page }) => {
    await page.goto('/');

    // 最初にテンプレートを作成
    await page.click('text=新規テンプレート');
    await page.fill('input[placeholder*="テンプレート名"]', '削除テスト用');
    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('test_col');
    await page.click('text=保存');

    // 削除ボタンをクリック
    const deleteButton = page.locator('[title="削除"]').first();
    await deleteButton.click();

    // テンプレートが消える
    await expect(page.locator('text=削除テスト用')).not.toBeVisible();
  });
});
