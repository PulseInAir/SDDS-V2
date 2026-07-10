const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

// Ensure the URL is valid and internal
function isInternalUrl(url) {
  try {
    const parsed = new URL(url, BASE_URL);
    return parsed.origin === BASE_URL;
  } catch (e) {
    return false;
  }
}

function cleanUrl(url) {
  try {
    const parsed = new URL(url, BASE_URL);
    // Ignore hash and specific query params if needed, but for now just keep path
    return parsed.pathname;
  } catch (e) {
    return url;
  }
}

async function run() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: false }); // Open browser so user can log in
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log(`Navigating to ${BASE_URL}/login...`);
  await page.goto(`${BASE_URL}/login`);

  console.log('Attempting to log in automatically...');
  
  try {
    // Check if we are on the login page by looking for the email input
    const emailInput = await page.$('input#email');
    if (emailInput) {
      await page.type('input#email', 'singledigitdatasolutions@gmail.com');
      await page.type('input#password', 'New*2026');
      
      // Click submit and wait for navigation
      await Promise.all([
        page.waitForNavigation({ timeout: 60000, waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]')
      ]);
      console.log('Login successful.');
    } else {
      console.log('Already logged in or login form not found.');
    }
  } catch (e) {
    console.log('Error during login process:', e.message);
  }

  // Wait a bit to let the user settle or ensure dashboard is loaded
  await new Promise(r => setTimeout(r, 5000));

  const visited = new Set();
  const queue = [
    '/',
    '/clients',
    '/invoices',
    '/notices',
    '/settings',
    '/documents',
    '/filing-queue',
    '/refunds',
    '/follow-up'
  ];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    if (visited.has(currentPath)) continue;
    visited.add(currentPath);

    const fullUrl = `${BASE_URL}${currentPath}`;
    console.log(`Visiting: ${fullUrl}`);

    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle2' });
    } catch (err) {
      console.error(`Failed to visit ${fullUrl}:`, err.message);
      continue;
    }

    // Wait for dynamic content
    await new Promise(r => setTimeout(r, 2000));

    // Blur client credentials
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        /* Blur common elements that might contain sensitive data */
        td, 
        input[type="text"], 
        input[type="email"], 
        input[type="tel"], 
        textarea,
        [data-sensitive="true"],
        .client-name, 
        .client-email,
        .client-phone,
        .credential,
        .pan-number,
        .aadhar-number {
          filter: blur(5px) !important;
          opacity: 0.8 !important;
          user-select: none !important;
        }
        
        /* Exclude headers from blurring in tables */
        th {
          filter: none !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Take screenshot
    const safeName = currentPath === '/' ? 'dashboard' : currentPath.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${safeName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Extract links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href && href.startsWith(window.location.origin));
    });

    for (const link of links) {
      const pathOnly = cleanUrl(link);
      if (!visited.has(pathOnly) && !queue.includes(pathOnly)) {
        // Exclude some routes if necessary, e.g. logout
        if (!pathOnly.includes('logout') && !pathOnly.includes('login')) {
          queue.push(pathOnly);
        }
      }
    }
  }

  console.log('Crawling completed. Closing browser...');
  await browser.close();
}

run().catch(console.error);
