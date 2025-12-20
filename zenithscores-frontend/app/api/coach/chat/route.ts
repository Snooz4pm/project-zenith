import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const COACH_SYSTEM_PROMPT = `You are a professional trading coach with Wall Street experience. You speak directly and honestly, focusing on discipline over outcomes.

Your personality:
- Brutally honest but encouraging
- Focus on process over results
- Call out emotional trading and rule-breaking
- Praise discipline and risk management
- Never give specific financial advice
- Never mention being an AI

Key principles you teach:
1. Risk management is everything - never risk more than 2% per trade
2. Process over outcome - good trades can lose, bad trades can win
3. Emotional control - revenge trading is account suicide
4. Position sizing - size down after wins, way down after losses
5. Stop losses are non-negotiable - set it before you enter

Keep responses concise (under 100 words). Be conversational but professional.`;

export async function POST(request: NextRequest) {
    try {
        const { message, context, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        // Build context-aware prompt
        let contextInfo = '';
        if (context) {
            if (context.disciplineScore) {
                contextInfo += `User discipline score: ${context.disciplineScore}/100. `;
            }
            if (context.winStreak) {
                contextInfo += `Current win streak: ${context.winStreak}. `;
            }
            if (context.recentTrades && context.recentTrades.length > 0) {
                const trades = context.recentTrades
                    .slice(0, 3)
                    .map((t: { symbol: string; pnl: number }) => `${t.symbol}: ${t.pnl >= 0 ? '+' : ''}${t.pnl}%`)
                    .join(', ');
                contextInfo += `Recent trades: ${trades}. `;
            }
            if (context.currentPosition) {
                contextInfo += `Current position: ${context.currentPosition.symbol} at ${context.currentPosition.entry}. `;
            }
        }

        // Format conversation history
        const conversationHistory = history?.map((h: { role: string; content: string }) =>
            `${h.role === 'user' ? 'Trader' : 'Coach'}: ${h.content}`
        ).join('\n') || '';

        const fullPrompt = `${COACH_SYSTEM_PROMPT}

${contextInfo ? `Context: ${contextInfo}` : ''}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ''}

Trader: ${message}

Coach:`;

        // Call Gemini API
        if (!GEMINI_API_KEY) {
            // Return fallback response if no API key
            return NextResponse.json({
                response: getFallbackResponse(message),
                type: 'tip'
            });
        }

        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 200,
                    topP: 0.9
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            })
        });

        if (!geminiResponse.ok) {
            console.error('Gemini API error:', await geminiResponse.text());
            return NextResponse.json({
                response: getFallbackResponse(message),
                type: 'tip'
            });
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(message);

        // Determine response type based on content
        let responseType: 'analysis' | 'tip' | 'warning' | 'praise' = 'analysis';
        if (responseText.includes('⚠️') || responseText.includes('warning') || responseText.includes('careful')) {
            responseType = 'warning';
        } else if (responseText.includes('👏') || responseText.includes('great') || responseText.includes('excellent')) {
            responseType = 'praise';
        }

        return NextResponse.json({
            response: responseText.trim(),
            type: responseType
        });

    } catch (error) {
        console.error('Coach API error:', error);
        return NextResponse.json({
            response: "Focus on your risk management. That's always the right answer.",
            type: 'tip'
        });
    }
}

function getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Context-aware fallback responses
    if (lowerMessage.includes('risk') || lowerMessage.includes('position size')) {
        return "Risk management rule: Never risk more than 2% on a single trade. If you're asking, you're probably already overexposed. Size down.";
    }

    if (lowerMessage.includes('loss') || lowerMessage.includes('lost')) {
        return "Losses are tuition. What matters is: did you follow your rules? If yes, the loss is just variance. If no, that's the real problem to fix.";
    }

    if (lowerMessage.includes('win') || lowerMessage.includes('profit')) {
        return "Nice win! But don't get cocky. Size down on your next trade. Overconfidence after wins kills more accounts than bad analysis.";
    }

    if (lowerMessage.includes('entry') || lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
        return "Before entering: 1) Where's your stop? 2) What's your size? 3) What's the thesis? If you can't answer all three clearly, don't trade.";
    }

    if (lowerMessage.includes('revenge')) {
        return "⚠️ Revenge trading is account suicide. Step away from the screen. Go for a walk. The market will be here tomorrow. Your capital might not be if you revenge trade.";
    }

    // Default responses
    const defaults = [
        "Process over outcome. Did you follow your rules? That's the only question that matters.",
        "The best trade is often no trade. FOMO kills accounts.",
        "What's your stop loss? If you don't know, you shouldn't be in the trade.",
        "Size down. I don't care how confident you are. Size. Down.",
        "Are you trading or gambling? Be honest with yourself."
    ];

    return defaults[Math.floor(Math.random() * defaults.length)];
}
