import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

export async function parseResumeWithGemini(resumeText) {
  const prompt = `
You are a resume analyzer. Given a plain text resume, extract the following fields and return ONLY a valid JSON object with no extra explanation or formatting.

{
  "name": "",
  "email": "",
  "skills": [],
  "interests": [],
  "degree": "",
  "experience": [],
  "locationPreference": "",
  "applyKeywords": []
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
