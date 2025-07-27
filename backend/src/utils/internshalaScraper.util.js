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

export async function scrapeInternshalaJobs() {
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

  // 3️⃣ Scrape job cards
  const jobs = await page.evaluate(() => {
    const jobCards = Array.from(document.querySelectorAll('.individual_internship'));
    return jobCards.map(card => {
      const title = card.querySelector('.heading_4_5')?.innerText.trim();
      const company = card.querySelector('.company_name')?.innerText.trim();
      const location = card.querySelector('.location_link')?.innerText.trim();
      const link = card.querySelector('a')?.href;
      return { title, company, location, link };
    });
  });

  // 4️⃣ Display results
  // console.log(`📝 Found ${jobs.length} jobs:\n`, jobs);

  await browser.close();
  
  return jobs;

}
