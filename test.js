const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    await page.waitForSelector('button.btn.btn-primary.btn-lg'); // Wait for login button
    
    // Click the first quick fill button (Admin Kyuho)
    const hintsToggle = await page.$x("//button[contains(., '데모 계정 보기')]");
    if (hintsToggle.length > 0) {
      await hintsToggle[0].click();
      await page.waitForTimeout(500);
    }
    
    const autoFills = await page.$x("//span[contains(text(), '자동 입력')]");
    if (autoFills.length > 0) {
      await autoFills[0].click();
      await page.waitForTimeout(500);
    }
    
    await page.click('button.btn.btn-primary.btn-lg');
    await page.waitForTimeout(2000);
    
    const errorText = await page.evaluate(() => {
      const el = document.getElementById('global-error-log');
      return el ? el.innerText : 'No error log found in DOM';
    });
    console.log('ERROR CAPTURED:', errorText);
    
    await browser.close();
  } catch (e) {
    console.error('SCRIPT ERROR:', e);
  }
})();
