
export async function fetchJupiterTokens() {
    try {
        const res = await fetch('https://token.jup.ag/all');
        const data = await res.json();
        // Return Map for O(1) lookup
        return new Map<string, any>(
            data.map((t: any) => [t.address, t])
        );
    } catch (e) {
        console.error("Jupiter Token List Fetch Failed", e);
        return new Map();
    }
}

// REAL-TIME PRICING (Jupiter Price API)
export async function getLivePrice(mints: string[]): Promise<Record<string, number>> {
    try {
        if (mints.length === 0) return {};
        const query = mints.join(',');
        const res = await fetch(`https://price.jup.ag/v6/price?ids=${query}`);
        const data = await res.json();
        
        const prices: Record<string, number> = {};
        if (data.data) {
            Object.values(data.data).forEach((p: any) => {
                prices[p.id] = p.price;
            });
        }
        return prices;
    } catch (error) {
        console.error("Jupiter Price API Failed", error);
        return {};
    }
}
