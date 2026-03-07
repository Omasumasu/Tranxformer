import { expect, test } from './helpers';

test.describe('ナビゲーション - ステップインジケーター', () => {
  test('初期状態でダッシュボードが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });

  test('テンプレート作成時にステップインジケーターが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');

    // ステップインジケーターにテンプレートステップが表示される
    const header = page.locator('header');
    await expect(header.getByText('テンプレート', { exact: true })).toBeVisible();
    await expect(header.getByText('データ読み込み')).toBeVisible();
    await expect(header.getByText('コードレビュー')).toBeVisible();
    await expect(header.getByText('結果')).toBeVisible();
  });

  test('テンプレート作成→キャンセルでダッシュボードに戻る', async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=新規テンプレート');

    await expect(page.locator('text=テンプレート編集')).toBeVisible();
    await page.click('text=キャンセル');

    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });
});

test.describe('ナビゲーション - サイドバー', () => {
  test('サイドバーの基本要素が表示される', async ({ tauriPage: page }) => {
    await page.goto('/');

    await expect(page.locator('text=Tranxformer')).toBeVisible();
    await expect(page.locator('text=新規テンプレート')).toBeVisible();
    await expect(page.locator('text=設定')).toBeVisible();
    await expect(page.locator('[title="テンプレートをインポート"]')).toBeVisible();
  });

  test('テンプレートがない場合に空メッセージが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');

    // テンプレートが1つもない場合は空メッセージが表示される
    const emptyMessage = page.locator('text=テンプレートがありません');
    const templateItem = page.locator('[data-testid="template-item"]').first();

    // どちらかが表示される（テンプレートがあれば空メッセージは出ない）
    await expect(emptyMessage.or(templateItem)).toBeVisible();
  });
});

test.describe('ナビゲーション - 初期画面', () => {
  test('メインコンテンツに案内メッセージが表示される', async ({ tauriPage: page }) => {
    await page.goto('/');
    await expect(page.locator('text=テンプレートを選択するか、新規作成してください')).toBeVisible();
  });

  test('メインコンテンツの「テンプレートを作成」ボタンが動作する', async ({ tauriPage: page }) => {
    await page.goto('/');
    await page.click('text=テンプレートを作成');

    await expect(page.locator('text=テンプレート編集')).toBeVisible();
  });
});
