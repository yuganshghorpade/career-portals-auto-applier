import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";
import { fillPopupForm } from "./formfiller.util.js";

puppeteer.use(StealthPlugin());

const CHROME_PATH =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_DIR =
    "C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 3";

const ai = new GoogleGenAI({});

async function waitForLogin(page, timeout = 120000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const isLoggedIn = await page.evaluate(
                () => !!document.querySelector('a[href="/logout"]')
            );
            if (isLoggedIn) return true;
        } catch (_) {}
        process.stdout.write(".");
        await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
}

async function scrapeCurrentPageApplications(page) {
    return await page.evaluate(() => {
        const applicationRows = Array.from(document.querySelectorAll('#applications_tbody tr[id]'));
        
        return applicationRows.map(row => {
            const applicationId = row.id;
            
            // Extract company name
            const companyElement = row.querySelector('.company_name');
            const company = companyElement ? companyElement.textContent.trim() : 'NA';
            
            // Extract job title and profile link
            const profileCell = row.querySelector('.profile');
            let title = 'NA';
            let profileLink = 'NA';
            
            if (profileCell) {
                const titleElement = profileCell.querySelector('div:first-child');
                if (titleElement) {
                    title = titleElement.textContent.trim();
                }
                
                const linkElement = profileCell.querySelector('.profile_link');
                if (linkElement) {
                    profileLink = linkElement.href;
                }
            }
            
            // Extract applied date (try both desktop and mobile versions)
            let dateApplied = 'NA';
            const desktopDateElement = row.querySelector('.applied_on.hide_in_mobile');
            if (desktopDateElement) {
                dateApplied = desktopDateElement.textContent.trim();
            } else {
                const mobileDateElement = row.querySelector('span[class*="applied_on"] span, .applied_on span');
                if (mobileDateElement && mobileDateElement.textContent.includes('Applied on')) {
                    dateApplied = mobileDateElement.textContent.replace('Applied on ', '').trim();
                }
            }
            
            // Extract number of applicants
            let totalApplicants = 'NA';
            const desktopApplicantsElement = row.querySelector('.applicants_count.hide_in_mobile');
            if (desktopApplicantsElement) {
                const applicantsText = desktopApplicantsElement.textContent.trim();
                const match = applicantsText.match(/(\d+)/);
                totalApplicants = match ? parseInt(match[1]) : 'NA';
            } else {
                const mobileApplicantsElement = row.querySelector('.applicants_count span');
                if (mobileApplicantsElement) {
                    const applicantsText = mobileApplicantsElement.textContent;
                    const match = applicantsText.match(/(\d+)/);
                    totalApplicants = match ? parseInt(match[1]) : 'NA';
                }
            }
            
            // Extract application status
            let status = 'NA';
            const statusElement = row.querySelector('.status.status-pill');
            if (statusElement) {
                status = statusElement.textContent.trim();
            }
            
            // Extract review application link
            let reviewLink = 'NA';
            const reviewLinkElement = row.querySelector('a[href*="/application/view/"]');
            if (reviewLinkElement) {
                reviewLink = reviewLinkElement.href;
            }
            
            // Extract missing skills
            let missingSkills = [];
            const skillElement = row.querySelector('.improve_application_cta[data-message]');
            if (skillElement) {
                const dataMessage = skillElement.getAttribute('data-message');
                if (dataMessage) {
                    // Parse HTML in data-message to extract skill links
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = dataMessage;
                    const skillLinks = tempDiv.querySelectorAll('a.link');
                    missingSkills = Array.from(skillLinks).map(link => link.textContent.trim());
                    // Remove duplicates
                    missingSkills = [...new Set(missingSkills)];
                }
            }
            
            // Extract location from profile link
            let location = 'NA';
            if (profileLink !== 'NA') {
                if (profileLink.includes('work-from-home')) {
                    location = 'Work From Home';
                } else {
                    const locationMatch = profileLink.match(/in-([^-]+)-at/);
                    if (locationMatch) {
                        location = locationMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                }
            }
            
            return {
                applicationId,
                title,
                company,
                location,
                status,
                dateApplied,
                totalApplicants,
                profileLink,
                reviewLink,
                missingSkills,
                scrapedAt: new Date().toISOString()
            };
        });
    });
}

async function getPaginationInfo(page) {
    return await page.evaluate(() => {
        const currentPageElement = document.querySelector('#current_page_number');
        const totalPagesElement = document.querySelector('#total_pages');
        const nextPageButton = document.querySelector('.next_page');
        
        const currentPage = currentPageElement ? parseInt(currentPageElement.textContent.trim()) : 1;
        const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim()) : 1;
        const hasNextPage = nextPageButton && !nextPageButton.classList.contains('disabled');
        
        return {
            currentPage,
            totalPages,
            hasNextPage
        };
    });
}

async function navigateToNextPage(page) {
    try {
        // Click the next page button
        await page.click('.next_page:not(.disabled)');
        
        // Wait for the page to load and table to update
        await page.waitForSelector('#applications_tbody tr[id]', { timeout: 10000 });
        
        // Wait a bit more for content to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
    } catch (error) {
        console.error('Error navigating to next page:', error.message);
        return false;
    }
}

export async function scrapeApplicationStatuses() {
    let browser;
    let page;
    try {
        try {
            browser = await puppeteer.launch({
                headless: false,
                executablePath: CHROME_PATH,
                userDataDir: PROFILE_DIR,
                defaultViewport: null,
                args: [],
            });
            page = (await browser.pages())[0];
        } catch (launchErr) {
            console.error('❌ Puppeteer failed to launch with custom Chrome:', launchErr);
            console.log('⚠️ Retrying with default Puppeteer Chromium...');
            browser = await puppeteer.launch({ headless: false });
            page = (await browser.pages())[0];
        }

        await page.goto("https://internshala.com/student/applications?referral=header", {
            waitUntil: "domcontentloaded",
        });

        const isLoggedIn = await waitForLogin(page);
        if (!isLoggedIn) {
            await browser.close();
            throw new Error("Login required to access application status page.");
        }

        // Wait for the applications table to load
        await page.waitForSelector('#applications_tbody tr[id]', { timeout: 20000 });

        let allApplications = [];
        let currentPageData = [];
        let paginationInfo = {};

        do {
            console.log('Scraping current page...');
            // Scrape applications from current page
            currentPageData = await scrapeCurrentPageApplications(page);
            allApplications.push(...currentPageData);
            // Get pagination information
            paginationInfo = await getPaginationInfo(page);
            console.log(`Scraped ${currentPageData.length} applications from page ${paginationInfo.currentPage} of ${paginationInfo.totalPages}`);
            // Navigate to next page if available
            if (paginationInfo.hasNextPage) {
                console.log('Navigating to next page...');
                const success = await navigateToNextPage(page);
                if (!success) {
                    console.log('Failed to navigate to next page, stopping pagination.');
                    break;
                }
            }
        } while (paginationInfo.hasNextPage);

        console.log(`\nScraping completed! Total applications found: ${allApplications.length}`);
        const outputData = {
            totalApplications: allApplications.length,
            totalPages: paginationInfo.totalPages,
            scrapedAt: new Date().toISOString(),
            applications: allApplications
        };
        console.log("output data",outputData)
        await browser.close();
        return outputData;
    } catch (error) {
        console.error('Error during scraping:', error);
        if (browser) await browser.close();
        throw error;
    }
}

// Optional: Function to display summary
export function displayApplicationsSummary(applications) {
    console.log('\n=== APPLICATIONS SUMMARY ===');
    console.log(`Total Applications: ${applications.length}`);
    
    // Group by company
    const companyCounts = applications.reduce((acc, app) => {
        acc[app.company] = (acc[app.company] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\nApplications by Company:');
    Object.entries(companyCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([company, count]) => {
            console.log(`  ${company}: ${count}`);
        });
    
    // Group by status
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\nApplications by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n=== RECENT APPLICATIONS ===');
    applications.slice(0, 5).forEach((app, index) => {
        console.log(`${index + 1}. ${app.title} at ${app.company}`);
        console.log(`   Location: ${app.location} | Status: ${app.status} | Applied: ${app.dateApplied}`);
        console.log(`   Applicants: ${app.totalApplicants} | Missing Skills: ${app.missingSkills.length}`);
        console.log('');
    });
}

// Usage example:
// const applications = await scrapeApplicationStatuses();
// displayApplicationsSummary(applications);