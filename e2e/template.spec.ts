import { createTemplate, expect, test } from './helpers';

test.describe('テンプレート管理', () => {
  test('新規テンプレートを作成できる', async ({ tauriPage: page }) => {
    await page.goto('/');

    await page.click('text=新規テンプレート');
    await page.fill('#template-name', 'テスト用テンプレート');

    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('user_name');

    const labelInput = page.locator('input[placeholder*="ラベル"]').first();
    await labelInput.fill('ユーザー名');

    await page.click('text=保存');

    // サイドバーにテンプレートが表示される
    await expect(page.locator('text=テスト用テンプレート')).toBeVisible();
  });

  test('テンプレートを選択するとインポート画面に遷移する', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, '選択テスト');

    // テンプレートをクリック
    const templateItem = page.locator('[data-testid="template-item"]').first();
    await templateItem.click();
    await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();
  });

  test('テンプレートを編集できる', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, '編集テスト');

    // 編集ボタンをクリック（group-hover で非表示のため force: true）
    const templateItem = page.locator('[data-testid="template-item"]').first();
    await templateItem.hover();
    const editButton = templateItem.locator('[title="編集"]');
    await editButton.click({ force: true });
    await expect(page.getByRole('heading', { name: 'テンプレート編集' })).toBeVisible();
  });

  test('テンプレートを削除できる', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, '削除テスト用');
    await expect(page.locator('text=削除テスト用')).toBeVisible();

    // 削除ボタンをクリック（group-hover で非表示のため force: true）
    const templateItem = page.locator('[data-testid="template-item"]').first();
    await templateItem.hover();
    const deleteButton = templateItem.locator('[title="削除"]');
    await deleteButton.click({ force: true });

    // テンプレートが消える
    await expect(page.locator('text=削除テスト用')).not.toBeVisible();
  });

  test('複数のテンプレートを作成できる', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, 'テンプレートA', 'col_a', 'カラムA');

    // 保存後はインポート画面に遷移するので、再度新規作成
    await createTemplate(page, 'テンプレートB', 'col_b', 'カラムB');

    // 両方がサイドバーに表示される
    await expect(page.locator('text=テンプレートA')).toBeVisible();
    await expect(page.locator('text=テンプレートB')).toBeVisible();
  });

  test('テンプレート作成後にインポート画面に遷移する', async ({ tauriPage: page }) => {
    await page.goto('/');
    await createTemplate(page, '遷移テスト');

    // インポート画面のUI要素が表示される
    await expect(page.getByRole('heading', { name: 'データ読み込み' })).toBeVisible();
    await expect(page.locator('text=ファイルを選択')).toBeVisible();
  });

  test('テンプレートに説明を追加して作成できる', async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');

    await page.fill('#template-name', '説明付きテンプレート');
    await page.fill('#template-desc', 'これはテスト用の説明です');

    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('desc_col');
    const labelInput = page.locator('input[placeholder*="ラベル"]').first();
    await labelInput.fill('説明カラム');

    await page.click('text=保存');
    await expect(page.locator('text=説明付きテンプレート')).toBeVisible();
  });

  test('テンプレート作成時に複数カラムを定義できる', async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');

    await page.fill('#template-name', '複数カラムテンプレート');

    // 1つ目のカラム
    const firstNameInput = page.locator('input[placeholder*="カラム名"]').first();
    await firstNameInput.fill('first_name');
    const firstLabelInput = page.locator('input[placeholder*="ラベル"]').first();
    await firstLabelInput.fill('名前');

    // 2つ目のカラムを追加
    await page.click('text=カラム追加');
    const secondNameInput = page.locator('input[placeholder*="カラム名"]').last();
    await secondNameInput.fill('email');
    const secondLabelInput = page.locator('input[placeholder*="ラベル"]').last();
    await secondLabelInput.fill('メール');

    await page.click('text=保存');
    await expect(page.locator('text=複数カラムテンプレート')).toBeVisible();
  });
});
