import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

// 🕵️ Enable stealth mode to avoid bot detection
puppeteer.use(StealthPlugin());

// ✅ Manually specify the full profile folder path
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 3'; // 👈 Adjust if needed

// ⏳ Wait until user is logged in
async function waitForLogin(page, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const isLoggedIn = await page.evaluate(() =>
        !!document.querySelector('a[href="/logout"]')
      );
      if (isLoggedIn) return true;
    } catch (err) {
      // Possible transient error if page is loading
    }
    process.stdout.write('.'); // Show progress
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

export async function scrapeInternshalaJobs(keywords) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    userDataDir: PROFILE_DIR, // ✅ Use your real Chrome profile
    args: [],
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages[0];

  // 1️⃣ Open Internshala
  await page.goto('https://internshala.com/', { waitUntil: 'domcontentloaded' });

  console.log('\n✅ Chrome launched with your real profile.');
  console.log('🌐 Internshala opened in browser.');
  console.log('⏳ Waiting for login... (you have 2 minutes)');

  const isLoggedIn = await waitForLogin(page);

  if (!isLoggedIn) {
    console.log('\n❌ Login timeout or failed. Please try again.');
    await browser.close();
    return;
  }

  console.log('\n✅ Login confirmed. Scraping jobs...');

  // 2️⃣ Navigate to job listing page
  await page.goto('https://internshala.com/internships', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000)); // simple wait to let things settle

  // 2.5️⃣ If keywords are provided, use the keyword search field
  if (keywords && keywords.length > 0) {
    // const searchQuery = keywords.join(', ');
    // Wait for the keyword input to appear
    await page.waitForSelector('#keywords', { visible: true, timeout: 10000 });
    // Clear any existing value
    await page.evaluate(() => {
      const input = document.querySelector('#keywords');
      if (input) input.value = '';
    });
    // Type the keywords
    await page.type('#keywords', keywords, { delay: 50 });
    // Click the search button
    await page.click('#search');
    // Wait for job cards to appear and be visible (AJAX or reload)
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.individual_internship, .internship_meta, .internship_card, .internship-listing, .internship-container');
      return Array.from(cards).some(card => card.offsetParent !== null);
    }, { timeout: 30000 });
    // Wait an additional 5 seconds for jobs to fully render
    await new Promise(r => setTimeout(r, 5000));
  }

  // 3️⃣ Scrape job cards (try multiple selectors for robustness)
  const jobs = await page.evaluate(() => {
    let jobCards = Array.from(document.querySelectorAll('.individual_internship'));
    if (jobCards.length === 0) {
      // Try alternative selectors if no jobs found
      jobCards = Array.from(document.querySelectorAll('.internship_meta, .internship_card, .internship-listing, .internship-container'));
    }
    return jobCards.map(card => {
      const title = card.querySelector('.job-title-href')?.innerText.trim();
      const company = card.querySelector('.company-name')?.innerText.trim();
      const location = card.querySelector(' .locations')?.innerText.trim();
      const link = card.querySelector('a')?.href;
      return { title, company, location, link };
    });
  });

  console.log("scraped jobs",jobs)

  await browser.close();
  return jobs;
}
