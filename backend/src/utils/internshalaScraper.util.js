import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";

puppeteer.use(StealthPlugin());

async function saveCookies(page) {
    const cookies = await page.cookies();
    await fs.writeFile("public/temp/cookies.json", JSON.stringify(cookies, null, 2));
    console.log("✅ Cookies saved");
}

async function loadCookies(page) {
    try {
        const cookies = JSON.parse(await fs.readFile("public/temp/cookies.json", "utf-8"));
        await page.setCookie(...cookies);
        console.log("✅ Cookies loaded");
    } catch {
        console.log("ℹ️ No cookies found, please log in manually");
    }
}

async function waitForLogin(page, timeout = 120000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const isLoggedIn = await page.evaluate(
                () => !!document.querySelector('a[href="/logout"]')
            );
            if (isLoggedIn){
                await saveCookies(page);
                return true;
            }
        } catch (_) {}
        process.stdout.write(".");
        await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
}

export async function scrapeInternshalaJobs(keywords) {
    console.log("🚀 Starting Internshala job scraping process...");
    console.log("🔍 Keywords:", keywords || "All internships");
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null,
    });

    let page;
    try {
        [page] = await browser.pages();
        await loadCookies(page);

        // Navigate to Internshala with better error handling
        console.log("🌐 Navigating to Internshala...");
        await page.goto("https://internshala.com/", {
            waitUntil: "networkidle2",
            timeout: 30000
        });
        console.log("✅ Visited Internshala homepage");

        // Check login status and handle login
        const isLoggedIn = await waitForLogin(page);
        if (!isLoggedIn) {
            await browser.close();
            console.log("❌ Login failed - please login manually and try again");
            throw new Error("Login failed");
        }
        console.log("✅ Login successful");

        // Navigate to internships page with better error handling
        console.log("🔍 Navigating to internships page...");
        try {
            await page.goto("https://internshala.com/internships", {
                waitUntil: "networkidle2",
                timeout: 30000
            });
            console.log("✅ Visited internships page");
        } catch (navError) {
            console.error("❌ Failed to navigate to internships page:", navError.message);
            // Try alternative navigation
            await page.evaluate(() => {
                window.location.href = '/internships';
            });
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });
            console.log("✅ Alternative navigation to internships successful");
        }

        // Search for internships based on keywords if provided
        if (keywords && keywords.trim()) {
            console.log("🔍 Searching for:", keywords);
            
            try {
                await page.waitForSelector("#keywords", {
                    visible: true,
                    timeout: 15000,
                });
                
                // Clear existing search and enter new keywords
                await page.evaluate(() => {
                    const input = document.querySelector("#keywords");
                    if (input) {
                        input.value = "";
                        input.focus();
                    }
                });
                
                await page.type("#keywords", keywords, { delay: 50 });
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Click search button
                await page.click("#search");
                console.log("✅ Search initiated");
                
                // Wait for search results to load
                await page.waitForFunction(() => {
                    const cards = document.querySelectorAll(".individual_internship, .internship_meta, .internship_card");
                    return Array.from(cards).some((card) => card.offsetParent !== null);
                }, { timeout: 30000 });
                
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log("✅ Search results loaded");
            } catch (searchError) {
                console.error("❌ Search failed:", searchError.message);
                console.log("📝 Proceeding with all available internships");
            }
        }

        // Extract job information with multiple fallback strategies
        console.log("📋 Extracting job listings...");
        const jobs = await page.evaluate(() => {
            let jobCards = Array.from(document.querySelectorAll(".individual_internship"));
            if (!jobCards.length) {
                // Try alternative selectors if no jobs found
                jobCards = Array.from(document.querySelectorAll(".internship_meta, .internship_card, .internship-listing, .internship-container"));
            }
            
            return jobCards.map((card, index) => {
                try {
                    // Multiple selector strategies for title
                    let title = '';
                    const titleSelectors = ['.job-title-href', '.profile', '.internship_title', '.job-title', 'h3', 'h4'];
                    for (const selector of titleSelectors) {
                        const titleElement = card.querySelector(selector);
                        if (titleElement && titleElement.innerText?.trim()) {
                            title = titleElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Multiple selector strategies for company
                    let company = '';
                    const companySelectors = ['.company-name', '.company', '.company_name', '.organization', '.employer'];
                    for (const selector of companySelectors) {
                        const companyElement = card.querySelector(selector);
                        if (companyElement && companyElement.innerText?.trim()) {
                            company = companyElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Multiple selector strategies for location
                    let location = '';
                    const locationSelectors = ['.locations', '.location', '.location_name', '.city', '.place'];
                    for (const selector of locationSelectors) {
                        const locationElement = card.querySelector(selector);
                        if (locationElement && locationElement.innerText?.trim()) {
                            location = locationElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Get job link
                    const linkElement = card.querySelector('a');
                    const link = linkElement ? linkElement.href : null;
                    
                    // Additional job details
                    let duration = '';
                    const durationSelectors = ['.duration', '.internship_duration', '.tenure'];
                    for (const selector of durationSelectors) {
                        const durationElement = card.querySelector(selector);
                        if (durationElement && durationElement.innerText?.trim()) {
                            duration = durationElement.innerText.trim();
                            break;
                        }
                    }
                    
                    let stipend = '';
                    const stipendSelectors = ['.stipend', '.salary', '.compensation', '.pay'];
                    for (const selector of stipendSelectors) {
                        const stipendElement = card.querySelector(selector);
                        if (stipendElement && stipendElement.innerText?.trim()) {
                            stipend = stipendElement.innerText.trim();
                            break;
                        }
                    }
                    
                    // Only return jobs that have at least title and link
                    if (!title && !link) {
                        return null;
                    }
                    
                    return {
                        title: title || `Job ${index + 1}`,
                        company: company || 'Not specified',
                        location: location || 'Not specified',
                        duration: duration || 'Not specified',
                        stipend: stipend || 'Not specified',
                        link: link
                    };
                } catch (cardError) {
                    console.error(`Error processing card ${index}:`, cardError);
                    return null;
                }
            }).filter(Boolean); // Remove null entries
        });

        if (jobs.length === 0) {
            console.log("❌ No job listings found");
            return [];
        }

        console.log(`📊 Successfully scraped ${jobs.length} job listings`);
        
        // Log first few jobs as preview
        jobs.slice(0, 3).forEach((job, index) => {
            console.log(`📝 Job ${index + 1}:`);
            console.log(`   Title: ${job.title}`);
            console.log(`   Company: ${job.company}`);
            console.log(`   Location: ${job.location}`);
            if (job.duration !== 'Not specified') console.log(`   Duration: ${job.duration}`);
            if (job.stipend !== 'Not specified') console.log(`   Stipend: ${job.stipend}`);
            console.log(`   Link: ${job.link}`);
            console.log('');
        });
        
        if (jobs.length > 3) {
            console.log(`... and ${jobs.length - 3} more jobs`);
        }

        return jobs;

    } catch (error) {
        console.error("❌ Fatal error in scrapeInternshalaJobs:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log("🔄 Browser closed successfully");
        }
    }
}