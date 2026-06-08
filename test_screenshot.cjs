const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });
    
    try {
        await page.goto('http://localhost:5173/#code-canvas', { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait a second for animations
        await new Promise(r => setTimeout(r, 2000));
        
        // Click the Fractal Tree tab just to be sure
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const fractalBtn = btns.find(b => b.textContent.includes('Fractal Tree'));
            if (fractalBtn) fractalBtn.click();
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        // Take full page screenshot
        await page.screenshot({ path: 'local_screenshot.png', fullPage: true });
        console.log("Screenshot saved to local_screenshot.png");
        
    } catch (e) {
        console.log(`[SCRIPT ERROR] ${e.message}`);
    } finally {
        await browser.close();
    }
})();
