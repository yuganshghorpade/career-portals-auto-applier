import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

export async function parseResumeWithGemini(resumeText) {
const prompt = `
You are a resume analyzer. Given a plain text resume, extract the following fields and return ONLY a valid JSON object with no extra explanation or formatting.

⚠️ This is for a project that performs automated job searches using extracted keywords. Therefore:

- The \`applyKeywords\` field must contain **only concrete, job-relevant keywords** like technologies, tools, domains, or job roles.
- ❌ DO NOT include vague or soft skills like "hardworking", "dedicated", "motivated", "team player", etc.
- ✅ Include only relevant technical or domain-specific terms suitable for job search filters.

📌 The \`applyKeywords\` value must be a **single string** of **1 to 4 keywords**, where each keyword is 1–3 words long. Use a **single space** to separate them. Do NOT include commas, quotation marks, or brackets.

✅ If the resume clearly has only 1 relevant keyword (e.g., "Biotechnology"), return just that one. Do NOT try to force 4 keywords.

Example format for applyKeywords: Machine Learning Web Development Python Finance

{
  "name": "",
  "email": "",
  "skills": [],
  "interests": [],
  "degree": "",
  "experience": [],
  "locationPreference": "",
  "applyKeywords": ""
}

Here is the resume text:
"""${resumeText}"""
`;







  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text;

    const parsed = extractJSONFromGeminiText(text);

    return parsed;
  } catch (error) {
    console.error("Resume parsing failed:", error.message);
    return null;
  }
}

function extractJSONFromGeminiText(text) {
  const cleaned = text.replace(/```(?:json)?\n([\s\S]*?)```/, '$1').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse JSON from Gemini:", err.message);
    throw err;
  }
}
