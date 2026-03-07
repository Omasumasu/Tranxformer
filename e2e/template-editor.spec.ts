import { expect, test } from './helpers';

test.describe('テンプレートエディター - バリデーション', () => {
  test.beforeEach(async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');
    await expect(page.locator('text=テンプレート編集')).toBeVisible();
  });

  test('テンプレート名が空の場合にエラーが表示される', async ({ tauriPage: page }) => {
    // 名前を空のままにして保存
    const nameInput = page.locator('#template-name');
    await nameInput.fill('');
    await page.click('text=保存');

    await expect(page.locator('text=テンプレート名を入力してください')).toBeVisible();
  });

  test('カラムが1つの場合に削除ボタンが無効になる', async ({ tauriPage: page }) => {
    // 初期状態でカラムが1つだけなので削除ボタンは無効
    const deleteButton = page.locator('[title="カラムを削除"]');
    await expect(deleteButton).toBeDisabled();
  });

  test('カラムを追加して削除すると1つまで削除できる', async ({ tauriPage: page }) => {
    await page.fill('#template-name', 'テストテンプレート');

    // カラムを追加して2つにする
    await page.click('text=カラム追加');
    expect(await page.locator('[title="カラムを削除"]').count()).toBe(2);

    // 1つ削除（2→1になる）
    await page.locator('[title="カラムを削除"]').first().click();

    // 残り1つなので削除ボタンは無効
    await expect(page.locator('[title="カラムを削除"]')).toBeDisabled();
  });

  test('カラム名が空の場合にエラーが表示される', async ({ tauriPage: page }) => {
    await page.fill('#template-name', 'テストテンプレート');

    // カラム名を空にしてラベルだけ入力
    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('');
    const labelInput = page.locator('input[placeholder*="ラベル"]').first();
    await labelInput.fill('テストラベル');

    await page.click('text=保存');
    await expect(page.locator('text=すべてのカラムの名前とラベルを入力してください')).toBeVisible();
  });

  test('カラムラベルが空の場合にエラーが表示される', async ({ tauriPage: page }) => {
    await page.fill('#template-name', 'テストテンプレート');

    const nameInput = page.locator('input[placeholder*="カラム名"]').first();
    await nameInput.fill('test_column');
    const labelInput = page.locator('input[placeholder*="ラベル"]').first();
    await labelInput.fill('');

    await page.click('text=保存');
    await expect(page.locator('text=すべてのカラムの名前とラベルを入力してください')).toBeVisible();
  });

  test('キャンセルボタンでエディターを閉じる', async ({ tauriPage: page }) => {
    await page.click('text=キャンセル');

    // ダッシュボードに戻る
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=テンプレート編集')).not.toBeVisible();
  });

  test('説明フィールドに入力できる', async ({ tauriPage: page }) => {
    const descInput = page.locator('#template-desc');
    await descInput.fill('テスト用の説明文です');
    await expect(descInput).toHaveValue('テスト用の説明文です');
  });

  test('テンプレート名の入力と反映を確認する', async ({ tauriPage: page }) => {
    const nameInput = page.locator('#template-name');
    await nameInput.fill('新しいテンプレート名');
    await expect(nameInput).toHaveValue('新しいテンプレート名');
  });
});

test.describe('テンプレートエディター - カラム操作', () => {
  test.beforeEach(async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');
    await expect(page.locator('text=テンプレート編集')).toBeVisible();
  });

  test('カラムを追加できる', async ({ tauriPage: page }) => {
    const initialColumns = await page.locator('input[placeholder*="カラム名"]').count();

    await page.click('text=カラム追加');

    const afterColumns = await page.locator('input[placeholder*="カラム名"]').count();
    expect(afterColumns).toBe(initialColumns + 1);
  });

  test('複数カラムを追加できる', async ({ tauriPage: page }) => {
    await page.click('text=カラム追加');
    await page.click('text=カラム追加');

    const columns = await page.locator('input[placeholder*="カラム名"]').count();
    // 初期1 + 追加2 = 3
    expect(columns).toBeGreaterThanOrEqual(3);
  });

  test('カラムのデータ型を変更できる', async ({ tauriPage: page }) => {
    const typeSelect = page.locator('select[aria-label*="データ型"]').first();
    await expect(typeSelect).toBeVisible();

    // 数値に変更
    await typeSelect.selectOption('Number');
    await expect(typeSelect).toHaveValue('Number');

    // 日付に変更
    await typeSelect.selectOption('Date');
    await expect(typeSelect).toHaveValue('Date');

    // 真偽値に変更
    await typeSelect.selectOption('Boolean');
    await expect(typeSelect).toHaveValue('Boolean');

    // テキストに戻す
    await typeSelect.selectOption('Text');
    await expect(typeSelect).toHaveValue('Text');
  });

  test('カラムの説明を入力できる', async ({ tauriPage: page }) => {
    const descInput = page.locator('input[placeholder*="説明"]').first();
    await descInput.fill('LLMへのヒント情報');
    await expect(descInput).toHaveValue('LLMへのヒント情報');
  });

  test('カラムの必須チェックボックスを切り替えできる', async ({ tauriPage: page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();

    // 初期状態を確認して切り替え
    const initialState = await checkbox.isChecked();
    await checkbox.click();
    expect(await checkbox.isChecked()).toBe(!initialState);
  });

  test('カラム追加後に上下移動ボタンが適切に制御される', async ({ tauriPage: page }) => {
    // 2つ目のカラムを追加
    await page.click('text=カラム追加');

    // 1つ目のカラムの「上へ移動」は無効
    const moveUpButtons = page.locator('[title="上へ移動"]');
    await expect(moveUpButtons.first()).toBeDisabled();

    // 最後のカラムの「下へ移動」は無効
    const moveDownButtons = page.locator('[title="下へ移動"]');
    await expect(moveDownButtons.last()).toBeDisabled();

    // 1つ目のカラムの「下へ移動」は有効
    await expect(moveDownButtons.first()).toBeEnabled();

    // 2つ目のカラムの「上へ移動」は有効
    await expect(moveUpButtons.last()).toBeEnabled();
  });

  test('カラムの順序を入れ替えできる', async ({ tauriPage: page }) => {
    // 1つ目のカラムに名前を入力
    const firstNameInput = page.locator('input[placeholder*="カラム名"]').first();
    await firstNameInput.fill('first_column');

    // 2つ目のカラムを追加して名前を入力
    await page.click('text=カラム追加');
    const secondNameInput = page.locator('input[placeholder*="カラム名"]').last();
    await secondNameInput.fill('second_column');

    // 1つ目を下に移動
    const moveDownButton = page.locator('[title="下へ移動"]').first();
    await moveDownButton.click();

    // 順序が入れ替わったことを確認
    const firstAfterMove = page.locator('input[placeholder*="カラム名"]').first();
    await expect(firstAfterMove).toHaveValue('second_column');
  });
});
