import { test, expect } from '@playwright/test';

async function selectFixture(page: any, fixture: string) {
  await page.goto('/');
  const button = page.getByRole('button', { name: fixture === 'author' ? 'Local Author' : 'Local Publisher' });
  await expect(button).toHaveCount(1);
  await button.click();
  await expect(page.getByText(/Active identity:/)).toBeVisible();
}

async function openEditor(page: any) {
  await page.goto('/announcement');
  await expect(page.getByRole('heading', { name: 'Announcements' }).first()).toBeVisible();
  const enter = page.getByRole('button', { name: 'Enter Edit Mode' });
  await expect(enter).toHaveCount(1);
  await enter.click({ force: true });
  await expect(page.getByRole('region', { name: 'Announcement editor' })).toBeVisible();
}

test.describe.serial('Announcement authoring', () => {
  test('Guest sees published content without edit controls', async ({ page }) => {
    await page.goto('/');
    const endSession = page.getByRole('button', { name: 'End local session' });
    if (await endSession.count()) {
      await endSession.click();
      await expect(page.getByRole('button', { name: 'End local session' })).toHaveCount(0);
    }
    await page.goto('/announcement');
    await expect(page.getByRole('heading').filter({ hasText: 'Announcements' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter Edit Mode' })).toHaveCount(0);
  });

  test('Author saves and previews a draft but cannot publish', async ({ page }) => {
    await selectFixture(page, 'author');
    await openEditor(page);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByText('Editing a new draft from the published content', { exact: true })).toBeVisible();
    const hero = page.getByRole('group', { name: 'Hero' });
    await hero.getByLabel('Title', { exact: true }).fill(`Announcements — Browser Draft ${Date.now()}`);
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText(/Draft saved as v/)).toBeVisible();
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByText('Draft preview', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  test('Validation rejects an incomplete training item', async ({ page }) => {
    await selectFixture(page, 'author');
    await openEditor(page);
    await page.getByRole('button', { name: 'Add training' }).click();
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByRole('alert')).toContainText('trainings');
  });

  test('Publisher publishes the saved draft and public view changes', async ({ page }) => {
    await selectFixture(page, 'publisher');
    await openEditor(page);
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText(/Published v/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: /Announcements — Browser Draft/ })).toBeVisible();
    await expect(page.getByText('Draft preview', { exact: true })).toHaveCount(0);
  });

  test('Version history exposes restore controls', async ({ page }) => {
    await selectFixture(page, 'publisher');
    await openEditor(page);
    const summary = page.getByText('Version history', { exact: true });
    await summary.click();
    const restore = page.getByRole('button', { name: 'Restore as draft' });
    await expect(restore.first()).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await restore.first().click();
    await expect(page.getByText(/Restored v\d+ as draft/)).toBeVisible();
  });
});
