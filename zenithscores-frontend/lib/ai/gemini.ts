
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface MarketContextRequest {
    name: string;
    symbol: string;
    assetType: string;
    regime: string;
    zones: string; // Summarized zone info
    context: string; // Volatility, volume, etc.
}

export async function generateMarketContext(req: MarketContextRequest): Promise<string> {
    if (!API_KEY) return "AI Analysis Unavailable (Missing Key)";

    const prompt = `
You are a market analyst explaining price behavior.

Asset:
- Name: ${req.name}
- Symbol: ${req.symbol}
- Asset type: ${req.assetType}
- Current regime: ${req.regime}
- Detected zones: ${req.zones}
- Recent volatility & volume context: ${req.context}

Explain:
1. What is happening structurally (not price prediction)
2. Why this move matters (context, not hype)
3. What would invalidate this structure

Rules:
- Do NOT say buy, sell, TP, SL
- Do NOT predict price
- Use neutral, educational language
- Assume the reader is learning
- Keep it concise (max 150 words)
- Format with simple Markdown headers:
  ### Market Structure
  ### Why This Matters
  ### Invalidation Conditions
`.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Analysis currently unavailable due to high demand.";
    }
}
