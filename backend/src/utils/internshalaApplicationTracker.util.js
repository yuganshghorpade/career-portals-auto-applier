import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

puppeteer.use(StealthPlugin());

const ai = new GoogleGenAI({});

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

async function scrapeCurrentPageApplications(page) {
    return await page.evaluate(() => {
        const applicationRows = Array.from(document.querySelectorAll('#applications_tbody tr[id]'));
        
        return applicationRows.map((row, index) => {
            try {
                const applicationId = row.id;
                
                // Extract company name with fallback strategies
                let company = 'NA';
                const companySelectors = ['.company_name', '.company', '.organization', '.employer'];
                for (const selector of companySelectors) {
                    const element = row.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        company = element.textContent.trim();
                        break;
                    }
                }
                
                // Extract job title and profile link with fallback strategies
                const profileCell = row.querySelector('.profile');
                let title = 'NA';
                let profileLink = 'NA';
                
                if (profileCell) {
                    const titleSelectors = ['div:first-child', '.title', '.job-title', '.profile-title'];
                    for (const selector of titleSelectors) {
                        const titleElement = profileCell.querySelector(selector);
                        if (titleElement && titleElement.textContent?.trim()) {
                            title = titleElement.textContent.trim();
                            break;
                        }
                    }
                    
                    const linkSelectors = ['.profile_link', 'a[href*="/internship/"]', 'a'];
                    for (const selector of linkSelectors) {
                        const linkElement = profileCell.querySelector(selector);
                        if (linkElement && linkElement.href) {
                            profileLink = linkElement.href;
                            break;
                        }
                    }
                }
                
                // Extract applied date with multiple fallback strategies
                let dateApplied = 'NA';
                const dateSelectors = [
                    '.applied_on.hide_in_mobile',
                    'span[class*="applied_on"] span',
                    '.applied_on span',
                    '.date-applied',
                    '.application-date'
                ];
                
                for (const selector of dateSelectors) {
                    const dateElement = row.querySelector(selector);
                    if (dateElement && dateElement.textContent?.trim()) {
                        let dateText = dateElement.textContent.trim();
                        if (dateText.includes('Applied on')) {
                            dateText = dateText.replace('Applied on ', '').trim();
                        }
                        if (dateText && dateText !== 'NA') {
                            dateApplied = dateText;
                            break;
                        }
                    }
                }
                
                // Extract number of applicants with multiple strategies
                let totalApplicants = 'NA';
                const applicantSelectors = [
                    '.applicants_count.hide_in_mobile',
                    '.applicants_count span',
                    '.total-applicants',
                    '.applicant-count'
                ];
                
                for (const selector of applicantSelectors) {
                    const applicantsElement = row.querySelector(selector);
                    if (applicantsElement && applicantsElement.textContent?.trim()) {
                        const applicantsText = applicantsElement.textContent.trim();
                        const match = applicantsText.match(/(\d+)/);
                        if (match) {
                            totalApplicants = parseInt(match[1]);
                            break;
                        }
                    }
                }
                
                // Extract application status with fallback strategies
                let status = 'NA';
                const statusSelectors = [
                    '.status.status-pill',
                    '.status',
                    '.application-status',
                    '.status-badge'
                ];
                
                for (const selector of statusSelectors) {
                    const statusElement = row.querySelector(selector);
                    if (statusElement && statusElement.textContent?.trim()) {
                        status = statusElement.textContent.trim();
                        break;
                    }
                }
                
                // Extract review application link with fallback strategies
                let reviewLink = 'NA';
                const reviewSelectors = [
                    'a[href*="/application/view/"]',
                    'a[href*="/review"]',
                    '.review-link',
                    '.view-application'
                ];
                
                for (const selector of reviewSelectors) {
                    const reviewLinkElement = row.querySelector(selector);
                    if (reviewLinkElement && reviewLinkElement.href) {
                        reviewLink = reviewLinkElement.href;
                        break;
                    }
                }
                
                // Extract missing skills with error handling
                let missingSkills = [];
                try {
                    const skillElement = row.querySelector('.improve_application_cta[data-message]');
                    if (skillElement) {
                        const dataMessage = skillElement.getAttribute('data-message');
                        if (dataMessage) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = dataMessage;
                            const skillLinks = tempDiv.querySelectorAll('a.link, a');
                            missingSkills = Array.from(skillLinks)
                                .map(link => link.textContent?.trim())
                                .filter(Boolean);
                            // Remove duplicates
                            missingSkills = [...new Set(missingSkills)];
                        }
                    }
                } catch (skillError) {
                    console.error(`Error extracting skills for row ${index}:`, skillError);
                }
                
                // Extract location from profile link with enhanced logic
                let location = 'NA';
                if (profileLink !== 'NA') {
                    try {
                        if (profileLink.includes('work-from-home')) {
                            location = 'Work From Home';
                        } else {
                            const locationMatch = profileLink.match(/in-([^-]+)-at/);
                            if (locationMatch) {
                                location = locationMatch[1]
                                    .replace(/-/g, ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase());
                            } else {
                                // Try alternative location patterns
                                const altLocationMatch = profileLink.match(/\/([^\/]+)-internship/);
                                if (altLocationMatch) {
                                    location = altLocationMatch[1]
                                        .replace(/-/g, ' ')
                                        .replace(/\b\w/g, l => l.toUpperCase());
                                }
                            }
                        }
                    } catch (locationError) {
                        console.error(`Error extracting location for row ${index}:`, locationError);
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
            } catch (rowError) {
                console.error(`Error processing application row ${index}:`, rowError);
                return null;
            }
        }).filter(Boolean); // Remove null entries
    });
}

async function getPaginationInfo(page) {
    return await page.evaluate(() => {
        try {
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
        } catch (paginationError) {
            console.error('Error getting pagination info:', paginationError);
            return {
                currentPage: 1,
                totalPages: 1,
                hasNextPage: false
            };
        }
    });
}

async function navigateToNextPage(page) {
    try {
        console.log("🔄 Navigating to next page...");
        
        // Click the next page button
        await page.click('.next_page:not(.disabled)');
        
        // Wait for the page to load and table to update
        await page.waitForSelector('#applications_tbody tr[id]', { timeout: 15000 });
        
        // Wait for content to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log("✅ Successfully navigated to next page");
        return true;
    } catch (error) {
        console.error('❌ Error navigating to next page:', error.message);
        return false;
    }
}

export async function scrapeApplicationStatuses() {
    console.log("🚀 Starting Internshala application status scraping...");
    
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

        // Navigate to applications page with better error handling
        console.log("🌐 Navigating to applications page...");
        await page.goto("https://internshala.com/student/applications?referral=header", {
            waitUntil: "networkidle2",
            timeout: 30000
        });
        console.log("✅ Visited applications page");

        // Check login status and handle login
        const isLoggedIn = await waitForLogin(page);
        if (!isLoggedIn) {
            await browser.close();
            console.log("❌ Login failed - please login manually and try again");
            throw new Error("Login failed");
        }
        console.log("✅ Login successful");

        // Wait for the applications table to load with better error handling
        console.log("⏳ Waiting for applications table to load...");
        try {
            await page.waitForSelector('#applications_tbody tr[id]', { timeout: 20000 });
            console.log("✅ Applications table loaded");
        } catch (tableError) {
            console.error("❌ Applications table not found:", tableError.message);
            // Try alternative selectors
            try {
                await page.waitForSelector('#applications_tbody, .applications-table, .application-row', { timeout: 10000 });
                console.log("✅ Alternative applications container found");
            } catch (altError) {
                throw new Error("No applications found - table may be empty or page structure changed");
            }
        }

        let allApplications = [];
        let currentPageData = [];
        let paginationInfo = {};
        let pageCount = 0;

        do {
            pageCount++;
            console.log(`📄 Processing page ${pageCount}...`);
            
            try {
                // Scrape applications from current page
                currentPageData = await scrapeCurrentPageApplications(page);
                allApplications.push(...currentPageData);
                
                // Get pagination information
                paginationInfo = await getPaginationInfo(page);
                
                console.log(`✅ Scraped ${currentPageData.length} applications from page ${paginationInfo.currentPage} of ${paginationInfo.totalPages}`);
                
                // Navigate to next page if available
                if (paginationInfo.hasNextPage && pageCount < 50) { // Safety limit
                    const success = await navigateToNextPage(page);
                    if (!success) {
                        console.log("❌ Failed to navigate to next page, stopping pagination");
                        break;
                    }
                } else if (pageCount >= 50) {
                    console.log("⚠️ Reached safety limit of 50 pages, stopping");
                    break;
                }
            } catch (pageError) {
                console.error(`❌ Error processing page ${pageCount}:`, pageError.message);
                break;
            }
        } while (paginationInfo.hasNextPage);

        if (allApplications.length === 0) {
            console.log("❌ No applications found");
            return {
                totalApplications: 0,
                totalPages: 0,
                scrapedAt: new Date().toISOString(),
                applications: []
            };
        }

        console.log(`🎉 Scraping completed! Total applications found: ${allApplications.length}`);
        
        // Display summary
        const statusCounts = allApplications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});
        
        console.log("📊 Application Status Summary:");
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        const outputData = {
            totalApplications: allApplications.length,
            totalPages: paginationInfo.totalPages || pageCount,
            scrapedAt: new Date().toISOString(),
            applications: allApplications
        };

        return outputData;

    } catch (error) {
        console.error("❌ Fatal error in scrapeApplicationStatuses:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log("🔄 Browser closed successfully");
        }
    }
}

// Enhanced display function with emoji logging
export function displayApplicationsSummary(applications) {
    if (!applications || applications.length === 0) {
        console.log("❌ No applications data to display");
        return;
    }

    console.log('\n📊 === APPLICATIONS SUMMARY ===');
    console.log(`📈 Total Applications: ${applications.length}`);
    
    // Group by company
    const companyCounts = applications.reduce((acc, app) => {
        acc[app.company] = (acc[app.company] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n🏢 Applications by Company:');
    Object.entries(companyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Show top 10
        .forEach(([company, count]) => {
            console.log(`   ${company}: ${count}`);
        });
    
    // Group by status
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n📋 Applications by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
        const statusEmoji = getStatusEmoji(status);
        console.log(`   ${statusEmoji} ${status}: ${count}`);
    });
    
    console.log('\n📝 === RECENT APPLICATIONS ===');
    applications.slice(0, 5).forEach((app, index) => {
        const statusEmoji = getStatusEmoji(app.status);
        console.log(`${index + 1}. ${app.title} at ${app.company}`);
        console.log(`   📍 Location: ${app.location} | ${statusEmoji} Status: ${app.status} | 📅 Applied: ${app.dateApplied}`);
        console.log(`   👥 Applicants: ${app.totalApplicants} | 🎯 Missing Skills: ${app.missingSkills.length}`);
        if (app.missingSkills.length > 0) {
            console.log(`   🔧 Skills needed: ${app.missingSkills.slice(0, 3).join(', ')}${app.missingSkills.length > 3 ? '...' : ''}`);
        }
        console.log('');
    });
}

function getStatusEmoji(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('selected') || statusLower.includes('hired')) return '🎉';
    if (statusLower.includes('rejected') || statusLower.includes('declined')) return '❌';
    if (statusLower.includes('applied') || statusLower.includes('pending')) return '⏳';
    if (statusLower.includes('reviewed') || statusLower.includes('shortlisted')) return '👀';
    return '📄';
}