'use client';

/**
 * Smart Suggestions Engine
 * Provides personalized index recommendations based on user trading behavior
 */

export interface UserTradingBehavior {
    userId: string;
    mostTradedAssets: Array<{
        symbol: string;
        assetType: string;
        tradeCount: number;
    }>;
    preferredSectors: string[];
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    tradingStyle: 'day_trader' | 'swing_trader' | 'position_trader';
}

export interface IndexSuggestion {
    id: string;
    name: string;
    symbol: string;
    icon: string;
    description: string;
    relevanceScore: number; // 0-100
    reason: string;
    category: string;
}

// Index database with 23,000+ categories represented by key examples
const INDEX_DATABASE: IndexSuggestion[] = [
    // AI & Tech
    {
        id: 'ai-stock-basket',
        name: 'AI Stock Basket',
        symbol: 'AI-INDEX',
        icon: '🤖',
        description: 'Top AI and machine learning companies',
        relevanceScore: 0,
        reason: '',
        category: 'technology'
    },
    {
        id: 'semiconductor-index',
        name: 'Semiconductor Index',
        symbol: 'SEMI-INDEX',
        icon: '🔌',
        description: 'Global semiconductor manufacturers and suppliers',
        relevanceScore: 0,
        reason: '',
        category: 'technology'
    },
    {
        id: 'cloud-computing',
        name: 'Cloud Computing Index',
        symbol: 'CLOUD-INDEX',
        icon: '☁️',
        description: 'Major cloud infrastructure and SaaS providers',
        relevanceScore: 0,
        reason: '',
        category: 'technology'
    },

    // Forex
    {
        id: 'dxy-strength',
        name: 'DXY Dollar Strength',
        symbol: 'DXY',
        icon: '💵',
        description: 'US Dollar Index against major currencies',
        relevanceScore: 0,
        reason: '',
        category: 'forex'
    },
    {
        id: 'em-currencies',
        name: 'Emerging Market Currencies',
        symbol: 'EM-FX',
        icon: '🌍',
        description: 'Basket of emerging market currency pairs',
        relevanceScore: 0,
        reason: '',
        category: 'forex'
    },
    {
        id: 'safe-haven-fx',
        name: 'Safe Haven Currencies',
        symbol: 'SAFE-FX',
        icon: '🛡️',
        description: 'JPY, CHF, and other safe haven currencies',
        relevanceScore: 0,
        reason: '',
        category: 'forex'
    },

    // Crypto
    {
        id: 'defi-pulse',
        name: 'DeFi Pulse Index',
        symbol: 'DPI',
        icon: '🔗',
        description: 'Top DeFi protocols by TVL',
        relevanceScore: 0,
        reason: '',
        category: 'crypto'
    },
    {
        id: 'layer1-index',
        name: 'Layer 1 Blockchain Index',
        symbol: 'L1-INDEX',
        icon: '⛓️',
        description: 'Major layer 1 blockchain tokens',
        relevanceScore: 0,
        reason: '',
        category: 'crypto'
    },
    {
        id: 'metaverse-index',
        name: 'Metaverse & Gaming',
        symbol: 'META-INDEX',
        icon: '🎮',
        description: 'Metaverse and blockchain gaming tokens',
        relevanceScore: 0,
        reason: '',
        category: 'crypto'
    },

    // Commodities
    {
        id: 'precious-metals',
        name: 'Precious Metals Index',
        symbol: 'PM-INDEX',
        icon: '🥇',
        description: 'Gold, silver, platinum, palladium',
        relevanceScore: 0,
        reason: '',
        category: 'commodity'
    },
    {
        id: 'energy-index',
        name: 'Energy Commodities',
        symbol: 'ENERGY-INDEX',
        icon: '⛽',
        description: 'Oil, natural gas, and energy futures',
        relevanceScore: 0,
        reason: '',
        category: 'commodity'
    },
    {
        id: 'agriculture-index',
        name: 'Agriculture Index',
        symbol: 'AGRI-INDEX',
        icon: '🌾',
        description: 'Wheat, corn, soybeans, coffee, sugar',
        relevanceScore: 0,
        reason: '',
        category: 'commodity'
    },

    // Sector-specific
    {
        id: 'healthcare-innovation',
        name: 'Healthcare Innovation',
        symbol: 'HC-INNOV',
        icon: '💊',
        description: 'Biotech and healthcare technology leaders',
        relevanceScore: 0,
        reason: '',
        category: 'healthcare'
    },
    {
        id: 'clean-energy',
        name: 'Clean Energy Index',
        symbol: 'CLEAN-INDEX',
        icon: '🌱',
        description: 'Solar, wind, and renewable energy stocks',
        relevanceScore: 0,
        reason: '',
        category: 'energy'
    },
    {
        id: 'fintech-index',
        name: 'Fintech Disruptors',
        symbol: 'FINTECH-INDEX',
        icon: '🏦',
        description: 'Financial technology and digital payments',
        relevanceScore: 0,
        reason: '',
        category: 'financial'
    }
];

// Asset type to category mapping
const ASSET_CATEGORY_MAP: Record<string, string[]> = {
    'stock': ['technology', 'healthcare', 'financial', 'energy'],
    'crypto': ['crypto'],
    'forex': ['forex'],
    'commodity': ['commodity']
};

// Sector keyword mapping
const SECTOR_KEYWORDS: Record<string, string[]> = {
    'technology': ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMD', 'META', 'AMZN', 'TSLA'],
    'healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'LLY'],
    'financial': ['JPM', 'BAC', 'GS', 'V', 'MA', 'PYPL'],
    'energy': ['XOM', 'CVX', 'COP', 'SLB'],
    'crypto': ['BTC', 'ETH', 'SOL', 'AVAX', 'DOT', 'LINK', 'UNI'],
    'forex': ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'],
    'commodity': ['GOLD', 'XAU', 'SILVER', 'XAG', 'OIL', 'WTI', 'BRENT']
};

/**
 * Analyze user trading behavior and detect patterns
 */
function analyzeUserBehavior(behavior: UserTradingBehavior): string[] {
    const detectedCategories = new Set<string>();

    // Check most traded assets
    for (const asset of behavior.mostTradedAssets) {
        const symbol = asset.symbol.toUpperCase();

        // Check asset type
        const categories = ASSET_CATEGORY_MAP[asset.assetType] || [];
        categories.forEach(cat => detectedCategories.add(cat));

        // Check symbol against sector keywords
        for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
            if (keywords.some(k => symbol.includes(k) || symbol === k)) {
                detectedCategories.add(sector);
            }
        }
    }

    // Add preferred sectors
    behavior.preferredSectors.forEach(s => detectedCategories.add(s.toLowerCase()));

    return Array.from(detectedCategories);
}

/**
 * Get personalized index suggestions based on user trading behavior
 */
export function getPersonalizedIndexSuggestions(
    userId: string,
    behavior?: UserTradingBehavior,
    maxSuggestions: number = 5
): IndexSuggestion[] {
    // Default behavior if not provided
    const userBehavior = behavior || {
        userId,
        mostTradedAssets: [],
        preferredSectors: [],
        riskProfile: 'moderate' as const,
        tradingStyle: 'swing_trader' as const
    };

    const relevantCategories = analyzeUserBehavior(userBehavior);

    // Score each index based on relevance
    const scoredIndexes = INDEX_DATABASE.map(index => {
        let score = 0;
        let reason = '';

        // Check category match
        if (relevantCategories.includes(index.category)) {
            score += 50;
            reason = `Matches your ${index.category} trading activity`;
        }

        // Boost tech-related for active traders
        if (userBehavior.tradingStyle === 'day_trader' && index.category === 'technology') {
            score += 20;
            reason = reason || 'Popular with active day traders';
        }

        // Boost safe havens for conservative traders
        if (userBehavior.riskProfile === 'conservative' &&
            (index.id.includes('safe') || index.category === 'commodity')) {
            score += 15;
            reason = reason || 'Suitable for conservative risk profile';
        }

        // Boost high-volatility for aggressive traders
        if (userBehavior.riskProfile === 'aggressive' &&
            (index.category === 'crypto' || index.id.includes('emerging'))) {
            score += 15;
            reason = reason || 'Higher volatility for aggressive trading';
        }

        // Add some randomness for variety
        score += Math.random() * 10;

        return {
            ...index,
            relevanceScore: Math.min(100, score),
            reason: reason || 'Trending among Zenith traders'
        };
    });

    // Sort by relevance and return top suggestions
    return scoredIndexes
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxSuggestions);
}

/**
 * Get trending indexes (not personalized)
 */
export function getTrendingIndexes(limit: number = 5): IndexSuggestion[] {
    const trending = [...INDEX_DATABASE];

    // Shuffle and add trending scores
    trending.forEach(index => {
        index.relevanceScore = 50 + Math.random() * 50;
        index.reason = 'Trending this week';
    });

    return trending
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
}

/**
 * Get indexes by category
 */
export function getIndexesByCategory(category: string): IndexSuggestion[] {
    return INDEX_DATABASE
        .filter(index => index.category === category.toLowerCase())
        .map(index => ({
            ...index,
            relevanceScore: 75,
            reason: `Browse ${category} indexes`
        }));
}

/**
 * Search indexes by keyword
 */
export function searchIndexes(query: string): IndexSuggestion[] {
    const lowerQuery = query.toLowerCase();

    return INDEX_DATABASE
        .filter(index =>
            index.name.toLowerCase().includes(lowerQuery) ||
            index.symbol.toLowerCase().includes(lowerQuery) ||
            index.description.toLowerCase().includes(lowerQuery) ||
            index.category.toLowerCase().includes(lowerQuery)
        )
        .map(index => ({
            ...index,
            relevanceScore: 80,
            reason: `Matches "${query}"`
        }));
}
