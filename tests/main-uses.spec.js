const { test, expect } = require('@playwright/test');

test.describe('Main Use Cases - Core Functionality Tests', () => {

  // ==========================================
  // VIEW AND SEARCH PETS
  // ==========================================

  test('View all pets and search by name and type', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Verify pets are displayed
    const petCards = await page.locator('.pet-card').count();
    expect(petCards).toBeGreaterThanOrEqual(4);

    // Search by name
    await page.fill('input[name="search"]', 'Max');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Max');

    // Filter by type
    await page.fill('input[name="search"]', '');
    await page.selectOption('select[name="type"]', 'Dog');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const dogResults = await page.locator('.pet-card').count();
    expect(dogResults).toBeGreaterThanOrEqual(1);

    // Combine search and filter
    await page.fill('input[name="search"]', 'Charlie');
    await page.selectOption('select[name="type"]', 'Dog');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const combinedText = await page.textContent('body');
    expect(combinedText).toContain('Charlie');
  });

  // ==========================================
  // VIEW PET DETAILS
  // ==========================================

  test('View pet details including owner contact email', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click on first pet
    await page.click('.pet-card a[href*="pet-details"]');
    await page.waitForTimeout(2000);

    // Verify pet details are displayed
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Type:');
    expect(bodyText).toContain('Age:');
    expect(bodyText).toContain('Contact:');
    expect(bodyText).toContain('@');
  });

  // ==========================================
  // USER REGISTRATION
  // ==========================================

  test('Register new user account', async ({ page }) => {
    const timestamp = Date.now();

    await page.goto('/register.html');

    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="email"]', `testuser${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const loginText = await page.textContent('body');
    expect(loginText).toContain('Login');
  });

  // ==========================================
  // USER LOGIN
  // ==========================================

  test('Login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login.html');

    // Fill login form with default admin credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    // Submit form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Verify we're logged in
    const welcomeText = await page.textContent('body');
    expect(welcomeText).toContain('Pets');
  });

  // ==========================================
  // USER LOGOUT
  // ==========================================

  test('Logout from active session', async ({ page }) => {
    // Login first
    await page.goto('/login.html');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 5000 });

    // Wait for navbar to update
    await page.waitForTimeout(2000);

    // Click logout
    await page.click('#logout-link');
    await page.waitForTimeout(2000);

    // Verify navbar shows Login
    const navbarText = await page.textContent('.navbar');
    expect(navbarText).toContain('Login');
  });

  // ==========================================
  // ADD NEW PET (Authenticated User)
  // ==========================================

  test('Add new pet listing as authenticated user', async ({ page }) => {
    const timestamp = Date.now();

    // First, login
    await page.goto('/login.html');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to add pet page
    await page.goto('/add-pet.html');

    // Verify we can access the page (authenticated)
    await expect(page.locator('h2')).toContainText('Add');

    // Fill add pet form
    await page.fill('input[name="name"]', `TestPet${timestamp}`);
    await page.selectOption('select[name="type"]', 'Dog');
    await page.fill('input[name="age"]', '3');
    await page.fill('input[name="image_url"]', 'https://example.com/pet.jpg');
    await page.fill('textarea[name="description"]', 'A lovely test pet for adoption');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for pet to be added
    await page.waitForTimeout(2000);

    // Verify pet appears in the list
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Search for the newly added pet
    await page.fill('input[name="search"]', `TestPet${timestamp}`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Should find the new pet
    const petNames = await page.locator('.pet-card h3').allTextContents();
    const hasNewPet = petNames.some(name => name.includes(`TestPet${timestamp}`));
    expect(hasNewPet).toBe(true);
  });

});
