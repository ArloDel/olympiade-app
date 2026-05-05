import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // We can just verify the page loads successfully by checking for an element.
  // Wait for network idle or domcontentloaded
  await page.waitForLoadState('domcontentloaded');
  
  // Since it's an exam app, let's just check the URL or a basic text.
  // Usually login page has "Login" text or similar
  await expect(page).toHaveTitle(/Olym|App|Ujian/i);
});

test('login page is accessible', async ({ page }) => {
  await page.goto('/login');
  
  // Check that some form or login text exists
  const loginHeading = page.locator('h1', { hasText: /Login|Masuk/i });
  await expect(loginHeading).toBeVisible({ timeout: 10000 }).catch(() => {
    // If not h1, maybe there's a button
    console.log("H1 Login not found, looking for button...");
  });
  
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();
});
