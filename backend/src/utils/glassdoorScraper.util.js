// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import fs from 'fs';

// puppeteer.use(StealthPlugin());

// export async function scrapeGlassdoorJobs() {
//   console.log('Launching browser...');
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });

//   const page = await browser.newPage();

//   try {
//     console.log('Setting user agent and viewport...');
//     await page.setUserAgent(
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//     );
//     await page.setViewport({ width: 1280, height: 800 });

//     const url = 'https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm';
//     console.log(`Navigating to: ${url}`);
//     await page.goto(url, { waitUntil: 'domcontentloaded' });

//     // Wait for main job list container (updated selector)
//     const mainListSelector = 'ul.JobsList_jobsList__lqjTr';
//     try {
//       await page.waitForSelector(mainListSelector, { timeout: 20000 });
//       console.log('Main job list container appeared');
//     } catch (e) {
//       console.error('❌ Main job list container did not appear:', e.message);
//       await browser.close();
//       return [];
//     }

//     // Try to close overlays/popups
//     try {
//       // Cookie banner
//       const cookieBtn = await page.$('button[aria-label="Close"]');
//       if (cookieBtn) {
//         await cookieBtn.click();
//         console.log('Closed cookie banner');
//       }
//       // GDPR/consent
//       const consentBtn = await page.$('button[aria-label*="Accept"]');
//       if (consentBtn) {
//         await consentBtn.click();
//         console.log('Accepted consent');
//       }
//       // Sign-in modal
//       const signInCloseBtn = await page.$('button[aria-label*="Close"]');
//       if (signInCloseBtn) {
//         await signInCloseBtn.click();
//         console.log('Closed sign-in modal');
//       }
//     } catch (e) {
//       console.log('No overlays/popups found');
//     }

//     // Scroll to bottom to trigger lazy loading
//     for (let i = 0; i < 3; i++) {
//       await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
//       await new Promise(resolve => setTimeout(resolve, 2000));

//     }

//     // Retry waiting for job cards (updated selector)
//     const jobSelector = 'li[data-test="jobListing"]';
//     let found = false;
//     for (let attempt = 0; attempt < 3; attempt++) {
//       try {
//         await page.waitForSelector(jobSelector, { timeout: 7000 });
//         found = true;
//         break;
//       } catch (e) {
//         console.log(`Job cards not found, retrying (${attempt + 1}/3)...`);
//         await new Promise(resolve => setTimeout(resolve, 2000));

//       }
//     }
//     if (!found) {
//       console.error('❌ Job cards did not appear after retries');
//       await browser.close();
//       return [];
//     }

//   //   console.log('Saving page content to internshala.html...');
//   //   const html = await page.content();
//   // fs.writeFileSync('internshala.html', html, 'utf-8');
//   // console.log("written");



//     console.log('Scraping job listings...');
//     const jobs = await page.evaluate(() => {
//       const jobCards = document.querySelectorAll('li[data-test="jobListing"]');
//       return Array.from(jobCards).map(card => {
//         // Title
//         let title = '';
//         const titleEl = card.querySelector('a.JobCard_jobTitle__GLyJ1[data-test="job-title"]');
//         if (titleEl) title = titleEl.innerText.trim();

//         // Company
//         let company = '';
//         const companyEl = card.querySelector('span.EmployerProfile_compactEmployerName__9MGcV');
//         if (companyEl) company = companyEl.innerText.trim();

//         // Location
//         let location = '';
//         const locationEl = card.querySelector('div.JobCard_location__Ds1fM[data-test="emp-location"]');
//         if (locationEl) location = locationEl.innerText.trim();

//         // Link
//         let link = '';
//         if (titleEl && titleEl.href) link = titleEl.href;

//         return { title, company, location, link };
//       });
//     });

//     console.log(`Scraped ${jobs.length} jobs.`);
//     // console.dir(jobs, { depth: null });

//     await browser.close();
//     return jobs;
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     try { await browser.close(); } catch (e) {}
//     throw err;
//   }
// }
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export async function scrapeGlassdoorJobs(keywords) {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    // 🌐 Construct search URL
    const encodedQuery = encodeURIComponent(keywords.trim() || 'intern');
    const url = `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodedQuery}`;
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 🧹 Handle popups
    try {
      const cookieBtn = await page.$('button[aria-label="Close"]');
      if (cookieBtn) await cookieBtn.click();
      const consentBtn = await page.$('button[aria-label*="Accept"]');
      if (consentBtn) await consentBtn.click();
      const signInCloseBtn = await page.$('button[aria-label*="Close"]');
      if (signInCloseBtn) await signInCloseBtn.click();
    } catch {}

    // ⬇️ Scroll to load jobs
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // ⏳ Wait for job cards
    const jobSelector = 'li[data-test="jobListing"]';
    await page.waitForSelector(jobSelector, { timeout: 15000 });

    // 📦 Scrape jobs
    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('li[data-test="jobListing"]');
      return Array.from(jobCards).map(card => {
        const title = card.querySelector('a[data-test="job-title"]')?.innerText.trim() || '';
        const company = card.querySelector('span[class*="EmployerProfile"]')?.innerText.trim() || '';
        const location = card.querySelector('div[data-test="emp-location"]')?.innerText.trim() || '';
        const link = card.querySelector('a[data-test="job-title"]')?.href || '';
        return { title, company, location, link };
      });
    });

    console.log(`✅ Scraped ${jobs.length} jobs for keywords: ${keywords}`);
    await browser.close();
    return jobs;
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await browser.close(); } catch {}
    return [];
  }
}
