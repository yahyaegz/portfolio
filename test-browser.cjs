const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[BROWSER ERROR] ${msg.text()}`);
        } else if (msg.type() === 'warning') {
            console.log(`[BROWSER WARN] ${msg.text()}`);
        }
    });
    
    // Capture unhandled exceptions
    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    try {
        await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log("Page loaded successfully.");
        
        // Wait a little bit for any React errors to bubble up
        await new Promise(r => setTimeout(r, 2000));
        
        // Scroll down to CodeCanvas to trigger intersection observers
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 5);
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (e) {
        console.log(`[SCRIPT ERROR] ${e.message}`);
    } finally {
        await browser.close();
    }
})();
