import { test, expect } from '@playwright/test';

test.describe('Exam Proctoring System', () => {
  test('should detect tab switch and show warning modal', async ({ page }) => {
    // 1. Mock Next-Auth Session (Simulate logged in student)
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Student Test', email: 'student@test.com', role: 'STUDENT', id: 'student-1' },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
        })
      });
    });

    // 2. Mock Start Exam API
    await page.route('**/api/exams/test-exam/start', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // 3. Mock Questions API
    await page.route('**/api/questions?examId=test-exam', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'q1',
              text: 'Apa ibu kota Indonesia?',
              options: [
                { id: 'o1', text: 'Jakarta' },
                { id: 'o2', text: 'Bandung' }
              ]
            }
          ]
        })
      });
    });

    // 4. Mock Proctoring API to return warning data
    let proctoringCalled = false;
    await page.route('**/api/proctoring', async route => {
      proctoringCalled = true;
      const requestBody = JSON.parse(route.request().postData() || '{}');
      
      // Check if it's sending TAB_SWITCH event
      expect(requestBody.eventType).toBe('TAB_SWITCH');
      expect(requestBody.examId).toBe('test-exam');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { warnings: 1, isLocked: false }
        })
      });
    });

    // Mock camera permission (allow camera automatically)
    await page.context().grantPermissions(['camera']);

    // Mock navigator.mediaDevices.getUserMedia so it doesn't fail when there's no real camera
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = async () => {
        // Create a fake stream using a canvas
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, 640, 480);
        }
        return canvas.captureStream(30);
      };
    });

    // 5. Navigate to the exam page
    await page.goto('/exam/test-exam');

    // Wait for the question to render (meaning it finished loading)
    await expect(page.locator('text=Apa ibu kota Indonesia?')).toBeVisible();

    // 6. Simulate Tab Switch (visibilitychange)
    // We override document.hidden to return true, then dispatch the event
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // 7. Verify the Warning Modal appears
    const warningHeading = page.locator('h3', { hasText: 'Pelanggaran Terdeteksi!' });
    await expect(warningHeading).toBeVisible();
    
    // Verify warning count is displayed
    await expect(page.locator('text=Peringatan ke-1 dari 3')).toBeVisible();
    
    // Verify proctoring API was indeed called
    expect(proctoringCalled).toBe(true);
  });
});
