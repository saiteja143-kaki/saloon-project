const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:8000');
  
  // click on workers view
  await page.evaluate(() => {
    app.switchView('workers');
  });

  // wait for grid
  await page.waitForSelector('#workers-grid');

  // get the first card's net amount before
  const beforeNet = await page.evaluate(() => {
    const card = document.querySelector('.worker-card');
    return card.querySelector('.card-net-val').textContent;
  });
  console.log('Before selecting date:', beforeNet);

  // change date
  await page.evaluate(() => {
    const card = document.querySelector('.worker-card');
    const input = card.querySelector('.card-date-picker');
    input.value = '2026-02-22';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // wait a bit
  await new Promise(r => setTimeout(r, 100));

  // get the first card's net amount after
  const afterNet = await page.evaluate(() => {
    const card = document.querySelector('.worker-card');
    return card.querySelector('.card-net-val').textContent;
  });
  console.log('After selecting date:', afterNet);

  await browser.close();
})();
