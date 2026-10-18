const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

// Run with NODE_PATH pointing to Playwright when it is not installed locally.
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const views = ['home', 'route', 'packing', 'landmarks', 'budget', 'memory', 'ai', 'more'];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Test without credentials or third-party network dependencies.
      await page.route(/^https?:\/\//, route => route.abort());
      await page.route('**/config.js*', route => route.fulfill({ contentType: 'application/javascript', body: 'window.TRIPWISE_CONFIG = {};' }));
      await page.route('**/splash.js*', route => route.fulfill({ contentType: 'application/javascript', body: 'document.getElementById("tripwise-splash").remove();' }));
      await page.goto(url);
      if (process.env.QA_DIR) {
        fs.mkdirSync(process.env.QA_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.QA_DIR, `home-${viewport.width}.png`) });
      }
      await page.locator('#next-stop-input').fill('沈阳');
      await page.locator('#next-stop-input').dispatchEvent('keydown', { key: 'Enter', isComposing: true });
      assert.equal(await page.locator('#tab-home').isVisible(), true, 'IME confirmation must not trigger departure');
      async function assertPlanningEntry(raw, useEnter = false) {
        await page.locator('.nav-btn[data-tab="home"]').click();
        await page.locator('#next-stop-input').fill(raw);
        if (useEnter) await page.locator('#next-stop-input').press('Enter');
        else await page.locator('#next-stop-go').click();
        assert.equal(await page.locator('#tab-route').isVisible(), true, 'departure must open route planning');
        assert.equal(await page.locator('#tab-home').isVisible(), false);
        assert.equal(await page.locator('#route-dest').inputValue(), '沈阳');
        assert.equal(await page.locator('.route-input-overlay').isVisible(), true);
        assert.equal(await page.locator('#route-result').isVisible(), false);
        assert.equal(await page.locator('.nav-btn[aria-current="page"]').getAttribute('data-tab'), 'route');
        assert.equal(new URL(page.url()).searchParams.get('view'), 'route');
      }
      await assertPlanningEntry('沈阳');
      if (process.env.QA_DIR) await page.screenshot({ path: path.join(process.env.QA_DIR, `departure-${viewport.width}.png`) });
      await page.selectOption('#route-dest', '北京');
      await assertPlanningEntry('  沈阳市  ', true);
      for (const view of views) {
        await page.locator(`.nav-btn[data-tab="${view}"]`).click();
        const state = await page.evaluate(() => ({
          visible: [...document.querySelectorAll('.tab-content')].filter(el => getComputedStyle(el).display !== 'none').map(el => el.id),
          current: document.querySelector('.nav-btn[aria-current="page"]')?.dataset.tab,
          header: document.querySelector('.header').getBoundingClientRect().bottom,
          top: document.querySelector('.tab-content.active').getBoundingClientRect().top,
          overflow: document.documentElement.scrollWidth > innerWidth
        }));
        assert.deepEqual(state.visible, [`tab-${view}`], `${viewport.width}px: only ${view} should be visible`);
        assert.equal(state.current, view);
        assert.ok(state.top >= state.header - 1, `${view} is obscured by header`);
        assert.equal(state.overflow, false, `${view} overflows horizontally`);
        if (process.env.QA_DIR && ['packing', 'route'].includes(view)) await page.screenshot({ path: path.join(process.env.QA_DIR, `${view}-${viewport.width}.png`) });
      }
      await page.locator('.nav-btn[data-tab="route"]').click();
      await page.selectOption('#route-dest', '北京');
      await page.locator('#route-gen-btn').click();
      await page.waitForFunction(() => document.querySelectorAll('#route-timeline .timeline-item').length > 0);
      assert.ok(await page.locator('.route-back-btn').isVisible());
      const result = await page.evaluate(() => ({
        top: document.getElementById('route-result').getBoundingClientRect().top,
        header: document.querySelector('.header').getBoundingClientRect().bottom,
        inputVisible: getComputedStyle(document.querySelector('.route-input-overlay')).display !== 'none'
      }));
      assert.ok(result.top >= result.header - 1, 'route result starts under header');
      assert.equal(result.inputVisible, false);
      if (process.env.QA_DIR) await page.screenshot({ path: path.join(process.env.QA_DIR, `result-${viewport.width}.png`) });
      await page.locator('#theme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      await page.waitForFunction(() => {
        const result = document.getElementById('route-result');
        const panel = document.querySelector('.route-map-panel');
        return getComputedStyle(result).backgroundColor !== 'rgb(255, 255, 255)' && getComputedStyle(panel).backgroundColor !== 'rgb(255, 255, 255)' &&
          [...document.querySelectorAll('.route-summary, .route-tips .tip-item')].every(el => getComputedStyle(el).backgroundColor !== 'rgb(255, 255, 255)');
      });
      if (process.env.QA_DIR) await page.screenshot({ path: path.join(process.env.QA_DIR, `result-dark-${viewport.width}.png`) });
      await page.locator('#theme-toggle').click();
      await assertPlanningEntry('沈阳');
      await page.selectOption('#route-dest', '北京');
      await page.locator('#route-gen-btn').click();
      await page.waitForFunction(() => document.querySelectorAll('#route-timeline .timeline-item').length > 0);
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await page.locator('.nav-btn[data-tab="packing"]').click();
      assert.equal(await page.locator('#tab-route').isVisible(), false);
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('#tab-route.active'));
      await page.locator('.route-back-btn').click();
      assert.equal(await page.locator('#route-result').isVisible(), false);
      assert.equal(await page.locator('#route-dest').inputValue(), '北京');
      assert.equal(await page.locator('.route-hint').evaluate(el => getComputedStyle(el).color), 'rgba(255, 255, 255, 0.9)');
      assert.equal(await page.locator('.route-input-group').evaluate(el => getComputedStyle(el).borderBottomWidth), '0px');
      await page.reload();
      assert.equal(await page.locator('#tab-route').isVisible(), true, 'deep link must survive reload');
      await page.evaluate(() => window.switchTab('weather'));
      assert.equal(await page.locator('.nav-btn[aria-current="page"]').getAttribute('data-tab'), 'more');
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('#tab-route.active'));
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('#tab-weather.active'));
      // Returning from a narrow layout must not leave the desktop header oversized.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForFunction(() => document.querySelector('.header').getBoundingClientRect().height < 90);
      // Use a fake provider response, never the user's local API key.
      await page.evaluate(() => {
        window.TRIPWISE_CONFIG = { provider: Object.keys(window.TripWiseData.AI_PROVIDERS)[0], apiKey: 'test-only' };
        window.switchTab('route');
      });
      await page.selectOption('#route-dest', '沈阳');
      let failRequest = false;
      await page.route(/^https?:\/\//, route => {
        if (route.request().method() !== 'POST') return route.abort();
        return route.fulfill({ status: failRequest ? 401 : 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: JSON.stringify([{ day: 1, time: '09:00', title: '沈阳故宫', desc: '测试行程', lat: 41.8, lng: 123.4 }]) } }] }) });
      });
      await page.locator('#route-gen-btn').click();
      await page.waitForFunction(() => !document.getElementById('route-gen-btn').disabled);
      assert.ok((await page.locator('#route-timeline').textContent()).includes('沈阳故宫'), await page.locator('#route-timeline').textContent());
      await page.locator('.route-back-btn').click();
      failRequest = true;
      await page.locator('#route-gen-btn').click();
      await page.waitForFunction(() => !document.getElementById('route-gen-btn').disabled);
      assert.ok((await page.locator('#route-timeline').textContent()).includes('生成失败'));
      assert.equal(await page.locator('#route-result').getAttribute('aria-busy'), 'false');
      assert.equal(await page.locator('.nav-btn[data-tab="budget"]').isEnabled(), true);
      assert.deepEqual(errors, []);
      console.log(`PASS ${viewport.width}x${viewport.height}: departure button/Enter, navigation, layout, offline/AI routes, errors, history, reload, resize, dark theme`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
