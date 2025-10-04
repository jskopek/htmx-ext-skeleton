const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';

test('debug skeleton events', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto(`${BASE_URL}/tests/fixtures/index.html`);

    // Add event listeners in the page
    await page.evaluate(() => {
        window.events = [];
        document.body.addEventListener('htmx:beforeRequest', (e) => {
            console.log('beforeRequest - elt:', e.detail.elt?.id, 'target:', e.detail.target?.id);
            window.events.push('beforeRequest');
        });
        document.body.addEventListener('htmx:beforeSwap', (e) => {
            console.log('beforeSwap - elt:', e.detail.elt?.id, 'target:', e.detail.target?.id);
            console.log('beforeSwap - target classList:', e.detail.target?.classList?.toString());
            window.events.push('beforeSwap');
        });
        document.body.addEventListener('htmx:afterSwap', (e) => {
            console.log('afterSwap - elt:', e.detail.elt?.id, 'target:', e.detail.target?.id);
            window.events.push('afterSwap');
        });
    });

    await page.click('#load-button');
    await page.waitForTimeout(1000);

    const events = await page.evaluate(() => window.events);
    console.log('Events fired:', events);

    const hasSkeletonClass = await page.locator('#content').evaluate(el => el.classList.contains('skeleton-loading'));
    console.log('Has skeleton-loading class:', hasSkeletonClass);
});
