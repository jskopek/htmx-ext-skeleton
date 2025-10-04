const { test, expect } = require('@playwright/test');

// Test server configuration
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const DELAY_MS = 500; // Artificial delay to ensure skeleton is visible

test.describe('htmx-ext-skeleton navigation tests', () => {
    // Server is managed by playwright.config.js webServer

    test('should show original content after clicking back button', async ({ page }) => {
        // Navigate to the initial page
        await page.goto(`${BASE_URL}/tests/fixtures/index.html`);

        // Verify we're on the initial page
        await expect(page.locator('#original-content')).toBeVisible();
        await expect(page.locator('#original-content')).toHaveText('This is the original content');

        // Click the load button to trigger htmx request
        await page.click('#load-button');

        // Wait for skeleton to appear
        await expect(page.locator('.skeleton-loading')).toBeVisible();
        await expect(page.locator('.skeleton-placeholder')).toBeVisible();

        // Wait for new content to load and skeleton to disappear
        await expect(page.locator('#loaded-content')).toBeVisible({ timeout: 2000 });
        await expect(page.locator('.skeleton-loading')).not.toBeVisible();

        // Verify new content is displayed
        await expect(page.locator('#loaded-content h2')).toHaveText('Loaded Content');

        // Click the browser back button
        await page.goBack();

        // CRITICAL TEST: Verify original content is shown WITHOUT skeleton
        await expect(page.locator('#original-content')).toBeVisible({ timeout: 2000 });
        await expect(page.locator('#original-content')).toHaveText('This is the original content');

        // Verify skeleton is NOT visible
        await expect(page.locator('.skeleton-loading')).not.toBeVisible();
        await expect(page.locator('.skeleton-placeholder')).not.toBeVisible();
    });

    test('should not show skeleton when navigating forward after back', async ({ page }) => {
        // Navigate to the initial page
        await page.goto(`${BASE_URL}/tests/fixtures/index.html`);

        // Click load button
        await page.click('#load-button');

        // Wait for new content to load
        await expect(page.locator('#loaded-content')).toBeVisible({ timeout: 2000 });

        // Go back
        await page.goBack();
        await expect(page.locator('#original-content')).toBeVisible();

        // Go forward
        await page.goForward();

        // Verify loaded content is shown WITHOUT skeleton
        await expect(page.locator('#loaded-content')).toBeVisible({ timeout: 2000 });
        await expect(page.locator('.skeleton-loading')).not.toBeVisible();
    });

    test('should show skeleton on fresh request but not on history navigation', async ({ page }) => {
        // Navigate to the initial page
        await page.goto(`${BASE_URL}/tests/fixtures/index.html`);

        // First request - skeleton should appear
        await page.click('#load-button');

        // Skeleton should be visible during loading
        const skeletonVisible = await page.locator('.skeleton-loading').isVisible();
        expect(skeletonVisible).toBe(true);

        // Wait for content to load
        await expect(page.locator('#loaded-content')).toBeVisible({ timeout: 2000 });

        // Go back (history navigation)
        await page.goBack();

        // Skeleton should NOT appear during history restore
        await expect(page.locator('#original-content')).toBeVisible();
        const skeletonAfterBack = await page.locator('.skeleton-loading').isVisible();
        expect(skeletonAfterBack).toBe(false);
    });

    test('should preserve original content in history cache without skeleton', async ({ page }) => {
        // Navigate to the initial page
        await page.goto(`${BASE_URL}/tests/fixtures/index.html`);

        // Verify initial state
        const originalHTML = await page.locator('#content').innerHTML();
        expect(originalHTML).toContain('original content');

        // Trigger load
        await page.click('#load-button');
        await expect(page.locator('#loaded-content')).toBeVisible({ timeout: 2000 });

        // Go back
        await page.goBack();

        // The cached content should match the original (no skeleton artifacts)
        const restoredHTML = await page.locator('#content').innerHTML();
        expect(restoredHTML).toContain('original content');
        expect(restoredHTML).not.toContain('skeleton-loading');
        expect(restoredHTML).not.toContain('skeleton-placeholder');
    });
});
