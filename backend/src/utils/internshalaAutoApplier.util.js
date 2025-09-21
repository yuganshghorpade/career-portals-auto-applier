import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";
import { fillPopupForm } from "./formfiller.util.js";
import mammoth from 'mammoth'

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

export async function autoApplyOnInternshala(keywords, localpath, textPath) {
    console.log("🚀 Starting Internshala auto-apply process...");
    console.log("localpath", localpath);
    console.log("keywords", keywords);
    console.log('Resume path:', textPath);
    
    let body = "";
    
    // Fixed: Uncomment and properly handle resume reading
    try {
        if (textPath && textPath.trim()) {
            const result = await mammoth.extractRawText({ path: textPath });
            body = result.value; // plain text from resume
            if (!body || body.trim().length === 0) {
                console.warn("⚠️ Resume content is empty or could not be read");
                // Set a default body for demonstration
                body = "Experienced developer with skills in web development, machine learning, and Python programming.";
            }
            console.log("✅ Resume loaded successfully");
            console.log("📄 Resume preview:", body.substring(0, 200) + "...");
        } else {
            console.warn("⚠️ No resume path provided, using default content");
            body = "Experienced developer with skills in web development, machine learning, and Python programming.";
        }
    } catch (e) {
        console.error("❌ Failed to read resume file:", e.message);
        console.log("📝 Using fallback resume content");
        body = "Experienced developer with skills in web development, machine learning, and Python programming.";
    }

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

        // Add a delay to ensure session is properly established
        // await new Promise(resolve => setTimeout(resolve, 2000));

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

        // Search for internships based on keywords
        if (keywords && keywords.length > 0) {
            const searchQuery = Array.isArray(keywords) ? keywords.join(", ") : keywords;
            console.log("🔍 Searching for:", searchQuery);
            
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
                
                await page.type("#keywords", searchQuery, { delay: 50 });
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

        // Extract job links
        console.log("📋 Extracting job listings...");
        const jobs = await page.evaluate(() => {
            let jobCards = Array.from(document.querySelectorAll(".individual_internship"));
            if (!jobCards.length) {
                jobCards = Array.from(document.querySelectorAll(".internship_meta, .internship_card, .internship-listing, .internship-container"));
            }
            
            const links = jobCards.map((card) => {
                const link = card.querySelector("a");
                return link ? link.href : null;
            }).filter(Boolean);
            
            console.log(`Found ${links.length} job links`);
            return links;
        });

        if (jobs.length === 0) {
            console.log("❌ No job listings found");
            await browser.close();
            return { attempted: 0, applied: 0 };
        }

        console.log(`📊 Found ${jobs.length} internships to process`);
        let applied = 0;
        
        // Process each job with better error handling
        for (let i = 0; i < jobs.length; i++) {
            const jobLink = jobs[i];
            console.log(`\n🔄 Processing job ${i + 1}/${jobs.length}: ${jobLink}`);
            
            try {
                await page.goto(jobLink, { 
                    waitUntil: "networkidle2", 
                    timeout: 30000 
                });
                await new Promise((r) => setTimeout(r, 2000));

                // Look for apply button/link
                const applyLink = await page.$('a[href*="/student/interstitial/application"], a[href*="apply"]');
                if (applyLink) {
                    const href = await page.evaluate((el) => el.getAttribute("href"), applyLink);
                    const fullUrl = new URL(href, "https://internshala.com").href;
                    console.log("✅ Found apply URL:", fullUrl);
                    
                    await page.goto(fullUrl, { 
                        waitUntil: "networkidle2", 
                        timeout: 30000 
                    });
                    await new Promise((r) => setTimeout(r, 2000));
                } else {
                    console.log("⚠️ No apply link found for this job");
                    continue;
                }

                // Handle proceed button if present
                await new Promise((r) => setTimeout(r, 2000));
                const proceedBtnClicked = await page.evaluate(() => {
                    const btns = Array.from(document.querySelectorAll("button.proceed-btn, .proceed-btn, button"));
                    let btn = btns.find((b) => b.innerText.trim().toLowerCase().includes("proceed to application"));
                    
                    if (!btn) {
                        const allBtns = Array.from(document.querySelectorAll("button, a"));
                        btn = allBtns.find((b) => b.innerText.trim().toLowerCase().includes("proceed"));
                    }
                    
                    if (btn && !btn.disabled) {
                        console.log("Clicking proceed button");
                        btn.click();
                        return true;
                    }
                    return false;
                });

                if (proceedBtnClicked) {
                    await new Promise((r) => setTimeout(r, 3000));
                }

                // Wait for application form
                try {
                    await page.waitForSelector('#application-form, .application-form, form', { timeout: 15000 });
                    await new Promise((r) => setTimeout(r, 2000));
                    console.log("✅ Application form detected");
                } catch (formError) {
                    console.log("❌ Application form not found");
                    continue;
                }

                // Rest of your form filling logic continues here...
                console.log("🔍 Detecting form fields...");

                const formData = await page.evaluate(() => {
                    const fields = [];
                    const allInputs = document.querySelectorAll('input, textarea, select');
                    
                    allInputs.forEach((element, index) => {
                        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
                            return;
                        }
                        
                        let labelText = '';
                        
                        if (element.labels && element.labels.length > 0) {
                            labelText = element.labels[0].innerText.trim();
                        } else if (element.closest('label')) {
                            labelText = element.closest('label').innerText.trim();
                        } else if (element.placeholder) {
                            labelText = element.placeholder.trim();
                        } else if (element.getAttribute('aria-label')) {
                            labelText = element.getAttribute('aria-label').trim();
                        } else {
                            const parent = element.closest('.form-group, .assessment_question, .question-container');
                            if (parent) {
                                const label = parent.querySelector('label');
                                if (label) {
                                    labelText = label.innerText.trim();
                                } else {
                                    const textNodes = [];
                                    const walker = document.createTreeWalker(
                                        parent,
                                        NodeFilter.SHOW_TEXT,
                                        null,
                                        false
                                    );
                                    let node;
                                    while (node = walker.nextNode()) {
                                        const text = node.textContent.trim();
                                        if (text && text.length > 3) {
                                            textNodes.push(text);
                                        }
                                    }
                                    labelText = textNodes[0] || '';
                                }
                            }
                        }
                        
                        fields.push({
                            id: element.id || `field_${index}`,
                            name: element.name || element.id || `field_${index}`,
                            type: element.type || element.tagName.toLowerCase(),
                            tagName: element.tagName.toLowerCase(),
                            label: labelText,
                            required: element.hasAttribute('required') || element.hasAttribute('aria-required'),
                            value: element.value || '',
                            checked: element.checked || false,
                            options: element.tagName.toLowerCase() === 'select' ? 
                                Array.from(element.options).map(opt => ({ value: opt.value, text: opt.text })) : [],
                            className: element.className,
                            selector: element.id ? `#${element.id}` : `[name="${element.name}"]`
                        });
                    });
                    
                    return fields;
                });

                if (!formData.length) {
                    console.warn("❌ No form fields found");
                    continue;
                }

                console.log(`📝 Found ${formData.length} form fields`);

                // Generate AI responses for form fields
                const prompt = `You are an expert job application assistant. Analyze the resume and form fields to provide appropriate responses.

RESUME CONTENT:
${body}

FORM FIELDS:
${JSON.stringify(formData, null, 2)}

Generate responses for each field in this EXACT JSON format:
{
  "field_name_or_id": {
    "action": "type|select|check|radio",
    "value": "response_value"
  }
}

INSTRUCTIONS:
1. For availability questions: Always answer positively (e.g., "Yes, I am available immediately")
2. For experience questions: Provide reasonable numbers based on resume (if no experience, use 0-6 months)
3. For skill ratings (1-5): Provide realistic ratings (3-5 based on resume content)
4. For text fields: Provide relevant, concise answers
5. For dropdowns: Choose appropriate option values
6. For checkboxes: Use true/false
7. For radio buttons: Use the exact value that matches the positive option
8. If unsure, provide safe/positive responses

Return ONLY the JSON object, no explanations.`;

                let answers = {};
                try {
                    const result = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                    });
                    const aiText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text;
                    console.log("🤖 AI Response received");
                    
                    const cleanedText = aiText.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
                    answers = JSON.parse(cleanedText);
                    console.log("✅ AI answers parsed successfully");
                } catch (llmErr) {
                    console.error("❌ AI parsing failed:", llmErr.message);
                    // Provide fallback answers
                    answers = {};
                    formData.forEach(field => {
                        if (field.type === 'radio' && field.label.toLowerCase().includes('available')) {
                            answers[field.name] = { action: 'radio', value: 'yes' };
                        } else if (field.type === 'number') {
                            answers[field.name] = { action: 'type', value: '6' };
                        } else if (field.type === 'select' && field.options.length > 1) {
                            answers[field.name] = { action: 'select', value: field.options[1]?.value || '3' };
                        } else if (field.type === 'text' || field.tagName === 'textarea') {
                            answers[field.name] = { action: 'type', value: 'Yes, I am interested and available.' };
                        }
                    });
                }

                // Fill form fields (your existing logic continues...)
                console.log("🖊️ Filling form fields...");
                
                for (const field of formData) {
                    const answer = answers[field.name] || answers[field.id];
                    if (!answer) {
                        console.log(`⚠️ No answer for field: ${field.name} (${field.label})`);
                        continue;
                    }

                    console.log(`✏️ Filling ${field.name}: ${answer.value}`);

                    try {
                        if (field.type === 'radio') {
                            await page.evaluate((name, value) => {
                                const radios = document.querySelectorAll(`input[name="${name}"][type="radio"]`);
                                let found = false;
                                
                                for (const radio of radios) {
                                    if (radio.value === value || 
                                        radio.value.toLowerCase().includes(value.toLowerCase()) ||
                                        (radio.labels && radio.labels[0] && radio.labels[0].innerText.toLowerCase().includes(value.toLowerCase()))) {
                                        radio.checked = true;
                                        radio.click();
                                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                                        found = true;
                                        break;
                                    }
                                }
                                
                                if (!found && radios.length > 0) {
                                    radios[0].checked = true;
                                    radios[0].click();
                                    radios[0].dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }, field.name, String(answer.value));
                            
                        } else if (field.type === 'checkbox') {
                            await page.evaluate((selector, shouldCheck) => {
                                const element = document.querySelector(selector);
                                if (element) {
                                    element.checked = Boolean(shouldCheck);
                                    element.click();
                                    element.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }, field.selector, answer.value);
                            
                        } else if (field.tagName === 'select') {
                            await page.evaluate((selector, value) => {
                                const select = document.querySelector(selector);
                                if (select) {
                                    const options = Array.from(select.options);
                                    const matchingOption = options.find(opt => 
                                        opt.value === value || 
                                        opt.text === value ||
                                        opt.value === String(value)
                                    );
                                    
                                    if (matchingOption) {
                                        select.value = matchingOption.value;
                                    } else if (options.length > 1) {
                                        select.value = options[1].value;
                                    }
                                    
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    
                                    if (window.jQuery && select.classList.contains('chosen-select')) {
                                        jQuery(select).trigger('chosen:updated');
                                    }
                                }
                            }, field.selector, String(answer.value));
                            
                        } else if (field.type === 'number') {
                            await page.evaluate((selector, value) => {
                                const element = document.querySelector(selector);
                                if (element) {
                                    element.value = String(value);
                                    element.dispatchEvent(new Event('input', { bubbles: true }));
                                    element.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }, field.selector, answer.value);
                            
                        } else if (field.type === 'text' || field.type === 'textarea' || field.tagName === 'textarea') {
                            await page.evaluate((selector, value) => {
                                const element = document.querySelector(selector);
                                if (element) {
                                    element.value = String(value);
                                    element.dispatchEvent(new Event('input', { bubbles: true }));
                                    element.dispatchEvent(new Event('change', { bubbles: true }));
                                    if (element.tagName.toLowerCase() === 'textarea') {
                                        element.dispatchEvent(new Event('keyup', { bubbles: true }));
                                    }
                                }
                            }, field.selector, String(answer.value));
                        }
                        
                        await new Promise(r => setTimeout(r, 300));
                        
                    } catch (fieldError) {
                        console.error(`❌ Error filling field ${field.name}:`, fieldError.message);
                    }
                }

                // Submit form
                console.log("⏳ Preparing to submit...");
                await new Promise(r => setTimeout(r, 2000));

                console.log("🚀 Attempting to submit form...");
                const submitResult = await page.evaluate(() => {
                    const submitSelectors = [
                        'input[type="submit"]#submit',
                        'div.submit_button_container input[type="submit"]',
                        'input[type="submit"]',
                        'button[type="submit"]',
                        '#submit',
                        'input[name="submit"]',
                        '.btn[type="submit"]'
                    ];
                    
                    for (const selector of submitSelectors) {
                        const submitBtn = document.querySelector(selector);
                        if (submitBtn && submitBtn.offsetParent !== null && !submitBtn.disabled) {
                            submitBtn.click();
                            return { success: true, selector };
                        }
                    }
                    
                    const form = document.querySelector('#application-form, .application-form, form');
                    if (form) {
                        form.submit();
                        return { success: true, selector: 'form.submit()' };
                    }
                    
                    return { success: false, selector: 'none found' };
                });

                if (submitResult.success) {
                    console.log(`✅ Form submitted using: ${submitResult.selector}`);
                    await new Promise(r => setTimeout(r, 5000));
                    applied++;
                } else {
                    console.warn("❌ Could not find submit button");
                }

            } catch (jobError) {
                console.error(`❌ Error processing job ${i + 1}: ${jobError.message}`);
                continue;
            }

            // Add delay between job applications to avoid being flagged
            if (i < jobs.length - 1) {
                console.log("⏳ Waiting before next application...");
                await new Promise(r => setTimeout(r, 3000));
            }
        }

        console.log(`\n🎉 Process completed. Applied to ${applied}/${jobs.length} jobs`);
        return { attempted: jobs.length, applied };

    } catch (error) {
        console.error("❌ Fatal error in autoApplyOnInternshala:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}