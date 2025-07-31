// //TODO: not a todo but a latest backup code.
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

// export async function autoApplyOnInternshala(keywords, body, localpath) {
//     const browser = await puppeteer.launch({
//         headless: false,
//         executablePath: CHROME_PATH,
//         userDataDir: PROFILE_DIR,
//         args: [],
//         defaultViewport: null,
//     });

//     const [page] = await browser.pages();
//     await page.goto("https://internshala.com/", {
//         waitUntil: "domcontentloaded",
//     });

//     const isLoggedIn = await waitForLogin(page);
//     if (!isLoggedIn) {
//         await browser.close();
//         throw new Error("Login failed");
//     }

//     await page.goto("https://internshala.com/internships", {
//         waitUntil: "domcontentloaded",
//     });

//     if (keywords?.length > 0) {
//         const searchQuery = Array.isArray(keywords)
//             ? keywords.join(", ")
//             : keywords;
//         await page.waitForSelector("#keywords", {
//             visible: true,
//             timeout: 10000,
//         });
//         await page.evaluate(
//             () => (document.querySelector("#keywords").value = "")
//         );
//         await page.type("#keywords", searchQuery, { delay: 50 });
//         await page.click("#search");
//         await page.waitForFunction(
//             () => {
//                 const cards = document.querySelectorAll(
//                     ".individual_internship, .internship_meta, .internship_card"
//                 );
//                 return Array.from(cards).some(
//                     (card) => card.offsetParent !== null
//                 );
//             },
//             { timeout: 30000 }
//         );
//         await new Promise((resolve) => setTimeout(resolve, 5000));
//     }

//     const jobs = await page.evaluate(() => {
//         let jobCards = Array.from(
//             document.querySelectorAll(".individual_internship")
//         );
//         if (!jobCards.length) {
//             jobCards = Array.from(
//                 document.querySelectorAll(
//                     ".internship_meta, .internship_card, .internship-listing, .internship-container"
//                 )
//             );
//         }
//         return jobCards
//             .map((card) => card.querySelector("a")?.href)
//             .filter(Boolean);
//     });

//     let applied = 0;
//     for (const jobLink of jobs) {
//         try {
//             await page.goto(jobLink, { waitUntil: "domcontentloaded" });
//             await new Promise((resolve) => setTimeout(resolve, 2000));

//             // Find and click the apply link or button
//             const applyLink = await page.$(
//                 'a[href*="/student/interstitial/application"]'
//             );
//             if (applyLink) {
//                 const href = await page.evaluate(
//                     (el) => el.getAttribute("href"),
//                     applyLink
//                 );
//                 const fullUrl = new URL(href, "https://internshala.com").href;
//                 console.log("✅ Navigating to apply URL:", fullUrl);
//                 await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
//                 await new Promise((resolve) => setTimeout(resolve, 2000));
//             }
//             await new Promise((resolve) => setTimeout(resolve, 3000));

//             // --- NEW: If digital resume page appears, click 'Proceed to application' button ---
//             // Try to find and click the button with class 'proceed-btn' and text 'Proceed to application' (case-insensitive)
//             const proceedBtnClicked = await page.evaluate(() => {
//                 // Try by class name first
//                 const btns = Array.from(
//                     document.querySelectorAll(
//                         "button.proceed-btn, .proceed-btn"
//                     )
//                 );
//                 let btn = btns.find((b) =>
//                     b.innerText
//                         .trim()
//                         .toLowerCase()
//                         .includes("proceed to application")
//                 );
//                 // Fallback: try all buttons and links
//                 if (!btn) {
//                     const allBtns = Array.from(
//                         document.querySelectorAll("button, a")
//                     );
//                     btn = allBtns.find((b) =>
//                         b.innerText
//                             .trim()
//                             .toLowerCase()
//                             .includes("proceed to application")
//                     );
//                 }
//                 if (btn) {
//                     btn.click();
//                     return true;
//                 }
//                 return false;
//             });
//             if (proceedBtnClicked) {
//                 await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for modal/questions to appear
//             }

//             // --- Improved: Target either modal or main form for field extraction ---
//             const formFields = await page.evaluate(() => {
//                 // Try to find a modal first
//                 const modalCandidates = Array.from(
//                     document.querySelectorAll(
//                         ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                     )
//                 );
//                 let modal = modalCandidates.find(
//                     (m) => m.offsetParent !== null
//                 );
//                 // Fallback: if no visible modal, try .modal-content inside .modal
//                 if (!modal) {
//                     modal = Array.from(
//                         document.querySelectorAll(".modal .modal-content")
//                     ).find((m) => m.offsetParent !== null);
//                 }
//                 // If still not found, use main document (for non-modal forms)
//                 const container = modal || document;
//                 const fields = [];
//                 container
//                     .querySelectorAll("input, textarea, select")
//                     .forEach((el) => {
//                         if (
//                             el.offsetParent !== null &&
//                             !el.disabled &&
//                             !el.readOnly &&
//                             !["hidden", "submit", "button"].includes(el.type)
//                         ) {
//                             let label = "";
//                             if (el.labels && el.labels.length > 0)
//                                 label = el.labels[0].innerText;
//                             else if (el.closest("label"))
//                                 label = el.closest("label").innerText;
//                             else if (el.placeholder) label = el.placeholder;
//                             else if (el.getAttribute("aria-label"))
//                                 label = el.getAttribute("aria-label");
//                             else if (
//                                 el.parentElement &&
//                                 el.parentElement.className.includes(
//                                     "question-container"
//                                 )
//                             ) {
//                                 label = el.parentElement.innerText.trim();
//                             }
//                             fields.push({
//                                 name: el.name || el.id || "",
//                                 label,
//                                 type: el.type || el.tagName.toLowerCase(),
//                             });
//                         }
//                     });
//                 return fields;
//             });

//             if (!formFields.length) {
//                 console.warn("No form fields found in modal for job:", jobLink);
//                 continue;
//             }

//             // --- Build prompt for Gemini LLM ---
//             const prompt = `You are an expert job application assistant. Given a resume and a list of job application form fields/questions, generate the most appropriate and concise value for each field.

// Respond with a JSON object where each field name maps to:
// - 'action': one of 'type' (for text input), 'check' (for checkboxes), or 'select' (for dropdown/radio options)
// - 'value': the value to be typed, selected, or checked (true/false)

// Rules:
// 1. Answer all fields, even if they seem irrelevant (e.g., video uploads, file links).
// 2. If a field cannot be answered using the resume or is not applicable (like "Upload a video", "Paste a portfolio link", etc.), set its value as "NA".
// 3. For open-ended questions like cover letters or "Why should we hire you?", craft concise, professional answers based on the resume.
// 4. If the field appears to be a checkbox or radio, set the appropriate 'action' and 'value'.
// 5. Do not skip any field. Every field must appear in the final JSON.
// 6. Output must be a **valid JSON object only**, with no explanation, no markdown, and no extra text.

// Example:
// {
//   "availability": { "action": "type", "value": "Immediate" },
//   "agreeTerms": { "action": "check", "value": true },
//   "gender": { "action": "select", "value": "Male" },
//   "videoIntroLink": { "action": "type", "value": "NA" }
// }

// Resume:
// ${body}

// Form fields:
// ${JSON.stringify(formFields, null, 2)}
// `;

//             let answers = {};
//             try {
//                 const result = await ai.models.generateContent({
//                     model: "gemini-2.5-flash",
//                     contents: [{ role: "user", parts: [{ text: prompt }] }],
//                 });
//                 const text =
//                     result?.response?.candidates?.[0]?.content?.parts?.[0]
//                         ?.text || result.text;
//                 answers = JSON.parse(
//                     text.replace(/```(?:json)?\n([\s\S]*?)```/, "$1").trim()
//                 );
//             } catch (llmErr) {
//                 console.error("LLM failed:", llmErr.message);
//                 continue;
//             }

//             // --- Fill the modal form fields with LLM answers ---
//             for (const field of formFields) {
//                 const answer = answers[field.name];
//                 if (!answer) continue;
//                 // Handle file upload field
//                 // Handle file upload field
//                 if (
//                     field.type === "file" ||
//                     field.type === "FILE" ||
//                     field.label.toLowerCase().includes("resume") ||
//                     field.name === "custom_resume" ||
//                     field.id === "custom_resume"
//                 ) {
//                     try {
//                         const inputSelector = "input#custom_resume";
//                         const fileInput = await page.$(inputSelector);
//                         if (!fileInput) {
//                             console.warn(
//                                 "❌ File input #custom_resume not found."
//                             );
//                             continue;
//                         }

//                         // Upload file using Puppeteer's upload API
//                         await fileInput.uploadFile(localpath);
//                         await new Promise((resolve) =>
//                             setTimeout(resolve, 10000)
//                         );

//                         // Dispatch change + input event manually
//                         await page.evaluate(() => {
//                             const input =
//                                 document.getElementById("custom_resume");
//                             if (input) {
//                                 input.dispatchEvent(
//                                     new Event("input", { bubbles: true })
//                                 );
//                                 input.dispatchEvent(
//                                     new Event("change", { bubbles: true })
//                                 );
//                                 console.log(
//                                     "✅ Resume upload triggered via custom_resume input"
//                                 );
//                             }
//                         });

//                         console.log("✅ Resume uploaded successfully.");
//                     } catch (fileErr) {
//                         console.warn(
//                             "❌ Resume upload failed:",
//                             fileErr.message
//                         );
//                     }
//                     continue;
//                 }

//                 // Handle checkbox
//                 if (field.type === "checkbox") {
//                     try {
//                         await page.evaluate(
//                             (name, shouldCheck) => {
//                                 const modalCandidates = Array.from(
//                                     document.querySelectorAll(
//                                         ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                                     )
//                                 );
//                                 let modal = modalCandidates.find(
//                                     (m) => m.offsetParent !== null
//                                 );
//                                 if (!modal) {
//                                     modal = Array.from(
//                                         document.querySelectorAll(
//                                             ".modal .modal-content"
//                                         )
//                                     ).find((m) => m.offsetParent !== null);
//                                 }
//                                 if (!modal) modal = document;
//                                 const el = modal.querySelector(
//                                     `[name='${name}']`
//                                 );
//                                 if (el && el.type === "checkbox") {
//                                     el.checked = !!shouldCheck;
//                                     el.dispatchEvent(
//                                         new Event("change", { bubbles: true })
//                                     );
//                                 }
//                             },
//                             field.name,
//                             answer.value
//                         );
//                     } catch (checkErr) {}
//                     continue;
//                 }
//                 // Handle radio
//                 if (field.type === "radio") {
//                     try {
//                         await page.evaluate(
//                             (name, value) => {
//                                 const modalCandidates = Array.from(
//                                     document.querySelectorAll(
//                                         ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                                     )
//                                 );
//                                 let modal = modalCandidates.find(
//                                     (m) => m.offsetParent !== null
//                                 );
//                                 if (!modal) {
//                                     modal = Array.from(
//                                         document.querySelectorAll(
//                                             ".modal .modal-content"
//                                         )
//                                     ).find((m) => m.offsetParent !== null);
//                                 }
//                                 if (!modal) modal = document;
//                                 const radios = modal.querySelectorAll(
//                                     `[name='${name}'][type='radio']`
//                                 );
//                                 for (const radio of radios) {
//                                     if (
//                                         radio.value === value ||
//                                         radio.labels?.[0]?.innerText === value
//                                     ) {
//                                         radio.checked = true;
//                                         radio.dispatchEvent(
//                                             new Event("change", {
//                                                 bubbles: true,
//                                             })
//                                         );
//                                     }
//                                 }
//                             },
//                             field.name,
//                             answer.value
//                         );
//                     } catch (radioErr) {}
//                     continue;
//                 }
//                 // Handle text/select
//                 if (
//                     answer.action === "type" ||
//                     field.type === "text" ||
//                     field.type === "textarea"
//                 ) {
//                     try {
//                         await page.evaluate(
//                             (name, value, type) => {
//                                 const modalCandidates = Array.from(
//                                     document.querySelectorAll(
//                                         ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                                     )
//                                 );
//                                 let modal = modalCandidates.find(
//                                     (m) => m.offsetParent !== null
//                                 );
//                                 if (!modal) {
//                                     modal = Array.from(
//                                         document.querySelectorAll(
//                                             ".modal .modal-content"
//                                         )
//                                     ).find((m) => m.offsetParent !== null);
//                                 }
//                                 if (!modal) modal = document;
//                                 const el = modal.querySelector(
//                                     `[name='${name}'], #${name}`
//                                 );
//                                 if (!el) return;
//                                 el.value = value;
//                                 el.dispatchEvent(
//                                     new Event("input", { bubbles: true })
//                                 );
//                             },
//                             field.name,
//                             answer.value,
//                             field.type
//                         );
//                     } catch (fillErr) {}
//                     continue;
//                 }
//                 if (answer.action === "select" || field.type === "select") {
//                     try {
//                         await page.evaluate(
//                             (name, value) => {
//                                 const modalCandidates = Array.from(
//                                     document.querySelectorAll(
//                                         ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                                     )
//                                 );
//                                 let modal = modalCandidates.find(
//                                     (m) => m.offsetParent !== null
//                                 );
//                                 if (!modal) {
//                                     modal = Array.from(
//                                         document.querySelectorAll(
//                                             ".modal .modal-content"
//                                         )
//                                     ).find((m) => m.offsetParent !== null);
//                                 }
//                                 if (!modal) modal = document;
//                                 const el = modal.querySelector(
//                                     `[name='${name}']`
//                                 );
//                                 if (
//                                     el &&
//                                     el.tagName.toLowerCase() === "select"
//                                 ) {
//                                     el.value = value;
//                                     el.dispatchEvent(
//                                         new Event("change", { bubbles: true })
//                                     );
//                                 }
//                             },
//                             field.name,
//                             answer.value
//                         );
//                     } catch (selectErr) {}
//                     continue;
//                 }
//             }

//             // --- Submit the form (modal or main) ---
//             let submitClicked = false;
//             try {
//                 submitClicked = await page.evaluate(() => {
//                     // Try modal first
//                     const modalCandidates = Array.from(
//                         document.querySelectorAll(
//                             ".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"
//                         )
//                     );
//                     let modal = modalCandidates.find(
//                         (m) => m.offsetParent !== null
//                     );
//                     if (!modal) {
//                         modal = Array.from(
//                             document.querySelectorAll(".modal .modal-content")
//                         ).find((m) => m.offsetParent !== null);
//                     }
//                     if (!modal) modal = document;
//                     // Try input[type='submit']
//                     let btn = modal.querySelector("input[type='submit']");
//                     if (!btn) btn = modal.querySelector("#submit");
//                     if (!btn) {
//                         // Try .submit_button_container
//                         const container = modal.querySelector(
//                             ".submit_button_container"
//                         );
//                         if (container) {
//                             btn = container.querySelector(
//                                 "input[type='submit'], button, .btn, .btn-primary"
//                             );
//                         }
//                     }
//                     if (btn) {
//                         btn.click();
//                         return true;
//                     }
//                     // Fallback: try submitting the form directly
//                     const form = modal.querySelector("form");
//                     if (form) {
//                         form.submit();
//                         return true;
//                     }
//                     return false;
//                 });
//             } catch {}
//             if (submitClicked) {
//                 await new Promise((resolve) => setTimeout(resolve, 3000));
//                 applied++;
//             }
//         } catch (err) {
//             console.warn("Error applying to job:", jobLink, err.message);
//         }
//     }

//     await browser.close();
//     return { attempted: jobs.length, applied };
// }
import mammoth from "mammoth";
// export async function autoApplyOnInternshala(keywords, localpath, text) {
//     console.log("localpath",localpath);
//     console.log("keywords",keywords);
//     console.log('text',text)
//     let body = "";
//   try {
//     const result = await mammoth.extractRawText({ path: text });
//     body = result.value; // plain text from resume
//     // console.log("bodying",body);
//     if (!body) throw new Error("Resume content is empty");
//   } catch (e) {
//     console.error("❌ Failed to read resume file:", e.message);
//   }
//     const browser = await puppeteer.launch({
//         headless: false,
//         executablePath: CHROME_PATH,
//         userDataDir: PROFILE_DIR,
//         args: [],
//         defaultViewport: null,
//     });

//     const [page] = await browser.pages();
//     await page.goto("https://internshala.com/", {
//         waitUntil: "domcontentloaded",
//     });

//     const isLoggedIn = await waitForLogin(page);
//     if (!isLoggedIn) {
//         await browser.close();
//         throw new Error("Login failed");
//     }

//     await page.goto("https://internshala.com/internships", {
//         waitUntil: "domcontentloaded",
//     });

//     if (keywords?.length > 0) {
//         const searchQuery = Array.isArray(keywords)
//             ? keywords.join(", ")
//             : keywords;
//         await page.waitForSelector("#keywords", {
//             visible: true,
//             timeout: 10000,
//         });
//         await page.evaluate(() => (document.querySelector("#keywords").value = ""));
//         await page.type("#keywords", searchQuery, { delay: 50 });
//         await page.click("#search");
//         await page.waitForFunction(() => {
//             const cards = document.querySelectorAll(".individual_internship, .internship_meta, .internship_card");
//             return Array.from(cards).some((card) => card.offsetParent !== null);
//         }, { timeout: 30000 });
//         await new Promise((resolve) => setTimeout(resolve, 5000));
//     }

//     const jobs = await page.evaluate(() => {
//         let jobCards = Array.from(document.querySelectorAll(".individual_internship"));
//         if (!jobCards.length) {
//             jobCards = Array.from(document.querySelectorAll(".internship_meta, .internship_card, .internship-listing, .internship-container"));
//         }
//         return jobCards.map((card) => card.querySelector("a")?.href).filter(Boolean);
//     });

//     let applied = 0;
//     for (const jobLink of jobs) {
//         try {
//             await page.goto(jobLink, { waitUntil: "domcontentloaded" });
//             await new Promise((r) => setTimeout(r, 2000));

//             const applyLink = await page.$('a[href*="/student/interstitial/application"]');
//             if (applyLink) {
//                 const href = await page.evaluate((el) => el.getAttribute("href"), applyLink);
//                 const fullUrl = new URL(href, "https://internshala.com").href;
//                 console.log("✅ Navigating to apply URL:", fullUrl);
//                 await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
//                 await new Promise((r) => setTimeout(r, 2000));
//             }

//             await new Promise((r) => setTimeout(r, 3000));

//             const proceedBtnClicked = await page.evaluate(() => {
//                 const btns = Array.from(document.querySelectorAll("button.proceed-btn, .proceed-btn"));
//                 let btn = btns.find((b) => b.innerText.trim().toLowerCase().includes("proceed to application"));
//                 if (!btn) {
//                     const allBtns = Array.from(document.querySelectorAll("button, a"));
//                     btn = allBtns.find((b) => b.innerText.trim().toLowerCase().includes("proceed to application"));
//                 }
//                 if (btn) {
//                     btn.click();
//                     return true;
//                 }
//                 return false;
//             });
//             if (proceedBtnClicked) {
//                 await new Promise((r) => setTimeout(r, 3000));
//             }

//             const formFields = await page.evaluate(() => {
//     const fields = [];

//     const modalCandidates = Array.from(document.querySelectorAll(".modal.fade.in, .internshala-modal.in, .modal.show, .modal-content"));
//     let modal = modalCandidates.find((m) => m.offsetParent !== null);
//     if (!modal) {
//         modal = Array.from(document.querySelectorAll(".modal .modal-content")).find((m) => m.offsetParent !== null);
//     }

//     const container = modal || document;

//     // General inputs
//     container.querySelectorAll("input, textarea, select").forEach((el) => {
//         if (
//             el.offsetParent !== null &&
//             !el.disabled &&
//             !el.readOnly &&
//             !["hidden", "submit", "button"].includes(el.type)
//         ) {
//             let label = "";
//             if (el.labels?.length > 0) label = el.labels[0].innerText;
//             else if (el.closest("label")) label = el.closest("label").innerText;
//             else if (el.placeholder) label = el.placeholder;
//             else if (el.getAttribute("aria-label")) label = el.getAttribute("aria-label");
//             else if (el.parentElement?.className.includes("question-container") || el.closest(".form-group")) {
//                 label = el.closest(".form-group")?.innerText.trim();
//             }

//             fields.push({
//                 name: el.name || el.id || "",
//                 label: label?.trim() || "Untitled",
//                 type: el.type || el.tagName.toLowerCase(),
//             });
//         }
//     });

//     return fields;
// });


//             if (!formFields.length) {
//                 console.warn("No form fields found in modal for job:", jobLink);
//                 continue;
//             }

//             const prompt = `You are an expert job application assistant. Given the following resume and a list of form fields/questions, generate the most appropriate and concise value for each field.

// For each field, reply with a JSON object mapping field names to an object with:
// - 'action': either 'type', 'check', or 'select'
// - 'value': the value to type, check (true/false), or select (radio value)
// - Form fields:
// + Below are the form fields detected from the application form. They include additional questions, inputs, and selections. Please provide accurate, concise, and relevant responses.

// Special Instructions:
// - If a field asks for something the user cannot provide directly (e.g., "record a video and upload a link"), respond with "NA".
// - If the field involves choosing from a list of dates or availability options (e.g., "Are you ready to start from Aug 10 / Aug 17?"), respond with a confident tone like "Yes, the user is keen to start from the earliest possible date".
// - For all yes/no or multiple-choice questions, choose the most relevant and positive option based on the resume content and job intent.
// - Keep the values precise and job-appropriate.

// Example output:
// {
//   "availability": { "action": "type", "value": "Immediate" },
//   "agreeTerms": { "action": "check", "value": true },
//   "gender": { "action": "select", "value": "Male" },
//   "videoIntro": { "action": "type", "value": "NA" },
//   "startDateConfirmation": { "action": "type", "value": "Yes, the user is keen to start from the earliest available date." }
// }

// Resume:
// ${body}

// Form fields:
// ${JSON.stringify(formFields, null, 2)}

// Return ONLY a valid JSON object, no explanation.`;


//             let answers = {};
//             try {
//                 const result = await ai.models.generateContent({
//                     model: "gemini-2.5-flash",
//                     contents: [{ role: "user", parts: [{ text: prompt }] }],
//                 });
//                 const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text;
//                 console.log(text)
//                 answers = JSON.parse(text.replace(/```(?:json)?\n([\s\S]*?)```/, "$1").trim());
//             } catch (llmErr) {
//                 console.error("LLM failed:",llmErr);
//                 continue;
//             }

//             for (const field of formFields) {
//                 const answer = answers[field.name];
//                 if (!answer) continue;

//                 // ✅ Updated hidden file upload logic
//                 // if (
//                 //     field.type === "file" ||
//                 //     field.label.toLowerCase().includes("resume") ||
//                 //     field.name === "custom_resume" ||
//                 //     field.id === "custom_resume"
//                 // ) {
//                 //     try {
//                 //         const inputSelector = 'input#custom_resume[type="file"]';
//                 //         await page.waitForSelector(inputSelector, { visible: false, timeout: 5000 });

//                 //         const inputHandle = await page.$(inputSelector);
//                 //         if (!inputHandle) {
//                 //             console.warn("❌ File input for custom_resume not found.");
//                 //             continue;
//                 //         }

//                 //         await inputHandle.uploadFile(localpath);
//                 //         console.log("✅ File uploaded using Puppeteer's uploadFile().");

//                 //         await page.evaluate(() => {
//                 //             const input = document.querySelector('#custom_resume');
//                 //             if (input) {
//                 //                 input.dispatchEvent(new Event("input", { bubbles: true }));
//                 //                 input.dispatchEvent(new Event("change", { bubbles: true }));
//                 //                 console.log("✅ Dispatch triggered on file input");
//                 //             }
//                 //         });

//                 //         await new Promise((r) => setTimeout(r, 5000));
//                 //     } catch (uploadErr) {
//                 //         console.warn("❌ Resume upload failed:", uploadErr.message);
//                 //     }
//                 //     continue;
//                 // }

//                 //main
// //                 const fileInput = await page.$('input#custom_resume[type="file"]');
// // if (fileInput) {
// //   await page.evaluate(() => {
// //     const fileInput = document.querySelector('input#custom_resume');
// //     fileInput.removeAttribute('style'); // unhide
// //   });

// //   await fileInput.uploadFile(text);

// //   // Fire change event manually
// //   await page.evaluate(() => {
// //     const input = document.querySelector('input#custom_resume');
// //     const event = new Event('change', { bubbles: true });
// //     input.dispatchEvent(event);
// //   });

// //   // 🧠 Wait for file name to reflect (if visible somewhere)
// //   await new Promise((r) => setTimeout(r, 3000));

// //   // ✅ Confirm upload via client-side DOM check
// //   const fileName = await page.evaluate(() => {
// //     const input = document.querySelector('input#custom_resume');
// //     return input?.files?.[0]?.name || 'No file';
// //   });
// //   console.log('📄 Uploaded file:', fileName);
// // } else {
// //   console.log('⚠️ File input not found.');
// // }


//                 if (field.type === "checkbox") {
//                     try {
//                         await page.evaluate((name, shouldCheck) => {
//                             const el = document.querySelector(`[name='${name}']`);
//                             if (el && el.type === "checkbox") {
//                                 el.checked = !!shouldCheck;
//                                 el.dispatchEvent(new Event("change", { bubbles: true }));
//                             }
//                         }, field.name, answer.value);
//                     } catch {}
//                     continue;
//                 }

//                 if (field.type === "radio") {
//                     try {
//                         await page.evaluate((name, value) => {
//                             const radios = document.querySelectorAll(`[name='${name}'][type='radio']`);
//                             for (const radio of radios) {
//                                 if (radio.value === value || radio.labels?.[0]?.innerText === value) {
//                                     radio.checked = true;
//                                     radio.dispatchEvent(new Event("change", { bubbles: true }));
//                                 }
//                             }
//                         }, field.name, answer.value);
//                     } catch {}
//                     continue;
//                 }

//                 if (answer.action === "type" || field.type === "text" || field.type === "textarea") {
//                     try {
//                         await page.evaluate((name, value) => {
//                             const el = document.querySelector(`[name='${name}'], #${name}`);
//                             if (!el) return;
//                             el.value = value;
//                             el.dispatchEvent(new Event("input", { bubbles: true }));
//                         }, field.name, answer.value);
//                     } catch {}
//                     continue;
//                 }

//                 if (answer.action === "select" || field.type === "select") {
//                     try {
//                         await page.evaluate((name, value) => {
//                             const el = document.querySelector(`[name='${name}']`);
//                             if (el?.tagName.toLowerCase() === "select") {
//                                 el.value = value;
//                                 el.dispatchEvent(new Event("change", { bubbles: true }));
//                             }
//                         }, field.name, answer.value);
//                     } catch {}
//                     continue;
//                 }
//             }

//             let submitClicked = false;

// try {
//     const submitBtn = await page.$('div.submit_button_container input[type="submit"]');

//     if (submitBtn) {
//         await submitBtn.click(); // or: await page.click('#submit');
//         // await page.click('#submit');
//         submitClicked = true;
//         console.log("✅ Submit button clicked.");
//     } else {
//         console.warn("⚠️ Submit button not found!");
//     }
// } catch (err) {
//     console.error("❌ Error clicking submit button:", err.message);
// }

// if (submitClicked) {
//     await new Promise((r) => setTimeout(r, 3000));
//     applied++;
// }

//         } catch (err) {
//             console.warn("Error applying to job:", jobLink, err.message);
//         }
//     }

//     await browser.close();
//     return { attempted: jobs.length, applied };
// }
export async function autoApplyOnInternshala(keywords, localpath, text) {
    console.log("localpath", localpath);
    console.log("keywords", keywords);
    console.log('text', text);
    let body = "";
    
    try {
        const result = await mammoth.extractRawText({ path: text });
        body = result.value; // plain text from resume
        if (!body) throw new Error("Resume content is empty");
    } catch (e) {
        console.error("❌ Failed to read resume file:", e.message);
    }

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: CHROME_PATH,
        userDataDir: PROFILE_DIR,
        args: [],
        defaultViewport: null,
    });

    const [page] = await browser.pages();
    await page.goto("https://internshala.com/", {
        waitUntil: "domcontentloaded",
    });

    const isLoggedIn = await waitForLogin(page);
    if (!isLoggedIn) {
        await browser.close();
        throw new Error("Login failed");
    }

    await page.goto("https://internshala.com/internships", {
        waitUntil: "domcontentloaded",
    });

    if (keywords?.length > 0) {
        const searchQuery = Array.isArray(keywords)
            ? keywords.join(", ")
            : keywords;
        await page.waitForSelector("#keywords", {
            visible: true,
            timeout: 10000,
        });
        await page.evaluate(() => (document.querySelector("#keywords").value = ""));
        await page.type("#keywords", searchQuery, { delay: 50 });
        await page.click("#search");
        await page.waitForFunction(() => {
            const cards = document.querySelectorAll(".individual_internship, .internship_meta, .internship_card");
            return Array.from(cards).some((card) => card.offsetParent !== null);
        }, { timeout: 30000 });
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const jobs = await page.evaluate(() => {
        let jobCards = Array.from(document.querySelectorAll(".individual_internship"));
        if (!jobCards.length) {
            jobCards = Array.from(document.querySelectorAll(".internship_meta, .internship_card, .internship-listing, .internship-container"));
        }
        return jobCards.map((card) => card.querySelector("a")?.href).filter(Boolean);
    });

    let applied = 0;
    for (const jobLink of jobs) {
        try {
            console.log("🔄 Processing job:", jobLink);
            await page.goto(jobLink, { waitUntil: "domcontentloaded" });
            await new Promise((r) => setTimeout(r, 2000));

            const applyLink = await page.$('a[href*="/student/interstitial/application"]');
            if (applyLink) {
                const href = await page.evaluate((el) => el.getAttribute("href"), applyLink);
                const fullUrl = new URL(href, "https://internshala.com").href;
                console.log("✅ Navigating to apply URL:", fullUrl);
                await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
                await new Promise((r) => setTimeout(r, 2000));
            }

            await new Promise((r) => setTimeout(r, 3000));

            const proceedBtnClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll("button.proceed-btn, .proceed-btn"));
                let btn = btns.find((b) => b.innerText.trim().toLowerCase().includes("proceed to application"));
                if (!btn) {
                    const allBtns = Array.from(document.querySelectorAll("button, a"));
                    btn = allBtns.find((b) => b.innerText.trim().toLowerCase().includes("proceed to application"));
                }
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (proceedBtnClicked) {
                await new Promise((r) => setTimeout(r, 3000));
            }

            // Wait for the form to load completely
            await page.waitForSelector('#application-form, .application-form', { timeout: 10000 });
            await new Promise((r) => setTimeout(r, 2000));

            console.log("🔍 Detecting form fields...");

            // Get all form fields with comprehensive detection
            const formData = await page.evaluate(() => {
                const fields = [];
                const allInputs = document.querySelectorAll('input, textarea, select');
                
                allInputs.forEach((element, index) => {
                    if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
                        return;
                    }
                    
                    let labelText = '';
                    
                    // Try multiple ways to get label text
                    if (element.labels && element.labels.length > 0) {
                        labelText = element.labels[0].innerText.trim();
                    } else if (element.closest('label')) {
                        labelText = element.closest('label').innerText.trim();
                    } else if (element.placeholder) {
                        labelText = element.placeholder.trim();
                    } else if (element.getAttribute('aria-label')) {
                        labelText = element.getAttribute('aria-label').trim();
                    } else {
                        // Try to find nearby text
                        const parent = element.closest('.form-group, .assessment_question, .question-container');
                        if (parent) {
                            const label = parent.querySelector('label');
                            if (label) {
                                labelText = label.innerText.trim();
                            } else {
                                // Get the first text content
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
                
                console.log('Detected fields:', fields);
                return fields;
            });

            if (!formData.length) {
                console.warn("❌ No form fields found for job:", jobLink);
                continue;
            }

            console.log(`📝 Found ${formData.length} form fields`);

            // Generate AI responses for all fields
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
                console.log("🤖 AI Response:", aiText);
                
                // Clean and parse JSON
                const cleanedText = aiText.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
                answers = JSON.parse(cleanedText);
                console.log("✅ Parsed answers:", answers);
            } catch (llmErr) {
                console.error("❌ AI parsing failed:", llmErr);
                // Fallback answers
                answers = {};
                formData.forEach(field => {
                    if (field.type === 'radio' && field.label.toLowerCase().includes('available')) {
                        answers[field.name] = { action: 'radio', value: 'yes' };
                    } else if (field.type === 'number') {
                        answers[field.name] = { action: 'type', value: '6' };
                    } else if (field.type === 'select') {
                        answers[field.name] = { action: 'select', value: field.options[1]?.value || '3' };
                    }
                });
            }

            // Fill all form fields
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
                        // Handle radio buttons
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
                                    console.log(`✅ Radio selected: ${radio.value}`);
                                    break;
                                }
                            }
                            
                            if (!found && radios.length > 0) {
                                // Default to first radio if no match
                                radios[0].checked = true;
                                radios[0].click();
                                radios[0].dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Radio default selected: ${radios[0].value}`);
                            }
                        }, field.name, String(answer.value));
                        
                    } else if (field.type === 'checkbox') {
                        // Handle checkboxes
                        await page.evaluate((selector, shouldCheck) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.checked = Boolean(shouldCheck);
                                element.click();
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Checkbox ${shouldCheck ? 'checked' : 'unchecked'}`);
                            }
                        }, field.selector, answer.value);
                        
                    } else if (field.tagName === 'select') {
                        // Handle select dropdowns
                        await page.evaluate((selector, value) => {
                            const select = document.querySelector(selector);
                            if (select) {
                                // Try to find matching option
                                const options = Array.from(select.options);
                                const matchingOption = options.find(opt => 
                                    opt.value === value || 
                                    opt.text === value ||
                                    opt.value === String(value)
                                );
                                
                                if (matchingOption) {
                                    select.value = matchingOption.value;
                                } else if (options.length > 1) {
                                    // Default to second option (skip first which is usually placeholder)
                                    select.value = options[1].value;
                                }
                                
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                
                                // Handle chosen.js if present
                                if (window.jQuery && select.classList.contains('chosen-select')) {
                                    jQuery(select).trigger('chosen:updated');
                                }
                                console.log(`✅ Select value set: ${select.value}`);
                            }
                        }, field.selector, String(answer.value));
                        
                    } else if (field.type === 'number') {
                        // Handle number inputs
                        await page.evaluate((selector, value) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.value = String(value);
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Number input set: ${value}`);
                            }
                        }, field.selector, answer.value);
                        
                    } else if (field.type === 'text' || field.type === 'textarea' || field.tagName === 'textarea') {
                        // Handle text inputs and textareas
                        await page.evaluate((selector, value) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.value = String(value);
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                if (element.tagName.toLowerCase() === 'textarea') {
                                    element.dispatchEvent(new Event('keyup', { bubbles: true }));
                                }
                                console.log(`✅ Text input set: ${value}`);
                            }
                        }, field.selector, String(answer.value));
                    }
                    
                    // Wait between field fills
                    await new Promise(r => setTimeout(r, 300));
                    
                } catch (fieldError) {
                    console.error(`❌ Error filling field ${field.name}:`, fieldError);
                }
            }

            // Wait before submitting
            console.log("⏳ Waiting before submit...");
            await new Promise(r => setTimeout(r, 2000));

            // Submit the form
            console.log("🚀 Attempting to submit form...");
            const submitResult = await page.evaluate(() => {
                // Try multiple submit strategies
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
                        console.log(`Found submit button: ${selector}`);
                        submitBtn.click();
                        return { success: true, selector };
                    }
                }
                
                // Try form submission
                const form = document.querySelector('#application-form, .application-form, form');
                if (form) {
                    console.log('Attempting form submit');
                    form.submit();
                    return { success: true, selector: 'form.submit()' };
                }
                
                return { success: false, selector: 'none found' };
            });

            if (submitResult.success) {
                console.log(`✅ Form submitted using: ${submitResult.selector}`);
                await new Promise(r => setTimeout(r, 5000)); // Wait for submission
                applied++;
            } else {
                console.warn("❌ Could not find submit button");
            }

        } catch (jobError) {
            console.error(`❌ Error processing job ${jobLink}:`, jobError);
        }
    }

    await browser.close();
    console.log(`🎉 Process completed. Applied to ${applied}/${jobs.length} jobs`);
    return { attempted: jobs.length, applied };
}