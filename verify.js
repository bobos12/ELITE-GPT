const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'app-screenshot.png' });
    const title = await page.title();
    const heading = await page.$eval('h1, h2, button, [role="heading"]', el => el?.textContent || 'found element').catch(() => 'no heading');
    console.log('Page title:', title);
    console.log('Page content sample:', heading);
    await browser.close();
    console.log('✅ App is running and responsive');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
