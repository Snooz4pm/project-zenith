
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface DeepDiveRequest {
    name: string;
    symbol: string;
    assetType: string;
    regime: string;
    context: string;
}

export async function generateDeepDive(req: DeepDiveRequest): Promise<string> {
    if (!API_KEY) return "Deep Dive Unavailable (Missing Key)";

    const prompt = `
You are a professor of financial markets explaining market structure to a professional trader.

Asset: ${req.name} (${req.symbol})
Type: ${req.assetType}
Regime: ${req.regime}
Context: ${req.context}

Task: Write a comprehensive Deep Dive Report with EXACTLY these 4 text sections (The 5th section is the Chart, which is rendered separately).

Structure:
# 1. Asset Overview
(Origin, Industry/Sector, Market Role. 2-3 sentences.)

# 2. What Drives Price
(Macro factors, Sector correlations, Typical behavior. Bullet points.)

# 3. Zenith Structural View
(Analyze the current ${req.regime} regime. Describe historical behavior patterns for this asset. Why is it moving this way?)

# 4. Risks & Invalidations
(Structural failures, key levels to watch, market risks.)

Rules:
- Persona: Professor / Institutional Strategist.
- Tone: High-level, educational, credible.
- NO prediction, NO targets.
- Format: Markdown.
`.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Deep Dive Error:", error);
        return "Deep Dive currently unavailable.";
    }
}
