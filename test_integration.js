const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:8000');
  
  // wait for network to finish
  await new Promise(r => setTimeout(r, 2000));

  // click on workers view
  await page.evaluate(() => {
    app.switchView('workers');
  });

  await new Promise(r => setTimeout(r, 500));

  // check if any workers are there (it should be empty initially, or populated if we added via API)
  const workersCount = await page.evaluate(() => {
    return document.querySelectorAll('.worker-card').length;
  });
  console.log('Workers count:', workersCount);

  await browser.close();
})();
